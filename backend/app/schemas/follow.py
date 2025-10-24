# app/schemas/follow.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FollowBase(BaseModel):
    following_id: int

class FollowCreate(FollowBase):
    pass

class FollowResponse(BaseModel):
    id: int
    follower_id: int
    following_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserFollowInfo(BaseModel):
    id: int
    display_name: str
    email: str
    avatar: Optional[str] = None
    bio: Optional[str] = None
    is_following: bool = False
    followers_count: int = 0
    following_count: int = 0

    class Config:
        from_attributes = True

class FollowStats(BaseModel):
    followers_count: int
    following_count: int
    is_following: bool = False
