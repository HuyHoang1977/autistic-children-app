# comment_controller.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.comments_model import Comment
from app.models.users_model import User
from app.models.contents_model import Content
from app.extensions import db
from sqlalchemy import desc
import logging

logger = logging.getLogger(__name__)

comment_bp = Blueprint('comments', __name__, url_prefix='/api/v1/comments')


@comment_bp.route('', methods=['GET'])
def get_comments():
    """
    Get comments for a specific content or all comments
    """
    try:
        content_id = request.args.get('content_id', type=int)
        user_id = request.args.get('user_id', type=int)
        parent_comment_id = request.args.get('parent_comment_id', type=int)
        is_approved = request.args.get('is_approved', type=bool, default=True)
        limit = request.args.get('limit', type=int, default=50)
        page = request.args.get('page', type=int, default=1)

        # Build query
        query = db.session.query(Comment).join(User)

        if content_id:
            query = query.filter(Comment.content_id == content_id)

        if user_id:
            query = query.filter(Comment.user_id == user_id)

        if parent_comment_id is not None:
            query = query.filter(Comment.parent_comment_id == parent_comment_id)
        else:
            # Only get parent comments if not specified
            query = query.filter(Comment.parent_comment_id.is_(None))

        if is_approved is not None:
            query = query.filter(Comment.is_approved == is_approved)

        # Order by creation date (newest first)
        query = query.order_by(desc(Comment.created_at))

        # Pagination
        offset = (page - 1) * limit
        comments = query.offset(offset).limit(limit).all()

        # Format response with user info
        result = []
        for comment in comments:
            comment_data = comment.to_dict()
            comment_data['user'] = {
                'user_id': comment.user.user_id,
                'username': comment.user.username,
                'full_name': comment.user.full_name,
                'avatar_url': comment.user.avatar_url
            }

            # Get replies if this is a parent comment
            if not comment.parent_comment_id:
                replies = db.session.query(Comment).join(User).filter(
                    Comment.parent_comment_id == comment.comment_id,
                    Comment.is_approved == True
                ).order_by(Comment.created_at).all()

                comment_data['replies'] = []
                for reply in replies:
                    reply_data = reply.to_dict()
                    reply_data['user'] = {
                        'user_id': reply.user.user_id,
                        'username': reply.user.username,
                        'full_name': reply.user.full_name,
                        'avatar_url': reply.user.avatar_url
                    }
                    comment_data['replies'].append(reply_data)

            result.append(comment_data)

        return jsonify({
            'success': True,
            'data': result,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': query.count()
            }
        })

    except Exception as e:
        logger.error(f'Error getting comments: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to get comments'
        }), 500


@comment_bp.route('', methods=['POST'])
@jwt_required()
def create_comment():
    """
    Create new comment
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        content_id = data.get('content_id')
        comment_text = data.get('comment_text', '').strip()
        parent_comment_id = data.get('parent_comment_id')

        # Validation
        if not content_id or not comment_text:
            return jsonify({
                'success': False,
                'error': 'content_id and comment_text are required'
            }), 400

        if len(comment_text) > 1000:
            return jsonify({
                'success': False,
                'error': 'Comment text too long (max 1000 characters)'
            }), 400

        # Check if content exists
        content = db.session.query(Content).filter_by(content_id=content_id).first()
        if not content:
            return jsonify({
                'success': False,
                'error': 'Content not found'
            }), 404

        # Check if parent comment exists (if replying)
        if parent_comment_id:
            parent_comment = db.session.query(Comment).filter_by(
                comment_id=parent_comment_id,
                content_id=content_id
            ).first()
            if not parent_comment:
                return jsonify({
                    'success': False,
                    'error': 'Parent comment not found'
                }), 404

        # Create comment
        comment = Comment(
            content_id=content_id,
            user_id=user_id,
            parent_comment_id=parent_comment_id,
            comment_text=comment_text,
            is_approved=True  # Auto-approve for now
        )

        db.session.add(comment)
        db.session.commit()

        # Get comment with user info
        comment_with_user = db.session.query(Comment).join(User).filter(
            Comment.comment_id == comment.comment_id
        ).first()

        # Format response
        result = comment_with_user.to_dict()
        result['user'] = {
            'user_id': comment_with_user.user.user_id,
            'username': comment_with_user.user.username,
            'full_name': comment_with_user.user.full_name,
            'avatar_url': comment_with_user.user.avatar_url
        }

        logger.info(f'Comment created by user {user_id} on content {content_id}')

        return jsonify({
            'success': True,
            'data': result,
            'message': 'Comment created successfully'
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f'Error creating comment: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to create comment'
        }), 500


@comment_bp.route('/<int:comment_id>', methods=['PUT'])
@jwt_required()
def update_comment(comment_id):
    """
    Update comment (only by owner)
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        comment_text = data.get('comment_text', '').strip()

        if not comment_text:
            return jsonify({
                'success': False,
                'error': 'comment_text is required'
            }), 400

        if len(comment_text) > 1000:
            return jsonify({
                'success': False,
                'error': 'Comment text too long (max 1000 characters)'
            }), 400

        # Get comment
        comment = db.session.query(Comment).filter_by(comment_id=comment_id).first()
        if not comment:
            return jsonify({
                'success': False,
                'error': 'Comment not found'
            }), 404

        # Check ownership
        if comment.user_id != user_id:
            return jsonify({
                'success': False,
                'error': 'You can only edit your own comments'
            }), 403

        # Update comment
        comment.comment_text = comment_text
        db.session.commit()

        # Get updated comment with user info
        updated_comment = db.session.query(Comment).join(User).filter(
            Comment.comment_id == comment_id
        ).first()

        result = updated_comment.to_dict()
        result['user'] = {
            'user_id': updated_comment.user.user_id,
            'username': updated_comment.user.username,
            'full_name': updated_comment.user.full_name,
            'avatar_url': updated_comment.user.avatar_url
        }

        logger.info(f'Comment {comment_id} updated by user {user_id}')

        return jsonify({
            'success': True,
            'data': result,
            'message': 'Comment updated successfully'
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f'Error updating comment: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to update comment'
        }), 500


