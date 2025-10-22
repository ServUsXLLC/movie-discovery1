from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import secrets
from app.config import settings
import jwt
from jwt import PyJWTError
from app.config import settings


# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)



def create_access_token(sub: int):
    expire = datetime.utcnow() + timedelta(minutes=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {"sub": str(sub), "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def create_refresh_token():
    """Create a random opaque refresh token (stored in DB)."""
    return secrets.token_urlsafe(64)


def decode_token(token: str):
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except PyJWTError:
        return None