from app.repositories.user_repository import UserRepository
from app.models.users_model import User
from app.extensions import db

class UserService:
    def __init__(self):
        self.user_repo = UserRepository()

    def login_user(self, email, password):
        user = self.user_repo.get_user_by_email(email)
        if user and user.check_password(password):
            return user
        return None

    def register_user(self, username, email, password, full_name=None, phone=None, avatar_url=None):
        if self.user_repo.get_user_by_email(email):
            return None  # Email đã tồn tại

        user = User(
            username=username,
            email=email,
            full_name=full_name,
            phone=phone,
            avatar_url=avatar_url,
            user_type=3,  # Default là Parent
            role_id=3     # Role Parent
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user

    def get_all_users(self):
        return self.user_repo.get_all()