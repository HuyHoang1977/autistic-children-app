from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app.services.auth_service import AuthService
from app.validations.auth_validation import validate_login_data, validate_register_data
from app.models.doctor_specializations_model import DoctorSpecialization
from app.extensions import db
import secrets

bp = Blueprint('auth', __name__)
auth_service = AuthService()

def serialize_user(user):
    return {
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "avatar_url": user.avatar_url,
        "user_type": user.user_type,
        "role": {
            "role_id": user.role.role_id if user.role else None,
            "role_name": user.role.role_name if user.role else None,
            "description": user.role.description if user.role else None,
            "is_active": user.role.is_active if user.role else None
        },
        "admin_info": {
            "admin_id": user.admin.admin_id,
            "admin_role": user.admin.admin_role,
            "permissions": user.admin.permissions,
            "last_login": user.admin.last_login,
            "role_id": user.admin.role_id
        } if user.admin else None,
        "doctor_info": {
            "doctor_id": user.doctor.doctor_id,
            "license_number": user.doctor.license_number,
            "specialty": user.doctor.specialty,
            "years_experience": user.doctor.years_experience,
            "bio": user.doctor.bio,
            "clinic_name": user.doctor.clinic_name,
            "clinic_address": user.doctor.clinic_address,
            "verified": user.doctor.verified,
            "verification_date": user.doctor.verification_date,
            "rating": user.doctor.rating,
            "total_reviews": user.doctor.total_reviews,
            "role_id": user.doctor.role_id
        } if user.doctor else None,
        "parent_info": {
            "parent_id": user.parent.parent_id,
            "number_of_children": user.parent.number_of_children,
            "children_info": user.parent.children_info,
            "parenting_concerns": user.parent.parenting_concerns,
            "last_activity": user.parent.last_activity,
            "role_id": user.parent.role_id
        } if user.parent else None
    }

@bp.route('/users', methods=['GET'])
def get_users():
    users = auth_service.get_all_users()
    serialized_users = [serialize_user(user) for user in users]
    return jsonify({"data": serialized_users}), 200

@bp.route('/specializations', methods=['GET'])
def get_specializations():
    specializations = (
        db.session.query(DoctorSpecialization.specialization)
        .distinct()
        .order_by(DoctorSpecialization.specialization)
        .all()
    )
    return jsonify([s[0] for s in specializations]), 200

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid or missing JSON payload"}), 400

    errors = validate_login_data(data)
    if errors:
        return jsonify({"success": False, "errors": errors}), 400

    try:
        user, error = auth_service.login_user(data.get('email'), data.get('password'))
        if error:
            return jsonify({"success": False, "error": error}), 401

        access_token = create_access_token(identity=user.user_id)
        refresh_token = create_refresh_token(identity=user.user_id)
        user_data = auth_service.get_user_with_role(user)

        return jsonify({
            "success": True,
            "data": {
                "user": user_data,
                "token": access_token,
                "refresh_token": refresh_token
            }
        }), 200
    except Exception as e:
        print("Login error:", e)
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid or missing JSON payload"}), 400

    errors = validate_register_data(data)
    if errors:
        return jsonify({"success": False, "errors": errors}), 400

    try:
        user, error = auth_service.register_user(data)
        if error:
            return jsonify({"success": False, "error": error}), 400
    except Exception as e:
        print("Register error:", e)
        return jsonify({"success": False, "error": str(e)}), 500

    access_token = create_access_token(identity=user.user_id)
    refresh_token = create_refresh_token(identity=user.user_id)
    user_data = auth_service.get_user_with_role(user)

    return jsonify({
        "success": True,
        "data": {
            "user": user_data,
            "token": access_token,
            "refresh_token": refresh_token
        }
    }), 201
    
@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    token, error = auth_service.refresh_token(current_user_id)
    if error:
        return jsonify({"success": False, "message": error}), 404

    return jsonify({"success": True, "data": {"token": token}})

# @bp.route('/forgot-password', methods=['POST'])
# def forgot_password():
#     data = request.get_json()
#     email = data.get('email')
#     if not email:
#         return jsonify({"success": False, "message": "Email is required"}), 400

#     message = auth_service.forgot_password(email)
#     return jsonify({"success": True, "message": message})    