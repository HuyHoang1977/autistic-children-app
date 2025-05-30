from app.repositories.user_repository import get_user_by_email, create_user
from app.models.users_model import User

def login_user(email, password):
    user = get_user_by_email(email)
    if user and user.check_password(password):
        return user
    return None

def register_user(username, email, password, full_name=None, phone=None, avatar_url=None, user_type=3, role_id=3):
    if get_user_by_email(email):
        return None  # Email đã tồn tại
    user = User(
        username=username,
        email=email,
        full_name=full_name,
        phone=phone,
        avatar_url=avatar_url,
        user_type=user_type,
        role_id=role_id
    )
    user.set_password(password)
    return create_user_instance(user)

def create_user_instance(user):
    from app.extensions import db
    db.session.add(user)
    db.session.commit()
    return user