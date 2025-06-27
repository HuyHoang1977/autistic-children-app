import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.comments_model import Comment
from app.models.contents_model import Content
from app.models.users_model import User
from app.extensions import db
from datetime import datetime
from sqlalchemy import desc

# Configure logging
logger = logging.getLogger(__name__)
bp = Blueprint('comments', __name__)


def get_user_id_from_jwt():
    """Helper function to get user_id from JWT"""
    try:
        current_user_identity = get_jwt_identity()
        if isinstance(current_user_identity, str):
            return int(current_user_identity)
        return current_user_identity
    except (ValueError, TypeError):
        return None


# ✅ CORS preflight handlers
def cors_preflight_response():
    """Common CORS preflight response"""
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response, 200


@bp.route('', methods=['OPTIONS'])
@bp.route('/', methods=['OPTIONS'])
def comments_list_options():
    """Handle CORS preflight requests for comments list"""
    return cors_preflight_response()


@bp.route('/<int:comment_id>', methods=['OPTIONS'])
def comment_detail_options(comment_id):
    """Handle CORS preflight requests for comment detail"""
    return cors_preflight_response()


# ✅ GET Comments - lấy comments cho một content_id
@bp.route('', methods=['GET'])
@bp.route('/', methods=['GET'])
def get_comments():
    """Get comments for a specific content or all comments"""
    try:
        content_id = request.args.get('content_id', type=int)
        user_id = request.args.get('user_id', type=int)
        parent_comment_id = request.args.get('parent_comment_id', type=int)
        is_approved = request.args.get('is_approved', type=bool, default=True)
        limit = request.args.get('limit', type=int, default=50)
        page = request.args.get('page', type=int, default=1)

        logger.info(f'📡 Fetching comments: content_id={content_id}, limit={limit}, page={page}')

        # Build query
        query = db.session.query(Comment).join(User)

        # ✅ CRITICAL FIX: Kiểm tra content_id trước
        if content_id:
            # Kiểm tra xem content có tồn tại không (có thể là article_id)
            from app.models.articles_model import Article

            # Tìm article có article_id = content_id
            article = db.session.query(Article).filter_by(article_id=content_id).first()

            if article:
                # Sử dụng content_id từ article, hoặc chính article_id
                actual_content_id = article.content_id if article.content_id else content_id
                query = query.filter(Comment.content_id == actual_content_id)
                logger.info(f'📋 Using content_id: {actual_content_id} for article_id: {content_id}')
            else:
                # Nếu không tìm thấy article, sử dụng content_id trực tiếp
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
        total_count = query.count()
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

        logger.info(f'✅ Found {len(result)} comments for content_id={content_id}')

        return jsonify({
            'success': True,
            'data': result,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'total_pages': (total_count + limit - 1) // limit,
                'has_more': offset + limit < total_count
            }
        }), 200

    except Exception as e:
        logger.error(f'❌ Error getting comments: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to get comments: {str(e)}'
        }), 500


# ✅ POST Comments - tạo comment mới
@bp.route('', methods=['POST'])
@bp.route('/', methods=['POST'])
@jwt_required()
def create_comment():
    """Create new comment"""
    try:
        user_id = get_user_id_from_jwt()
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity'
            }), 422

        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400

        content_id = data.get('content_id')
        comment_text = data.get('comment_text', '').strip()
        parent_comment_id = data.get('parent_comment_id')

        logger.info(f'📡 Creating comment: user_id={user_id}, content_id={content_id}')

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

        # ✅ CRITICAL FIX: Handle article_id as content_id
        actual_content_id = content_id

        # Kiểm tra xem content_id có phải là article_id không
        from app.models.articles_model import Article
        article = db.session.query(Article).filter_by(article_id=content_id).first()

        if article:
            # Sử dụng content_id từ article, hoặc tạo content record mới
            if article.content_id:
                actual_content_id = article.content_id
            else:
                # Tạo content record mới cho article này
                new_content = Content(
                    author_id=article.author_id,
                    title=article.title,
                    content_type=1,  # Article type
                    is_published=True
                )
                db.session.add(new_content)
                db.session.flush()

                # Update article với content_id mới
                article.content_id = new_content.content_id
                actual_content_id = new_content.content_id

                logger.info(f'✅ Created new content record: {actual_content_id} for article: {content_id}')

        # Check if parent comment exists (if replying)
        if parent_comment_id:
            parent_comment = db.session.query(Comment).filter_by(
                comment_id=parent_comment_id,
                content_id=actual_content_id
            ).first()
            if not parent_comment:
                return jsonify({
                    'success': False,
                    'error': 'Parent comment not found'
                }), 404

        # Create comment
        comment = Comment(
            content_id=actual_content_id,
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

        logger.info(f'✅ Comment created: {comment.comment_id} by user {user_id}')

        return jsonify({
            'success': True,
            'data': result,
            'message': 'Comment created successfully'
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f'❌ Error creating comment: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to create comment: {str(e)}'
        }), 500


# ✅ PUT Comments - cập nhật comment
@bp.route('/<int:comment_id>', methods=['PUT'])
@jwt_required()
def update_comment(comment_id):
    """Update comment (only by owner)"""
    try:
        user_id = get_user_id_from_jwt()
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity'
            }), 422

        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400

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
        comment.updated_at = datetime.utcnow()
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

        logger.info(f'✅ Comment {comment_id} updated by user {user_id}')

        return jsonify({
            'success': True,
            'data': result,
            'message': 'Comment updated successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f'❌ Error updating comment: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to update comment: {str(e)}'
        }), 500


