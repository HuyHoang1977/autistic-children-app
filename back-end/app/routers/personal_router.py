from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.personal_service import PersonalService
import logging

logger = logging.getLogger(__name__)

personal_bp = Blueprint('personal', __name__)
personal_service = PersonalService()


def get_user_id_from_jwt():
    """Helper function to extract user_id from JWT token"""
    current_user = get_jwt_identity()
    if isinstance(current_user, dict):
        return current_user.get('user_id')
    else:
        return current_user


@personal_bp.route('/profile/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_profile(user_id):
    """
    Lấy thông tin profile của user
    """
    try:
        result = personal_service.get_user_profile(user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_user_profile: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'data': None
        }), 500


@personal_bp.route('/articles/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_articles(user_id):
    """
    Lấy danh sách bài viết của user
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        result = personal_service.get_user_articles(
            user_id=user_id,
            page=page,
            per_page=per_page
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in get_user_articles: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'data': None
        }), 500


@personal_bp.route('/articles/stats/<int:user_id>', methods=['GET'])
@jwt_required()
def get_article_statistics(user_id):
    """
    Lấy thống kê bài viết của user
    """
    try:
        result = personal_service.get_article_statistics(user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_article_statistics: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'data': None
        }), 500


@personal_bp.route('/following/<int:user_id>', methods=['GET'])
@jwt_required()
def get_following_doctors(user_id):
    """
    Lấy danh sách bác sĩ mà parent đang follow
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        result = personal_service.get_following_doctors(
            user_id=user_id,
            page=page,
            per_page=per_page
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 403
            
    except Exception as e:
        logger.error(f"Error in get_following_doctors: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'data': None
        }), 500


@personal_bp.route('/followers/<int:user_id>', methods=['GET'])
@jwt_required()
def get_doctor_followers(user_id):
    """
    Lấy danh sách parent đang follow doctor
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        result = personal_service.get_doctor_followers(
            user_id=user_id,
            page=page,
            per_page=per_page
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 403
            
    except Exception as e:
        logger.error(f"Error in get_doctor_followers: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'data': None
        }), 500


@personal_bp.route('/follow/stats/<int:user_id>', methods=['GET'])
@jwt_required()
def get_follow_statistics(user_id):
    """
    Lấy thống kê follow theo role
    """
    try:
        result = personal_service.get_follow_statistics(user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_follow_statistics: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'data': None
        }), 500


@personal_bp.route('/dashboard/<int:user_id>', methods=['GET'])
@jwt_required()
def get_dashboard_summary(user_id):
    """
    Lấy tổng quan dashboard cho user
    """
    try:
        result = personal_service.get_dashboard_summary(user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_dashboard_summary: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'data': None
        }), 500


@personal_bp.route('/my-profile', methods=['GET'])
@jwt_required()
def get_my_profile():
    """
    Lấy thông tin profile của user hiện tại
    """
    try:
        # Lấy user_id từ JWT
        user_id = get_user_id_from_jwt()
        
        result = personal_service.get_user_profile(user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_my_profile: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'data': None
        }), 500


@personal_bp.route('/my-articles', methods=['GET'])
@jwt_required()
def get_my_articles():
    """
    Lấy danh sách bài viết của user hiện tại
    """
    try:
        # Lấy user_id từ JWT
        user_id = get_user_id_from_jwt()
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        result = personal_service.get_user_articles(
            user_id=user_id,
            page=page,
            per_page=per_page
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in get_my_articles: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'data': None
        }), 500


@personal_bp.route('/my-dashboard', methods=['GET'])
@jwt_required()
def get_my_dashboard():
    """
    Lấy dashboard của user hiện tại
    """
    try:
        # Lấy user_id từ JWT
        user_id = get_user_id_from_jwt()
        
        result = personal_service.get_dashboard_summary(user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_my_dashboard: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'data': None
        }), 500


@personal_bp.route('/my-following', methods=['GET'])
@jwt_required()
def get_my_following():
    """
    Lấy danh sách doctors mà user hiện tại đang follow (cho parent)
    """
    try:
        # Lấy user_id từ JWT
        user_id = get_user_id_from_jwt()
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        result = personal_service.get_following_doctors(
            user_id=user_id,
            page=page,
            per_page=per_page
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 403
            
    except Exception as e:
        logger.error(f"Error in get_my_following: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'data': None
        }), 500


@personal_bp.route('/my-followers', methods=['GET'])
@jwt_required()
def get_my_followers():
    """
    Lấy danh sách parents đang follow user hiện tại (cho doctor)
    """
    try:
        # Lấy user_id từ JWT
        user_id = get_user_id_from_jwt()
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        result = personal_service.get_doctor_followers(
            user_id=user_id,
            page=page,
            per_page=per_page
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 403
            
    except Exception as e:
        logger.error(f"Error in get_my_followers: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'data': None
        }), 500


# Error handlers
@personal_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Resource not found',
        'data': None
    }), 404


@personal_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error',
        'data': None
    }), 500