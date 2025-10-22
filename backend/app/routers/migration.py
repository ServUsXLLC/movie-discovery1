from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, conint

from app.database import SessionLocal
#from app.models.user import ListItem
from app.models.list_item import ListItem


from app.models.review import Review

router = APIRouter(prefix="/api/migrate", tags=["migration"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ReviewIn(BaseModel):
    movieId: int
    rating: conint(ge=1, le=5)
    text: str


class LocalData(BaseModel):
    user_id: int
    watchlist: list[int] = []
    favorites: list[int] = []
    watched: list[int] = []
    reviews: list[ReviewIn] = []


@router.post("/")
def migrate_local_data(payload: LocalData, db: Session = Depends(get_db)):
    # Lists
    def upsert_item(uid: int, mid: int, kind: str):
        exists = (
            db.query(ListItem)
            .filter(ListItem.user_id == uid, ListItem.movie_id == mid, ListItem.kind == kind)
            .first()
        )
        if not exists:
            db.add(ListItem(user_id=uid, movie_id=mid, kind=kind))

    for mid in payload.watchlist:
        upsert_item(payload.user_id, mid, "watchlist")
    for mid in payload.favorites:
        upsert_item(payload.user_id, mid, "favorites")
    for mid in payload.watched:
        upsert_item(payload.user_id, mid, "watched")

    # Reviews: keep first if duplicates by movie
    existing_by_movie = {
        r.movie_id: r
        for r in db.query(Review).filter(Review.user_id == payload.user_id).all()
    }
    for r in payload.reviews:
        if r.movieId in existing_by_movie:
            continue
        db.add(
            Review(
                user_id=payload.user_id,
                movie_id=r.movieId,
                rating=int(r.rating),
                comment=r.text,
            )
        )

    db.commit()
    return {"status": "ok"}




