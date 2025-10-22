from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.utils.security import decode_token
from app.database import get_db
from app.models.user import User

def get_current_user(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = authorization.split(" ", 1)[1] if authorization.startswith("Bearer ") else authorization

    data = decode_token(token)
    if not data or "sub" not in data:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user_id = int(data["sub"])
    user = db.get(User, user_id)  # ✅ modern SQLAlchemy syntax
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
