from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, conint

from app.database import SessionLocal
from app.models.review import Review

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ReviewCreate(BaseModel):
    user_id: int
    movie_id: int
    rating: conint(ge=1, le=5)
    comment: str | None = None


@router.post("/")
def create_review(body: ReviewCreate, db: Session = Depends(get_db)):
    review = Review(
        user_id=body.user_id,
        movie_id=body.movie_id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return {"id": review.id}


@router.get("/movie/{movie_id}")
def list_reviews_for_movie(movie_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.movie_id == movie_id).order_by(Review.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "movie_id": r.movie_id,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reviews
    ]


@router.get("/user/{user_id}")
def list_reviews_for_user(user_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.user_id == user_id).order_by(Review.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "movie_id": r.movie_id,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reviews
    ]


@router.delete("/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(review)
    db.commit()
    return {"message": "Review deleted"}













