from flask import request, jsonify
from functools import wraps
from app.role import ROLES

class Authorize:
    def __init__(self, allowed_roles):
        self.allowed_roles = allowed_roles

    def __call__(self, f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user = getattr(request, 'user', None)
            # Nếu không cần login (user thường), cho phép truy cập
            if not user and ROLES.get('USER') in self.allowed_roles:
                return f(*args, **kwargs)
            # Nếu đã login, kiểm tra role_id
            if user and getattr(user, 'role_id', None) in self.allowed_roles:
                return f(*args, **kwargs)
            return jsonify({'message': 'Forbidden'}), 403
        return wrapper