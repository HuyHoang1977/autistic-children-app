from app.models.users_model import User
from .base_repository import BaseRepository
from app.models.parents_model import Parent
from app.extensions import db
class AuthRepository(BaseRepository):
    def __init__(self):
        super().__init__(User)

    def get_user_by(self, user_id=None, email=None, username=None):
        query = db.session.query(User)
        if user_id:
            query = query.filter_by(user_id=user_id)
        if email:
            query = query.filter_by(email=email)
        if username:
            query = query.filter_by(username=username)
        return query.first()

    def get_parent_by_user_id(self, user_id):
        return db.session.query(Parent).filter_by(user_id=user_id).first()

    def get_all(self):
        return db.session.query(User).all()

    def create_user(self, username, email, password_hash, full_name=None, phone=None, avatar_url=None, user_type=None, role_id=None, is_active=None):
        # Sử dụng hàm create của BaseRepository để tạo user
        return self.create(
            username=username,
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            phone=phone,
            avatar_url=avatar_url,
            user_type=user_type,
            role_id=role_id,
            is_active=is_active
        )