from flask import Blueprint, request, jsonify
from app.services.notification_service import NotificationService
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.repositories.auth_repository import AuthRepository

notification_bp = Blueprint('notifications', __name__)
notification_service = NotificationService()
auth_repository = AuthRepository()

@notification_bp.route('', methods=['GET'])
@notification_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get notifications for current user"""
    try:
        # Get current user from JWT token
        current_user_id = get_jwt_identity()
        current_user = auth_repository.get_user_by(user_id=current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        result = notification_service.get_user_notifications(
            user_id=current_user.user_id,
            limit=limit,
            offset=offset,
            unread_only=unread_only
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['notifications'],
                'unread_count': result['unread_count'],
                'pagination': {
                    'limit': limit,
                    'offset': offset,
                    'has_more': len(result['notifications']) == limit
                }
            }), 200
        else:
            return jsonify({'success': False, 'message': result['message']}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@notification_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get unread notification count"""
    try:
        # Get current user from JWT token
        current_user_id = get_jwt_identity()
        current_user = auth_repository.get_user_by(user_id=current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        result = notification_service.get_unread_count(current_user.user_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'unread_count': result['unread_count']
            }), 200
        else:
            return jsonify({'success': False, 'message': result['message']}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@notification_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_as_read(notification_id):
    """Mark a notification as read"""
    try:
        # Get current user from JWT token
        current_user_id = get_jwt_identity()
        current_user = auth_repository.get_user_by(user_id=current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        result = notification_service.mark_notification_as_read(
            notification_id=notification_id,
            user_id=current_user.user_id
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Notification marked as read',
                'data': result['notification']
            }), 200
        else:
            return jsonify({'success': False, 'message': result['message']}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@notification_bp.route('/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_as_read():
    """Mark all notifications as read"""
    try:
        # Get current user from JWT token
        current_user_id = get_jwt_identity()
        current_user = auth_repository.get_user_by(user_id=current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        result = notification_service.mark_all_as_read(current_user.user_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': f'Marked {result["marked_count"]} notifications as read'
            }), 200
        else:
            return jsonify({'success': False, 'message': result['message']}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@notification_bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    try:
        # Get current user from JWT token
        current_user_id = get_jwt_identity()
        current_user = auth_repository.get_user_by(user_id=current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        result = notification_service.delete_notification(
            notification_id=notification_id,
            user_id=current_user.user_id
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Notification deleted'
            }), 200
        else:
            return jsonify({'success': False, 'message': result['message']}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Internal API endpoints (for triggering notifications)
@notification_bp.route('/follow', methods=['POST'])
@jwt_required()
def create_follow_notification():
    """Create notification when someone follows a doctor"""
    try:
        # Get current user from JWT token
        current_user_id = get_jwt_identity()
        current_user = auth_repository.get_user_by(user_id=current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        data = request.get_json()
        doctor_id = data.get('doctor_id')
        parent_id = data.get('parent_id')
        
        if not doctor_id or not parent_id:
            return jsonify({
                'success': False,
                'message': 'doctor_id and parent_id are required'
            }), 400
        
        result = notification_service.create_follow_notification(
            doctor_id=doctor_id,
            parent_id=parent_id
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Follow notification created',
                'data': result['notification']
            }), 201
        else:
            return jsonify({'success': False, 'message': result['message']}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@notification_bp.route('/new-article', methods=['POST'])
@jwt_required()
def create_new_article_notifications():
    """Create notifications for new article"""
    try:
        # Get current user from JWT token
        current_user_id = get_jwt_identity()
        current_user = auth_repository.get_user_by(user_id=current_user_id)
        
        if not current_user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        data = request.get_json()
        article_id = data.get('article_id')
        article_title = data.get('article_title')
        doctor_user_id = data.get('doctor_user_id', current_user.user_id)
        
        if not article_id or not article_title:
            return jsonify({
                'success': False,
                'message': 'article_id and article_title are required'
            }), 400
        
        result = notification_service.create_new_article_notifications(
            article_id=article_id,
            article_title=article_title,
            doctor_user_id=doctor_user_id
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': f'Created {result["notifications_created"]} notifications',
                'data': {
                    'notifications_created': result['notifications_created'],
                    'notifications': result['notifications']
                }
            }), 201
        else:
            return jsonify({'success': False, 'message': result['message']}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
