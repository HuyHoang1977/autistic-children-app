from app.models.users_model import User
from .base_repository import BaseRepository

class AuthRepository(BaseRepository):
    def __init__(self):
        super().__init__(User)

    def get_user_by(self, **kwargs):
        return self.model.query.filter_by(**kwargs).first()

    def create_user(self, username, email, password_hash, full_name=None, phone=None, avatar_url=None, user_type=None, role_id=None):
        # Sử dụng hàm create của BaseRepository để tạo user
        return self.create(
            username=username,
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            phone=phone,
            avatar_url=avatar_url,
            user_type=user_type,
            role_id=role_id
        )