from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.profile_service import ProfileService
from app.validations.profile_validation import ChildProfile
from pydantic import ValidationError
import logging

logger = logging.getLogger(__name__)

bp = Blueprint("profile", __name__)
service = ProfileService()

# Explicit OPTIONS handler for CORS preflight
@bp.route("", methods=["OPTIONS"])
@bp.route("/", methods=["OPTIONS"])
def handle_preflight():
    return jsonify({"status": "ok"}), 200

@bp.route("", methods=["GET"])  # Handle both /api/profile and /api/profile/
@bp.route("/", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    data, error = service.get_profile(user_id)
    if error:
        return jsonify({"success": False, "error": error}), 404
    return jsonify({"success": True, "data": data}), 200

@bp.route("", methods=["PUT"])  # Handle both /api/profile and /api/profile/
@bp.route("/", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    req = request.get_json()
    user_data = req.get("user", {})
    role_data = req.get("role", {})
    updated, error = service.update_profile(user_id, user_data, role_data)
    if error:
        return jsonify({"success": False, "error": error}), 400
    # Trả về profile mới nhất
    data, _ = service.get_profile(user_id)
    return jsonify({"success": True, "data": data}), 200

# Child endpoints
@bp.route("/child", methods=["OPTIONS"])
def handle_child_preflight():
    return jsonify({"status": "ok"}), 200

@bp.route("/child/<int:child_id>", methods=["OPTIONS"])
def handle_child_id_preflight(child_id):
    return jsonify({"status": "ok"}), 200

@bp.route("/child", methods=["POST"])
@jwt_required()
def add_child():
    user_id = get_jwt_identity()
    child_data = request.get_json()
    try:
        ChildProfile(**child_data)
    except ValidationError as e:
        error_messages = [f"{err['loc'][0]}: {err['msg']}" for err in e.errors()]
        return jsonify({"success": False, "error": error_messages}), 400
    child, error = service.add_child(user_id, child_data)
    if error:
        return jsonify({"success": False, "error": error}), 400
    return jsonify({"success": True, "data": child.to_dict()}), 201

@bp.route("/child/<int:child_id>", methods=["PUT"])
@jwt_required()
def update_child(child_id):
    child_data = request.get_json()
    try:
        ChildProfile(**child_data)
    except ValidationError as e:
        error_messages = [f"{err['loc'][0]}: {err['msg']}" for err in e.errors()]
        return jsonify({"success": False, "error": error_messages}), 400
    child, error = service.update_child(child_id, child_data)
    if error:
        return jsonify({"success": False, "error": error}), 404
    return jsonify({"success": True, "data": child.to_dict()}), 200

@bp.route("/child/<int:child_id>", methods=["DELETE"])
@jwt_required()
def delete_child(child_id):
    success = service.delete_child(child_id)
    if not success:
        return jsonify({"success": False, "error": "Child not found"}), 404
    return jsonify({"success": True}), 200

# Avatar endpoints
@bp.route("/avatar", methods=["OPTIONS"])
def handle_avatar_preflight():
    return jsonify({"status": "ok"}), 200

@bp.route("/avatar", methods=["POST"])
@jwt_required()
def upload_avatar():
    """Upload avatar cho user hiện tại"""
    try:
        user_id = get_jwt_identity()
        logger.info(f"📸 Avatar upload request from user_id: {user_id}")
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"success": False, "error": "No file selected"}), 400
        
        # Upload avatar
        result, error = service.upload_avatar(user_id, file)
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        return jsonify({
            "success": True, 
            "message": "Avatar uploaded successfully",
            "data": result
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Avatar upload endpoint error: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500

@bp.route("/avatar", methods=["PUT"])
@jwt_required()
def update_avatar():
    """Cập nhật avatar cho user hiện tại"""
    try:
        user_id = get_jwt_identity()
        logger.info(f"🔄 Avatar update request from user_id: {user_id}")
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"success": False, "error": "No file selected"}), 400
        
        # Update avatar
        result, error = service.update_avatar(user_id, file)
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        return jsonify({
            "success": True, 
            "message": "Avatar updated successfully",
            "data": result
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Avatar update endpoint error: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500

@bp.route("/avatar", methods=["DELETE"])
@jwt_required()
def delete_avatar():
    """Xóa avatar của user hiện tại"""
    try:
        user_id = get_jwt_identity()
        logger.info(f"🗑️ Avatar delete request from user_id: {user_id}")
        
        success, error = service.delete_avatar(user_id)
        
        if not success:
            return jsonify({"success": False, "error": error or "Failed to delete avatar"}), 400
        
        return jsonify({
            "success": True, 
            "message": "Avatar deleted successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Avatar delete endpoint error: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500