from pydantic import BaseModel, EmailStr, ValidationError, validator
from typing import Optional, List

class LoginData(BaseModel):
    email: EmailStr
    password: str

class RegisterData(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

def validate_login_data(data) -> List[str]:
    try:
        LoginData(**data)
        return []
    except ValidationError as e:
        return [err['msg'] for err in e.errors()]

def validate_register_data(data) -> List[str]:
    try:
        RegisterData(**data)
        return []
    except ValidationError as e:
        return [err['msg'] for err in e.errors()]