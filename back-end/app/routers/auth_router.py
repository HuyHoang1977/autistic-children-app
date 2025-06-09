from flask import Blueprint, request, jsonify
from app.services.user_service import UserService
from app.validations.user_validation import validate_login_data, validate_register_data
import secrets

bp = Blueprint('auth_routes', __name__)
user_service = UserService()

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
    users = user_service.get_all_users()
    return jsonify([serialize_user(u) for u in users]), 200

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    errors = validate_login_data(data)
    if errors:
        return jsonify({"errors": errors}), 400
    user = user_service.login_user(data['email'], data['password'])
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    # Tạo token tạm thời
    token = secrets.token_hex(32)

    # Đáp ứng đúng định dạng frontend mong muốn: { data: { user, token } }
    return jsonify({
        "data": {
            "user": serialize_user(user),
            "token": token
        }
    }), 200

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    errors = validate_register_data(data)
    if errors:
        return jsonify({"errors": errors}), 400
    user = user_service.register_user(
        username=data.get('username'),
        email=data.get('email'),
        password=data.get('password'),
        full_name=data.get('full_name'),
        phone=data.get('phone'),
        avatar_url=data.get('avatar_url')
    )
    if not user:
        return jsonify({"error": "Email already exists"}), 409

    token = secrets.token_hex(32)
    return jsonify({
        "data": {
            "user": serialize_user(user),
            "token": token
        }
    }), 201