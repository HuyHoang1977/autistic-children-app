from app.repositories.user_repository import UserRepository
from app.models.users_model import User
from app.models.parents_model import Parent
from app.models.doctors_model import Doctor
from app.extensions import db

class AuthService:
    """Service cho các thao tác liên quan đến user."""

    def __init__(self):
        self.user_repo = UserRepository()

    def login_user(self, email, password):
        user = self.user_repo.get_user_by_email(email)
        if user and user.check_password(password):
            return user
        return None

    def register_user(
        self,
        username,
        email,
        password,
        full_name=None,
        phone=None,
        avatar_url=None,
        role=None,
        address=None,
        emergency_contact=None,
        specialty=None,
        qualifications=None,
        license_number=None,
        clinic_name=None,
        clinic_address=None
    ):
        if self.user_repo.get_user_by_email(email):
            return None  # Email đã tồn tại

        # Xác định role_id và user_type dựa trên role
        if role == "DOCTOR":
            user_type = 2
            role_id = 2
        else:  # Mặc định là PARENT
            user_type = 3
            role_id = 3

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
        db.session.add(user)
        db.session.flush()  # Để lấy user_id

        if role == "PARENT":
            parent = Parent(
                user_id=user.user_id,
                address=address,
                emergency_contact=emergency_contact
            )
            db.session.add(parent)

        if role == "DOCTOR":
            doctor = Doctor(
                user_id=user.user_id,
                specialty=specialty,
                qualifications=qualifications,
                license_number=license_number,
                clinic_name=clinic_name,
                clinic_address=clinic_address
            )
            db.session.add(doctor)

        db.session.commit()
        return user

    def get_all_users(self):
        return self.user_repo.get_all()