# app/models/movie.py
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Movie(Base):
    __tablename__ = "movies"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    tmdb_id = Column(Integer, unique=True, index=True, nullable=True)  # TMDB movie ID
    title = Column(String, nullable=False)

    # Relationship to ListItem (commented out to avoid circular import issues)
    # list_items = relationship("ListItem", back_populates="movie", cascade="all, delete-orphan")
