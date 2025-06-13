
from app.repositories.auth_repository import AuthRepository
from app.extensions import db
from app.models import Parent, Doctor, User
# from app.tasks.email import send_verification_email, send_password_reset_email


class AuthService:
    def __init__(self):
        self.auth_repo = AuthRepository()

    def login_user(self, email, password):
        user = self.auth_repo.get_user_by(email=email)
        if not user or not user.check_password(password):
            return None, "Invalid email or password"
        if not user.is_active:
            return None, "Account is deactivated"
        return user, None

    def register_user(self, data):
        required_fields = ['username', 'email', 'password','full_name', 'phone', 'role']
        for field in required_fields:
            if not data.get(field):
                return None, f"{field} is required"
        
        if self.auth_repo.get_user_by(email=data['email']):
            return None, "Email already registered"
        if self.auth_repo.get_user_by(username=data['username']):
            return None, "Username already taken"

        user = User(
            username=data['username'],
            email=data['email'],
            full_name=data.get('full_name'),
            phone=data.get('phone')
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.flush()

        role = data['role']
        if role == "PARENT":
            parent = Parent(
                user_id=user.user_id
            )
            db.session.add(parent)

        if role == "DOCTOR":
            doctor = Doctor(
                user_id=user.user_id,
                specialty=data['specialty'],
                license_number=data['license_number'],
                clinic_name=data['clinic_name'],
                clinic_address=data['clinic_address']
            )
            db.session.add(doctor)

        db.session.commit()
        # send_verification_email.delay(user.email, user.first_name)
        return user, None
    
    # def forgot_password(self, email):
    #     user = self.auth_repo.get_user_by(email=email.lower().strip())
    #     if user:
    #         send_password_reset_email.delay(user.email, user.first_name)
    #     return "If the email exists, a reset link has been sent"
    
    def get_user_with_role(self, user):
        user_data = user.to_dict()
        if user.parent:
            user_data.update(user.parent.to_dict())
        elif user.doctor:
            user_data.update(user.doctor.to_dict())
        elif user.admin:
            user_data.update(user.admin.to_dict())
        return user_data
    
    def get_all_users(self):
        return self.auth_repo.get_all()