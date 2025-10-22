# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from app.database import get_db
from app.services import auth_service
from app.utils.email import send_email
from app.utils.security import create_access_token, decode_token, hash_password
from app.models.user import User
from app.config import settings

router = APIRouter(tags=["Auth"])  # 👈 Do NOT add /api prefix here — handled in main.py


# ---------- SCHEMAS ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: str | None = None


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
    display_name: str | None = None


class RefreshIn(BaseModel):
    refresh_token: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


# ---------- ROUTES ----------
@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        user = auth_service.register(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return user


@router.post("/login")
def login(payload: LoginIn, db: Session = Depends(get_db)):
    """Authenticate a user and return access + refresh tokens."""
    auth = auth_service.authenticate(db, payload.email, payload.password)
    if not auth:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    user = auth["user"]
    return {
        "access_token": auth["access"],
        "refresh_token": auth["refresh"],
        "user": {
            "id": user.id,
            "email": user.email,
            "display_name": getattr(user, "display_name", None),
        },
    }


@router.post("/refresh", response_model=TokenOut)
def refresh(payload: RefreshIn, db: Session = Depends(get_db)):
    """Refresh access token using a valid refresh token."""
    out = auth_service.refresh_token(db, payload.refresh_token)
    if not out:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    return {
        "access_token": out["access"],
        "refresh_token": payload.refresh_token,
        "token_type": "bearer",
    }


@router.post("/logout")
def logout(payload: RefreshIn, db: Session = Depends(get_db)):
    """Revoke a refresh token (logout)."""
    auth_service.revoke_refresh(db, payload.refresh_token)
    return {"message": "Logged out successfully"}


@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Send password reset link via email."""
    user = db.query(User).filter(User.email == payload.email).first()

    # Security: don't reveal if user exists
    if not user:
        return {"message": "If the account exists, a reset link has been sent to the email."}

    # Create a short-lived token for password reset
    token = create_access_token(user.id)
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    background_tasks.add_task(
        send_email,
        user.email,
        "Password Reset",
        f"Click here to reset your password: {reset_link}"
    )

    return {"message": "If the account exists, a reset link has been sent to the email."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordIn, db: Session = Depends(get_db)):
    """Reset user's password using a valid token."""
    payload_data = decode_token(payload.token)
    if not payload_data:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user_id = int(payload_data.get("sub"))
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(payload.new_password)
    db.add(user)
    db.commit()

    return {"message": "Password reset successful"}