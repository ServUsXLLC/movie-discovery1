from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import user as user_models
from datetime import datetime, timedelta
import bcrypt
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["admin"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/users")
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(user_models.User).offset(skip).limit(limit).all()
    total = db.query(user_models.User).count()
    return {
        "users": [
            {
                "id": u.id,
                "display_name": u.display_name,
                "email": u.email,
                "is_active": u.is_active,
                "avatar": u.avatar,
                "hashed_password": u.hashed_password,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        "total": total,
    }


@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(user_id: int, db: Session = Depends(get_db)):
    user = db.query(user_models.User).filter(user_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"message": "User status updated", "is_active": user.is_active}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(user_models.User).filter(user_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    total_users = db.query(user_models.User).count()
    total_movies = 0  # no movie model currently
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_users_30_days = db.query(user_models.User).filter(user_models.User.created_at >= thirty_days_ago).count()
    active_users = db.query(user_models.User).filter(user_models.User.is_active == True).count()
    return {
        "total_users": total_users,
        "total_movies": total_movies,
        "new_users_30_days": new_users_30_days,
        "active_users": active_users,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/verify-password")
def verify_password(user_id: int, password: str, db: Session = Depends(get_db)):
    user = db.query(user_models.User).filter(user_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    is_valid = False
    try:
        is_valid = bcrypt.checkpw(password.encode("utf-8"), user.hashed_password.encode("utf-8"))
    except Exception:
        is_valid = False
    return {
        "user_id": user_id,
        "email": user.email,
        "is_valid": is_valid,
        "message": "Password is valid" if is_valid else "Password is invalid",
    }


class PasswordUpdate(BaseModel):
    new_password: str


@router.put("/users/{user_id}/password")
def update_user_password(user_id: int, body: PasswordUpdate, db: Session = Depends(get_db)):
    user = db.query(user_models.User).filter(user_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not body.new_password or len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password too short")
    user.hashed_password = bcrypt.hashpw(body.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    db.commit()
    return {"message": "Password updated"}


