from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.follow_service import FollowService
import logging

logger = logging.getLogger(__name__)

follow_bp = Blueprint('follow', __name__)
follow_service = FollowService()

@follow_bp.route('/doctors/<int:doctor_id>/toggle', methods=['POST'])
@jwt_required()
def toggle_follow_doctor(doctor_id):
    """
    Toggle follow/unfollow doctor
    """
    try:
        logger.info(f"🔄 Toggle follow request for doctor {doctor_id}")
        
        # Lấy thông tin user từ JWT
        current_user = get_jwt_identity()
        logger.info(f"📝 Current user from JWT: {current_user}")
        logger.info(f"🔍 JWT type: {type(current_user)}")
        
        # Xử lý different JWT formats
        parent_id = None
        user_id = None
        
        if isinstance(current_user, dict):
            # JWT chứa object
            parent_id = current_user.get('parent_id')
            user_id = current_user.get('user_id')
            role_id = current_user.get('role_id')
            logger.info(f"📊 JWT contains - parent_id: {parent_id}, user_id: {user_id}, role_id: {role_id}")
        else:
            # JWT chỉ chứa user_id
            user_id = current_user
            logger.info(f"📊 JWT contains only user_id: {user_id}")
        
        # Nếu không có parent_id, tìm từ database
        if not parent_id and user_id:
            logger.info(f"🔍 Looking up parent_id for user_id: {user_id}")
            from app.models.parents_model import Parent
            parent = Parent.query.filter_by(user_id=user_id).first()
            if parent:
                parent_id = parent.parent_id
                logger.info(f"✅ Found parent_id: {parent_id}")
            else:
                logger.warning(f"❌ No parent record found for user_id: {user_id}")
        
        if not parent_id:
            logger.warning("❌ No parent_id found - user is not a parent")
            return jsonify({
                'success': False,
                'message': 'Chỉ có phụ huynh mới có thể theo dõi bác sĩ'
            }), 403
        
        # Thực hiện toggle follow
        logger.info(f"🎯 Calling toggle_follow_doctor with parent_id: {parent_id}, doctor_id: {doctor_id}")
        result = follow_service.toggle_follow_doctor(parent_id, doctor_id)
        
        status_code = 200 if result['success'] else 400
        logger.info(f"✅ Toggle follow result: {result}")
        
        return jsonify(result), status_code
        
    except Exception as e:
        logger.error(f"❌ Error in toggle_follow_doctor: {str(e)}")
        import traceback
        logger.error(f"📝 Full traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': f'Có lỗi xảy ra: {str(e)}'
        }), 500

@follow_bp.route('/doctors/<int:doctor_id>/status', methods=['GET'])
@jwt_required()
def check_follow_status(doctor_id):
    """
    Kiểm tra trạng thái follow với doctor
    """
    try:
        logger.info(f"🔍 Check follow status request for doctor {doctor_id}")
        
        # Lấy thông tin user từ JWT
        current_user = get_jwt_identity()
        logger.info(f"📝 Current user from JWT: {current_user}")
        logger.info(f"🔍 JWT type: {type(current_user)}")
        
        # Xử lý different JWT formats
        parent_id = None
        user_id = None
        
        if isinstance(current_user, dict):
            # JWT chứa object
            parent_id = current_user.get('parent_id')
            user_id = current_user.get('user_id')
            role_id = current_user.get('role_id')
            logger.info(f"📊 JWT contains - parent_id: {parent_id}, user_id: {user_id}, role_id: {role_id}")
        else:
            # JWT chỉ chứa user_id
            user_id = current_user
            logger.info(f"📊 JWT contains only user_id: {user_id}")
        
        # Nếu không có parent_id, tìm từ database
        if not parent_id and user_id:
            logger.info(f"🔍 Looking up parent_id for user_id: {user_id}")
            from app.models.parents_model import Parent
            parent = Parent.query.filter_by(user_id=user_id).first()
            if parent:
                parent_id = parent.parent_id
                logger.info(f"✅ Found parent_id: {parent_id}")
            else:
                logger.warning(f"❌ No parent record found for user_id: {user_id}")
        
        if not parent_id:
            logger.warning("❌ No parent_id found - returning false status")
            return jsonify({
                'success': True,
                'is_following': False,
                'message': 'User is not a parent'
            }), 200
        
        # Kiểm tra trạng thái follow
        logger.info(f"🎯 Calling check_follow_status with parent_id: {parent_id}, doctor_id: {doctor_id}")
        result = follow_service.check_follow_status(parent_id, doctor_id)
        
        logger.info(f"✅ Check follow status result: {result}")
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"❌ Error in check_follow_status: {str(e)}")
        import traceback
        logger.error(f"📝 Full traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': f'Có lỗi xảy ra: {str(e)}'
        }), 500