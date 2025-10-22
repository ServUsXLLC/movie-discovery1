from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid
from app.database import Base
from app.config import settings  # contains refresh_token_expire_days


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    display_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    refresh_tokens = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    # list_items = relationship(
    #     "ListItem", back_populates="user", cascade="all, delete-orphan"
    # )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    jti = Column(String, unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(
        DateTime,
        default=lambda: datetime.utcnow() + timedelta(
            days=getattr(settings, "refresh_token_expire_days", 7)
        ),
    )

    user = relationship("User", back_populates="refresh_tokens")


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    release_year = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to list items (commented out to avoid circular import issues)
    # list_items = relationship("ListItem", back_populates="movie", cascade="all, delete-orphan")


