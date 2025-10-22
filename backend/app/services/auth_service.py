from sqlalchemy.orm import Session
from app.models.user import User, RefreshToken
from app.models.user import User
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token
from datetime import timedelta
from pydantic import BaseModel, EmailStr, Field
import uuid

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: str | None = None

def register(db: Session, data: RegisterIn):
    if db.query(User).filter(User.email == data.email).first():
        raise ValueError("Email already registered")
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        display_name=data.display_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate(db, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None

    print("🔍 Plain password:", password)
    print("🔍 Stored hash:", user.hashed_password)
    print("🔍 Verified:", verify_password(password, user.hashed_password))

    if not verify_password(password, user.hashed_password):
        return None

    access = create_access_token(user.id)
    refresh_token_str = create_refresh_token()
    
    # Store refresh token in database
    refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        jti=str(uuid.uuid4())
    )
    db.add(refresh_token)
    db.commit()

    return {"user": user, "access": access, "refresh": refresh_token_str}



def refresh_token(db: Session, refresh_str: str):
    rt = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_str,
        RefreshToken.revoked == False
    ).first()
    
    if not rt:
        return None  # Invalid or already used refresh token
    
    # Revoke old refresh token
    rt.revoked = True
    db.add(rt)
    db.commit()
    
    # Issue new tokens
    access = create_access_token(rt.user_id)
    new_refresh = create_refresh_token()
    
    # Save new refresh token
    new_rt = RefreshToken(user_id=rt.user_id, token=new_refresh, jti=str(uuid.uuid4()))
    db.add(new_rt)
    db.commit()
    
    return {"access": access, "refresh": new_refresh}

def revoke_refresh(db: Session, refresh_str: str):
    rt = db.query(RefreshToken).filter(RefreshToken.token == refresh_str).first()
    if rt:
        rt.revoked = True
        db.add(rt)
        db.commit()
        return True
    return False
