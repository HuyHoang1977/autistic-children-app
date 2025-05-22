from flask import Blueprint, request, jsonify
from app.models.models import User
from app.services.user_service import login_user, register_user
from app.validations.user_validation import validate_login_data, validate_register_data

bp = Blueprint('auth_routes', __name__)

@bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([
        {"id": u.id, "name": u.name, "email": u.email}
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
    return jsonify({"id": user.id, "name": user.name, "email": user.email}), 200

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    errors = validate_register_data(data)
    if errors:
        return jsonify({"errors": errors}), 400
    user = register_user(data['name'], data['email'], data['password'])
    if not user:
        return jsonify({"error": "Email already exists"}), 409
    return jsonify({"id": user.id, "name": user.name, "email": user.email}), 201