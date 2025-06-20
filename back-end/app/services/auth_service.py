
from app.repositories.auth_repository import AuthRepository
from app.extensions import db
from app.models import Parent, Doctor, User, Role
from app.validations.auth_validation import ROLE_PARENT, ROLE_DOCTOR
# from app.tasks.email import send_verification_email, send_password_reset_email


class AuthService:
    def __init__(self):
        self.auth_repo = AuthRepository()

    def login_user(self, email, password):
        try:
            user = self.auth_repo.get_user_by(email=email.strip())
            if not user or not user.check_password(password):
                return None, "Invalid email or password"
            if not user.is_active:
                return None, "Account is deactivated"
            return user, None
        except Exception as e:
            print("Login Error:", e)
            return None, "Internal Server Error"

    def register_user(self, data):
        try:
            required_fields = ['username', 'email', 'password', 'full_name', 'role_id']
            for field in required_fields:
                if not data.get(field):
                    return None, f"{field} is required"

            # Kiểm tra trùng lặp email hoặc username
            if self.auth_repo.get_user_by(email=data['email']):
                return None, "Email already registered"
            if self.auth_repo.get_user_by(username=data['username']):
                return None, "Username already taken"

            # Tạo đối tượng User với role_id
            user = User(
                username=data['username'],
                email=data['email'],
                full_name=data['full_name'],
                phone=data.get('phone'),
                role_id=data['role_id'],
                is_active=data.get('is_active', True)
            )
            user.set_password(data['password'])
            db.session.add(user)
            db.session.flush()  # Lưu user tạm thời để lấy user_id

            # Xử lý các role đặc biệt
            role_id = data['role_id']
            if role_id == ROLE_PARENT:
                parent = Parent(
                    user_id=user.user_id,
                    number_of_children=data.get('number_of_children', 0),
                    children_info=data.get('children_info', ''),
                    parenting_concerns=data.get('parenting_concerns', ''),
                    last_activity=None,
                    role_id=ROLE_PARENT
                )
                db.session.add(parent)
            elif role_id == ROLE_DOCTOR:
                doctor = Doctor(
                    user_id=user.user_id,
                    license_number=data.get('license_number', ''),
                    specialty=data.get('specialty', ''),
                    years_experience=data.get('years_experience', 0),
                    bio=data.get('bio', ''),
                    clinic_name=data.get('clinic_name', ''),
                    clinic_address=data.get('clinic_address', ''),
                    verified=False,
                    verification_date=None,
                    rating=None,
                    total_reviews=None,
                    role_id=ROLE_DOCTOR
                )
                db.session.add(doctor)
            db.session.commit()
            return user, None
        except Exception as e:
            db.session.rollback()
            print("Register Error:", e)
            return None, "Internal Server Error"

    def get_user_with_role(self, user):
        """
        Lấy thông tin người dùng kèm thông tin role và dữ liệu bổ sung.
        """
        try:
            user_data = user.to_dict()
            if user.parent:
                user_data.update(user.parent.to_dict())
            elif user.doctor:
                user_data.update(user.doctor.to_dict())
            elif user.admin:
                user_data.update(user.admin.to_dict())
            return user_data
        except Exception as e:
            print("Error in get_user_with_role:", e)
            return {}
    
    # def forgot_password(self, email):
    #     user = self.auth_repo.get_user_by(email=email.lower().strip())
    #     if user:
    #         send_password_reset_email.delay(user.email, user.first_name)
    #     return "If the email exists, a reset link has been sent"
    
    def get_user_with_role(self, user):
        user_data = user.to_dict()
        user_data['role_id'] = user.role_id

        # Thêm thông tin chi tiết theo từng loại user
        user_data['parent_info'] = user.parent.to_dict() if hasattr(user, "parent") and user.parent else None
        user_data['doctor_info'] = user.doctor.to_dict() if hasattr(user, "doctor") and user.doctor else None
        user_data['admin_info'] = user.admin.to_dict() if hasattr(user, "admin") and user.admin else None

        return user_data
    
    def get_all_users(self):
        return self.auth_repo.get_all()