from flask import Blueprint, request, jsonify
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
    errors = validate_login_data(data)
    if errors:
        return jsonify({"errors": errors}), 400
    user = auth_service.login_user(data['email'], data['password'])
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    token = secrets.token_hex(32)
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
    user = auth_service.register_user(
        username=data.get('username'),
        email=data.get('email'),
        password=data.get('password'),
        full_name=f"{data.get('first_name', '')} {data.get('last_name', '')}".strip(),
        phone=data.get('phone'),
        avatar_url=data.get('avatar_url'),
        role=data.get('role'),
        address=data.get('address'),
        emergency_contact=data.get('emergency_contact'),
        specialty=data.get('specialty'),
        qualifications=data.get('qualifications'),
        license_number=data.get('license_number'),
        clinic_name=data.get('clinic_name'),
        clinic_address=data.get('clinic_address')
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