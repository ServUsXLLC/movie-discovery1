# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.utils.deps import get_current_user
from app import models, schemas
from app.database import get_db


# ✅ Pydantic model for user output
class UserOut(BaseModel):
    id: int
    email: EmailStr
    display_name: str | None = None

    class Config:
        orm_mode = True


# ✅ Important: only prefix "/users", not "/api/users"
router = APIRouter(prefix="/users", tags=["Users"])


# ✅ Endpoint: Get current user profile (requires token)
@router.get("/me", response_model=UserOut)
def read_profile(current_user=Depends(get_current_user)):
    return current_user


# ✅ Endpoint: Get another user's public profile by ID
@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
