from app.repositories.user_repository import get_user_by_email, create_user

def login_user(email, password):
    user = get_user_by_email(email)
    if user and user.check_password(password):
        return user
    return None

def register_user(username, email, password_hash, full_name=None, phone=None, avatar_url=None):
    if get_user_by_email(email):
        return None  # Email đã tồn tại
    return create_user(
        username=username,
        email=email,
        password_hash=password_hash,
        full_name=full_name,
        phone=phone,
        avatar_url=avatar_url,
        user_type=3,
        role_id=3
    )