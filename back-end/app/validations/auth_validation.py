from pydantic import BaseModel, EmailStr, ValidationError
from typing import Optional, List
from enum import Enum

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
    # address: Optional[str] = None
    # emergency_contact: Optional[str] = None
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    role_id: int
    is_active: Optional[bool] = None

def validate_login_data(data) -> List[str]:
    try:
        LoginData(**data)
        return []
    except ValidationError as e:
        return [err['msg'] for err in e.errors()]

def validate_register_data(data) -> List[str]:
    errors = []
    # Kiểm tra các trường bắt buộc
    required_fields = ['username', 'email', 'password', 'full_name', 'role_id', 'is_active']
    for field in required_fields:
        if not data.get(field):
            errors.append(f"{field} is required")
    # Nếu là doctor, kiểm tra các trường riêng
    if data.get('role_id') == ROLE_DOCTOR:
        for field in ['specialty', 'license_number', 'clinic_name', 'clinic_address']:
            if not data.get(field):
                errors.append(f"{field} is required for doctor")
    return errors