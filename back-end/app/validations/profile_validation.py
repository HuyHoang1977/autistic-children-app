from pydantic import BaseModel, validator
from typing import Optional

class ParentProfile(BaseModel):
    number_of_children: Optional[int]
    children_info: Optional[str]
    parenting_concerns: Optional[str]

class DoctorProfile(BaseModel):
    specialty: Optional[str]
    license_number: Optional[str]
    clinic_name: Optional[str]
    clinic_address: Optional[str]
    years_experience: Optional[int]
    bio: Optional[str]

class ChildProfile(BaseModel):
    name: str
    birth_date: str
    gender: str
    weight: Optional[float]
    height: Optional[float]
    medical_history: Optional[str]
    allergies: Optional[str]
    vaccination_record: Optional[str]

    @validator('gender')
    def gender_must_be_valid(cls, v):
        if v not in ['male', 'female']:
            raise ValueError('gender must be "male" or "female"')
        return v

class UserProfile(BaseModel):
    """Validation cho cập nhật thông tin user"""
    username: Optional[str]
    email: Optional[str]
    full_name: Optional[str]
    phone: Optional[str]
    
    @validator('email')
    def email_must_be_valid(cls, v):
        if v and '@' not in v:
            raise ValueError('Invalid email format')
        return v