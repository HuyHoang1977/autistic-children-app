from flask import request, jsonify
from functools import wraps
from app.role import ROLES

def authorize(allowed_roles):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user = getattr(request, 'user', None)
            # Nếu không cần login (user thường), cho phép truy cập
            if not user and ROLES.get('USER') in allowed_roles:
                return f(*args, **kwargs)
            # Nếu đã login, kiểm tra role_id
            if user and getattr(user, 'role_id', None) in allowed_roles:
                return f(*args, **kwargs)
            return jsonify({'message': 'Forbidden'}), 403
        return wrapper
    return decorator