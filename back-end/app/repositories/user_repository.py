from app.models.users_model import User
from app.extensions import db



def get_user_by_email(email):
    return User.query.filter_by(email=email).first()

def create_user(username, email, password_hash, full_name=None, phone=None, avatar_url=None, user_type=None, role_id=None):
    user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        full_name=full_name,
        phone=phone,
        avatar_url=avatar_url,
        user_type=user_type,
        role_id=role_id
    )
    db.session.add(user)
    db.session.commit()
    return user