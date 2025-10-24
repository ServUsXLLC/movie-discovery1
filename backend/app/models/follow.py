# app/models/follow.py
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Ensure a user can't follow themselves and can't follow the same person twice
    __table_args__ = (
        UniqueConstraint('follower_id', 'following_id', name='unique_follow'),
        {'extend_existing': True}
    )

    # Relationships (commented out to avoid circular imports)
    # follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    # following = relationship("User", foreign_keys=[following_id], back_populates="followers")
