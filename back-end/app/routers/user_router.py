from flask import Blueprint, request, jsonify
from app.models.users_model import User
from app.middlewares.auth import authorize
from app.role import ROLES
from app.services.user_service import login_user, register_user
from app.validations.user_validation import validate_login_data, validate_register_data

bp = Blueprint('auth_routes', __name__)

@bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([
        {
            "user_id": u.user_id,
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "phone": u.phone,
            "avatar_url": u.avatar_url,
            "user_type": u.user_type,
            "role": {
                "role_id": u.role.role_id if u.role else None,
                "role_name": u.role.role_name if u.role else None,
                "description": u.role.description if u.role else None,
                "is_active": u.role.is_active if u.role else None
            },
            "admin_info": {
                "admin_id": u.admin.admin_id,
                "admin_role": u.admin.admin_role,
                "permissions": u.admin.permissions,
                "last_login": u.admin.last_login,
                "role_id": u.admin.role_id
            } if u.admin else None,
            "doctor_info": {
                "doctor_id": u.doctor.doctor_id,
                "license_number": u.doctor.license_number,
                "specialty": u.doctor.specialty,
                "years_experience": u.doctor.years_experience,
                "bio": u.doctor.bio,
                "clinic_name": u.doctor.clinic_name,
                "clinic_address": u.doctor.clinic_address,
                "verified": u.doctor.verified,
                "verification_date": u.doctor.verification_date,
                "rating": u.doctor.rating,
                "total_reviews": u.doctor.total_reviews,
                "role_id": u.doctor.role_id
            } if u.doctor else None,
            "parent_info": {
                "parent_id": u.parent.parent_id,
                "number_of_children": u.parent.number_of_children,
                "children_info": u.parent.children_info,
                "parenting_concerns": u.parent.parenting_concerns,
                "last_activity": u.parent.last_activity,
                "role_id": u.parent.role_id
            } if u.parent else None
        }
        for u in users
    ])

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    errors = validate_login_data(data)
    if errors:
        return jsonify({"errors": errors}), 400
    user = login_user(data['email'], data['password'])
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401
    return jsonify({
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
    }), 200

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    errors = validate_register_data(data)
    if errors:
        return jsonify({"errors": errors}), 400
    user = register_user(
        username=data.get('username'),
        email=data.get('email'),
        password=data.get('password'), 
        full_name=data.get('full_name'),
        phone=data.get('phone'),
        avatar_url=data.get('avatar_url')
    )
    if not user:
        return jsonify({"error": "Email already exists"}), 409
    return jsonify({
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
        }
    }), 201