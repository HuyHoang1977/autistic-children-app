from app.repositories.user_repository import get_user_by_email
from app.models.users_model import User
from app.extensions import db


def login_user(email, password):
    user = get_user_by_email(email)
    if user and user.check_password(password):
        return user
    return None


def register_user(username, email, password, full_name=None, phone=None, avatar_url=None):
    if get_user_by_email(email):
        return None  # Email đã tồn tại

    # Tạo user mới và hash password
    user = User(
        username=username,
        email=email,
        full_name=full_name,
        phone=phone,
        avatar_url=avatar_url,
        user_type=3,  # Default là Parent
        role_id=3  # Role Parent
    )
    user.set_password(password)  # Hash password ở đây

    db.session.add(user)
    db.session.commit()
    return user