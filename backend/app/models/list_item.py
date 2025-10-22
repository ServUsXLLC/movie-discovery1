# app/models/list_item.py
from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class ListItem(Base):
    __tablename__ = "list_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False)
    kind = Column(String(50), nullable=False, default="watchlist")  # e.g., watchlist, favorites, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

