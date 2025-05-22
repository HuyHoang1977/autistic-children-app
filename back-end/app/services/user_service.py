from app.repositories.user_repository import get_user_by_email, create_user

def login_user(email, password):
    user = get_user_by_email(email)
    if user and user.check_password(password):
        return user
    return None

def register_user(name, email, password):
    if get_user_by_email(email):
        return None  # Email đã tồn tại
    return create_user(name, email, password)