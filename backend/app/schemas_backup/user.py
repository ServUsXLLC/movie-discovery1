from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    id: int
    display_name: str
    email: str
    avatar: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # replaces orm_mode=True in Pydantic v2


class UserResponse(UserBase):
    pass  # You can extend this later with more info if needed
