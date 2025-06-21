import logging
import re
from flask_jwt_extended import create_access_token
from app.repositories.auth_repository import AuthRepository
from app.extensions import db
from app.models.users_model import User
from app.models.parents_model import Parent
from app.models.doctors_model import Doctor
from app.models.admins_model import Admin
from app.validations.auth_validation import ROLE_ADMIN, ROLE_DOCTOR, ROLE_PARENT

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self):
        self.auth_repo = AuthRepository()

    def login_user(self, email, password):
        try:
            user = self.auth_repo.get_user_by(email=email.strip())
            if not user or not user.check_password(password):
                logger.warning('Invalid email or password for email: %s', email)
                return None, {"errors": ["Invalid email or password"], "success": False}
            if not user.is_active:
                logger.warning('Account is deactivated for email: %s', email)
                return None, {"errors": ["Account is deactivated"], "success": False}
            logger.info('Successful login for email: %s', email)
            return user, None
        except Exception as e:
            logger.error('Login error for email %s: %s', email, str(e), exc_info=True)
            return None, {"errors": [f"Failed to login: {str(e)}"], "success": False}

    def register_user(self, data):
        try:
            errors = []
            valid_roles = [ROLE_ADMIN, ROLE_DOCTOR, ROLE_PARENT]
            role_id = data['role_id']
            if role_id not in valid_roles:
                errors.append(f"Invalid role_id. Must be one of {valid_roles}")

            # Validate username
            username = data['username']
            if not re.match(r'^[a-zA-Z0-9_-]+$', username):
                errors.append("Username contains invalid characters")
            if len(username) < 3 or len(username) > 255:
                errors.append("Username must be between 3 and 255 characters")

            # Validate email
            email = data['email']
            if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
                errors.append("Invalid email format")

            # Validate password
            password = data['password']
            if len(password) < 8:
                errors.append("Password must be at least 8 characters")

            # Validate number_of_children
            if role_id == ROLE_PARENT and data.get('number_of_children', 0) < 0:
                errors.append("Number of children must be non-negative")

            if errors:
                logger.warning('Validation errors: %s, Data: %s', errors, data)
                return None, {"errors": errors, "success": False}

            if self.auth_repo.get_user_by(email=email):
                errors.append("Email already registered")
            if self.auth_repo.get_user_by(username=username):
                errors.append("Username already taken")

            # Kiểm tra user_id đã tồn tại trong bảng parents
            if role_id == ROLE_PARENT and self.auth_repo.get_parent_by_user_id(data.get('user_id')):
                errors.append("User already has a parent profile")

            if errors:
                logger.warning('Validation errors: %s, Data: %s', errors, data)
                return None, {"errors": errors, "success": False}

            user = User(
                username=username,
                email=email,
                full_name=data['full_name'],
                phone=data.get('phone'),
                role_id=role_id,
                is_active=data.get('is_active', True),
                user_type=role_id
            )
            user.password = password
            db.session.add(user)
            db.session.flush()

            if role_id == ROLE_PARENT:
                try:
                    parent = Parent(
                        user_id=user.user_id,
                        number_of_children=data.get('number_of_children'),
                        children_info=data.get('children_info'),
                        parenting_concerns=data.get('parenting_concerns'),
                        last_activity=None,
                        role_id=ROLE_PARENT
                    )
                    db.session.add(parent)
                except Exception as e:
                    errors.append(f"Failed to create parent profile: {str(e)}")
            elif role_id == ROLE_DOCTOR:
                try:
                    doctor = Doctor(
                        user_id=user.user_id,
                        license_number=data.get('license_number', ''),
                        specialty=data.get('specialty', ''),
                        years_experience=data.get('years_experience', 0),
                        bio=data.get('bio', ''),
                        clinic_name=data.get('clinic_name', ''),
                        clinic_address=data.get('clinic_address', ''),
                        verified=data.get('verified', False),
                        verification_date=data.get('verification_date'),
                        rating=data.get('rating'),
                        total_reviews=data.get('total_reviews', 0),
                        role_id=ROLE_DOCTOR
                    )
                    db.session.add(doctor)
                except Exception as e:
                    errors.append(f"Failed to create doctor profile: {str(e)}")
            elif role_id == ROLE_ADMIN:
                try:
                    admin = Admin(
                        user_id=user.user_id,
                        admin_role='standard',
                        permissions='',
                        last_login=None,
                        role_id=ROLE_ADMIN
                    )
                    db.session.add(admin)
                except Exception as e:
                    errors.append(f"Failed to create admin profile: {str(e)}")

            if errors:
                db.session.rollback()
                logger.warning('Profile creation errors: %s, Data: %s', errors, data)
                return None, {"errors": errors, "success": False}

            db.session.commit()
            logger.info('User registered successfully: user_id=%s, email=%s', user.user_id, user.email)
            return user, None
        except Exception as e:
            db.session.rollback()
            logger.error('Register error: %s, Data: %s', str(e), data, exc_info=True)
            return None, {"errors": [f"Failed to register user: {str(e)}"], "success": False}

    def refresh_token(self, user_id):
        try:
            # 🔧 FIX: Handle both string and integer user_id
            if isinstance(user_id, str):
                try:
                    user_id_int = int(user_id)
                except (ValueError, TypeError):
                    logger.error('Invalid user_id format: %s', user_id)
                    return None, {"errors": ["Invalid user ID format"], "success": False}
            else:
                user_id_int = user_id

            user = self.auth_repo.get_user_by(user_id=user_id_int)
            if not user:
                logger.warning('User not found for user_id: %s', user_id)
                return None, {"errors": ["User not found"], "success": False}
            if not user.is_active:
                logger.warning('Account is deactivated for user_id: %s', user_id)
                return None, {"errors": ["Account is deactivated"], "success": False}

            # 🔧 FIX: Always use string for JWT identity
            access_token = create_access_token(identity=str(user.user_id))
            logger.info('Generated new access token for user_id: %s (as string)', str(user.user_id))
            return access_token, None
        except Exception as e:
            logger.error('Refresh token error for user_id %s: %s', user_id, str(e), exc_info=True)
            return None, {"errors": [f"Failed to refresh token: {str(e)}"], "success": False}

    def get_user_with_role(self, user):
        try:
            user_data = user.to_dict()
            user_data['role'] = user.role.to_dict() if user.role else None
            user_data['parent_info'] = user.parent.to_dict() if user.parent else None
            user_data['doctor_info'] = user.doctor.to_dict() if user.doctor else None
            user_data['admin_info'] = user.admin.to_dict() if user.admin else None
            logger.debug('Fetched user with role: user_id=%s', user.user_id)
            return user_data
        except Exception as e:
            logger.error('Error in get_user_with_role for user_id %s: %s', user.user_id, str(e), exc_info=True)
            return {}

    def get_all_users(self):
        try:
            users = self.auth_repo.get_all()
            logger.info('Fetched %d users', len(users))
            return users
        except Exception as e:
            logger.error('Error fetching all users: %s', str(e), exc_info=True)
            return []