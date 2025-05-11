from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    confirm_password: str

    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class FirebaseLogin(BaseModel):
    id_token: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    password: str = Field(..., min_length=8)
    confirm_password: str

    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

class VerifyEmail(BaseModel):
    token: str

class UserInDB(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    role: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    firebase_uid: Optional[str] = None

    class Config:
        orm_mode = True

class UserResponse(UserInDB):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None