# ✅ DELETE Comments - xóa comment
@bp.route('/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    """Delete comment (only by owner)"""
    try:
        user_id = get_user_id_from_jwt()
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity'
            }), 422

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
                'error': 'You can only delete your own comments'
            }), 403

        # Delete replies first
        replies = db.session.query(Comment).filter_by(parent_comment_id=comment_id).all()
        for reply in replies:
            db.session.delete(reply)

        # Delete main comment
        db.session.delete(comment)
        db.session.commit()

        logger.info(f'✅ Comment {comment_id} deleted by user {user_id}')

        return jsonify({
            'success': True,
            'message': 'Comment deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f'❌ Error deleting comment: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to delete comment: {str(e)}'
        }), 500


# ✅ POST Like - toggle like comment
@bp.route('/<int:comment_id>/like', methods=['POST'])
@jwt_required()
def toggle_comment_like(comment_id):
    """Toggle like on comment"""
    try:
        user_id = get_user_id_from_jwt()
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity'
            }), 422

        # Get comment
        comment = db.session.query(Comment).filter_by(comment_id=comment_id).first()
        if not comment:
            return jsonify({
                'success': False,
                'error': 'Comment not found'
            }), 404

        # For simplicity, just increment/decrement like count
        # In a real app, you'd want a separate CommentLike table
        data = request.get_json() or {}
        action = data.get('action', 'toggle')

        if action == 'like':
            comment.like_count = (comment.like_count or 0) + 1
            liked = True
        elif action == 'unlike':
            comment.like_count = max(0, (comment.like_count or 0) - 1)
            liked = False
        else:  # toggle
            comment.like_count = (comment.like_count or 0) + 1
            liked = True

        db.session.commit()

        logger.info(f'✅ Comment {comment_id} like toggled by user {user_id}')

        return jsonify({
            'success': True,
            'data': {
                'liked': liked,
                'like_count': comment.like_count
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f'❌ Error toggling comment like: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to toggle comment like: {str(e)}'
        }), 500


# ✅ GET My Comments - lấy comments của user hiện tại
@bp.route('/my-comments', methods=['GET'])
@jwt_required()
def get_my_comments():
    """Get current user's comments"""
    try:
        user_id = get_user_id_from_jwt()
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Invalid user identity'
            }), 422

        limit = request.args.get('limit', type=int, default=20)
        page = request.args.get('page', type=int, default=1)

        # Get user's comments
        query = db.session.query(Comment).join(User).filter(
            Comment.user_id == user_id
        ).order_by(desc(Comment.created_at))

        offset = (page - 1) * limit
        total_count = query.count()
        comments = query.offset(offset).limit(limit).all()

        # Format response
        result = []
        for comment in comments:
            comment_data = comment.to_dict()

            # Try to get content info
            try:
                if comment.content:
                    comment_data['content'] = {
                        'content_id': comment.content.content_id,
                        'title': comment.content.title,
                        'content_type': comment.content.content_type
                    }
            except:
                comment_data['content'] = None

            result.append(comment_data)

        return jsonify({
            'success': True,
            'data': result,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'total_pages': (total_count + limit - 1) // limit
            }
        }), 200

    except Exception as e:
        logger.error(f'❌ Error getting user comments: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Failed to get user comments: {str(e)}'
        }), 500


# ✅ Health check
@bp.route('/health', methods=['GET'])
def comments_health():
    """Health check for comments service"""
    try:
        # Test database connection
        comment_count = db.session.query(Comment).count()

        return jsonify({
            "success": True,
            "service": "comments",
            "status": "healthy",
            "database": "connected",
            "total_comments": comment_count,
            "endpoints": {
                "list": "GET /api/v1/comments",
                "create": "POST /api/v1/comments",
                "update": "PUT /api/v1/comments/{id}",
                "delete": "DELETE /api/v1/comments/{id}",
                "like": "POST /api/v1/comments/{id}/like",
                "my_comments": "GET /api/v1/comments/my-comments",
                "health": "GET /api/v1/comments/health"
            }
        }), 200
    except Exception as e:
        logger.error('Comments health check failed: %s', str(e))
        return jsonify({
            "success": False,
            "service": "comments",
            "status": "unhealthy",
            "error": str(e)
        }), 500