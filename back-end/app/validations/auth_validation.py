from pydantic import BaseModel, EmailStr, ValidationError, field_validator
from typing import Optional, List

# Định nghĩa role_id
ROLE_ADMIN = 1
ROLE_DOCTOR = 2
ROLE_PARENT = 3

class LoginData(BaseModel):
    email: EmailStr
    password: str

class RegisterData(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role_id: int
    is_active: Optional[bool] = True
    user_type: Optional[int] = None  # Làm user_type không bắt buộc
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    years_experience: Optional[int] = None
    bio: Optional[str] = None
    verified: Optional[bool] = None
    verification_date: Optional[str] = None
    rating: Optional[float] = None
    total_reviews: Optional[int] = None
    number_of_children: Optional[int] = None
    children_info: Optional[str] = None
    parenting_concerns: Optional[str] = None

    @field_validator('role_id')
    @classmethod
    def validate_role_id(cls, v):
        valid_roles = [ROLE_ADMIN, ROLE_DOCTOR, ROLE_PARENT]
        if v not in valid_roles:
            raise ValueError(f"role_id must be one of {valid_roles}")
        return v

    @field_validator('user_type')
    @classmethod
    def validate_user_type(cls, v, info):
        # Gán user_type = role_id nếu không cung cấp
        role_id = info.data.get('role_id')
        if v is None:
            return role_id
        if v != role_id:
            raise ValueError("user_type must match role_id")
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v

    @field_validator('specialty', 'license_number', 'clinic_name', 'clinic_address')
    @classmethod
    def validate_doctor_fields(cls, v, info):
        if info.data.get('role_id') == ROLE_DOCTOR and not v:
            raise ValueError(f"{info.field_name} is required for doctors")
        return v

    @field_validator('number_of_children')
    @classmethod
    def validate_parent_fields(cls, v, info):
        if info.data.get('role_id') == ROLE_PARENT and (v is None or v < 0):
            raise ValueError("number_of_children must be provided and non-negative for parents")
        return v

def validate_login_data(data) -> List[dict]:
    try:
        LoginData(**data)
        return []
    except ValidationError as e:
        return [{"field": err["loc"][0], "message": err["msg"]} for err in e.errors()]

def validate_register_data(data) -> List[dict]:
    try:
        RegisterData(**data)
        return []
    except ValidationError as e:
        return [{"field": err["loc"][0], "message": err["msg"]} for err in e.errors()]