@comment_bp.route('/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    """
    Delete comment (only by owner or admin)
    """
    try:
        user_id = get_jwt_identity()

        # Get comment
        comment = db.session.query(Comment).filter_by(comment_id=comment_id).first()
        if not comment:
            return jsonify({
                'success': False,
                'error': 'Comment not found'
            }), 404

        # Check ownership (or admin privileges - you might want to add admin check)
        if comment.user_id != user_id:
            return jsonify({
                'success': False,
                'error': 'You can only delete your own comments'
            }), 403

        # Delete replies first
        replies = db.session.query(Comment).filter_by(parent_comment_id=comment_id).all()
        for reply in replies:
            db.session.delete(reply)

        # Delete main comment
        db.session.delete(comment)
        db.session.commit()

        logger.info(f'Comment {comment_id} deleted by user {user_id}')

        return jsonify({
            'success': True,
            'message': 'Comment deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f'Error deleting comment: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to delete comment'
        }), 500


@comment_bp.route('/<int:comment_id>/like', methods=['POST'])
@jwt_required()
def toggle_comment_like(comment_id):
    """
    Toggle like on comment
    """
    try:
        user_id = get_jwt_identity()

        # Get comment
        comment = db.session.query(Comment).filter_by(comment_id=comment_id).first()
        if not comment:
            return jsonify({
                'success': False,
                'error': 'Comment not found'
            }), 404

        # For simplicity, just increment/decrement like count
        # In a real app, you'd want a separate CommentLike table
        # to track who liked what and prevent duplicate likes

        # This is a simplified implementation
        action = request.get_json().get('action', 'toggle')

        if action == 'like':
            comment.like_count = (comment.like_count or 0) + 1
            liked = True
        elif action == 'unlike':
            comment.like_count = max(0, (comment.like_count or 0) - 1)
            liked = False
        else:  # toggle
            # Simple toggle for demo - in real app, check if user already liked
            comment.like_count = (comment.like_count or 0) + 1
            liked = True

        db.session.commit()

        logger.info(f'Comment {comment_id} like toggled by user {user_id}')

        return jsonify({
            'success': True,
            'data': {
                'liked': liked,
                'like_count': comment.like_count
            }
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f'Error toggling comment like: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to toggle comment like'
        }), 500


@comment_bp.route('/my-comments', methods=['GET'])
@jwt_required()
def get_my_comments():
    """
    Get current user's comments
    """
    try:
        user_id = get_jwt_identity()

        limit = request.args.get('limit', type=int, default=20)
        page = request.args.get('page', type=int, default=1)

        # Get user's comments
        query = db.session.query(Comment).join(User).join(Content).filter(
            Comment.user_id == user_id
        ).order_by(desc(Comment.created_at))

        offset = (page - 1) * limit
        comments = query.offset(offset).limit(limit).all()

        # Format response
        result = []
        for comment in comments:
            comment_data = comment.to_dict()
            comment_data['content'] = {
                'content_id': comment.content.content_id,
                'title': comment.content.title,
                'content_type': comment.content.content_type
            }
            result.append(comment_data)

        return jsonify({
            'success': True,
            'data': result,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': query.count()
            }
        })

    except Exception as e:
        logger.error(f'Error getting user comments: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to get user comments'
        }), 500


@comment_bp.route('/<int:comment_id>/report', methods=['POST'])
@jwt_required()
def report_comment(comment_id):
    """
    Report inappropriate comment
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        reason = data.get('reason', '').strip()

        if not reason:
            return jsonify({
                'success': False,
                'error': 'Reason is required'
            }), 400

        # Get comment
        comment = db.session.query(Comment).filter_by(comment_id=comment_id).first()
        if not comment:
            return jsonify({
                'success': False,
                'error': 'Comment not found'
            }), 404

        # In a real app, you'd store this in a reports table
        # For now, just log it
        logger.warning(f'Comment {comment_id} reported by user {user_id}. Reason: {reason}')

        return jsonify({
            'success': True,
            'message': 'Comment reported successfully'
        })

    except Exception as e:
        logger.error(f'Error reporting comment: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to report comment'
        }), 500