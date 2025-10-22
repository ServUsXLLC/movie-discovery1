from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator

from app.database import SessionLocal
from app.models.list_item import ListItem


router = APIRouter(prefix="/lists", tags=["lists"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


ALLOWED_KINDS = {"watchlist", "favorites", "watched"}


class ListItemBody(BaseModel):
    user_id: int
    movie_id: int
    kind: str

    @field_validator("kind")
    @classmethod
    def validate_kind(cls, v: str):
        if v not in ALLOWED_KINDS:
            raise ValueError("Invalid kind")
        return v


@router.post("/")
def add_item(body: ListItemBody, db: Session = Depends(get_db)):
    # Check if movie exists in our database, if not create it
    from app.models.movie import Movie
    movie = db.query(Movie).filter(Movie.tmdb_id == body.movie_id).first()
    if not movie:
        # Create a basic movie record with TMDB ID
        movie = Movie(tmdb_id=body.movie_id, title=f"TMDB Movie {body.movie_id}")
        db.add(movie)
        db.commit()
        db.refresh(movie)

    existing = (
        db.query(ListItem)
        .filter(
            ListItem.user_id == body.user_id,
            ListItem.movie_id == movie.id,  # Use our internal movie ID
            ListItem.kind == body.kind,
        )
        .first()
    )
    if existing:
        return {"id": existing.id}

    item = ListItem(user_id=body.user_id, movie_id=movie.id, kind=body.kind)
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id}


@router.delete("/")
def remove_item(user_id: int, movie_id: int, kind: str, db: Session = Depends(get_db)):
    if kind not in ALLOWED_KINDS:
        raise HTTPException(status_code=400, detail="Invalid kind")
    
    # Find the movie by TMDB ID
    from app.models.movie import Movie
    movie = db.query(Movie).filter(Movie.tmdb_id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    item = (
        db.query(ListItem)
        .filter(
            ListItem.user_id == user_id,
            ListItem.movie_id == movie.id,  # Use our internal movie ID
            ListItem.kind == kind,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Removed"}


@router.get("/{user_id}/{kind}")
def list_items(user_id: int, kind: str, db: Session = Depends(get_db)):
    if kind not in ALLOWED_KINDS:
        raise HTTPException(status_code=400, detail="Invalid kind")
    
    from app.models.movie import Movie
    items = (
        db.query(ListItem, Movie)
        .join(Movie, ListItem.movie_id == Movie.id)
        .filter(ListItem.user_id == user_id, ListItem.kind == kind)
        .order_by(ListItem.created_at.desc())
        .all()
    )
    return [{"movie_id": movie.tmdb_id, "id": item.id, "created_at": item.created_at} for item, movie in items]




