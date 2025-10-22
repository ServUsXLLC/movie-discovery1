from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: Optional[str]

class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    display_name: Optional[str]
    avatar: Optional[str]
    bio: Optional[str]
    created_at: Optional[datetime]
    class Config:
        orm_mode = True

class RefreshIn(BaseModel):
    refresh_token: str

class ForgotPasswordIn(BaseModel):
    email: EmailStr

class ResetPasswordIn(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
