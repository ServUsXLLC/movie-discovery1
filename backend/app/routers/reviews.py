from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from pydantic import BaseModel, conint, Field
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.review import Review
from app.models.user import User
from app.utils.deps import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReviewCreate(BaseModel):
    tmdb_id: int
    rating: conint(ge=1, le=10) = Field(..., description="Rating from 1-10")
    comment: Optional[str] = Field(None, max_length=2000, description="Review text")


class ReviewUpdate(BaseModel):
    rating: Optional[conint(ge=1, le=10)] = None
    comment: Optional[str] = Field(None, max_length=2000)


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_avatar: Optional[str]
    tmdb_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]


class MovieRatingStats(BaseModel):
    tmdb_id: int
    total_reviews: int
    average_rating: float
    rating_distribution: dict


@router.post("/", response_model=ReviewResponse)
def create_review(
    body: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new review for a movie"""
    
    # Check if user already reviewed this movie
    existing_review = db.query(Review).filter(
        and_(
            Review.user_id == current_user.id,
            Review.movie_id == body.tmdb_id
        )
    ).first()
    
    if existing_review:
        raise HTTPException(
            status_code=400,
            detail="You have already reviewed this movie. Use PUT to update your review."
        )
    
    # Create new review
    review = Review(
        user_id=current_user.id,
        movie_id=body.tmdb_id,  # Store tmdb_id in movie_id field
        tmdb_id=body.tmdb_id,   # Also store in tmdb_id for consistency
        rating=body.rating,
        comment=body.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    
    return ReviewResponse(
        id=review.id,
        user_id=review.user_id,
        user_name=current_user.display_name,
        user_avatar=current_user.avatar,
        tmdb_id=review.movie_id,  # Return movie_id as tmdb_id for API consistency
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
        updated_at=review.updated_at
    )


@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    body: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing review"""
    
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Check if user owns this review
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own reviews")
    
    # Update fields
    if body.rating is not None:
        review.rating = body.rating
    if body.comment is not None:
        review.comment = body.comment
    
    db.commit()
    db.refresh(review)
    
    return ReviewResponse(
        id=review.id,
        user_id=review.user_id,
        user_name=current_user.display_name,
        user_avatar=current_user.avatar,
        tmdb_id=review.movie_id,  # Return movie_id as tmdb_id for API consistency
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
        updated_at=review.updated_at
    )


@router.get("/movie/{tmdb_id}", response_model=List[ReviewResponse])
def get_movie_reviews(
    tmdb_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all reviews for a specific movie"""
    
    reviews = (
        db.query(Review, User)
        .join(User, Review.user_id == User.id)
        .filter(Review.movie_id == tmdb_id)
        .order_by(desc(Review.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    return [
        ReviewResponse(
            id=review.id,
            user_id=review.user_id,
            user_name=user.display_name,
            user_avatar=user.avatar,
            tmdb_id=review.movie_id,  # Return movie_id as tmdb_id for API consistency
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
            updated_at=review.updated_at
        )
        for review, user in reviews
    ]


@router.get("/movie/{tmdb_id}/stats", response_model=MovieRatingStats)
def get_movie_rating_stats(tmdb_id: int, db: Session = Depends(get_db)):
    """Get rating statistics for a movie"""
    
    reviews = db.query(Review).filter(Review.movie_id == tmdb_id).all()
    
    if not reviews:
        return MovieRatingStats(
            tmdb_id=tmdb_id,
            total_reviews=0,
            average_rating=0.0,
            rating_distribution={}
        )
    
    # Calculate statistics
    total_reviews = len(reviews)
    average_rating = sum(r.rating for r in reviews) / total_reviews
    
    # Rating distribution (1-10)
    rating_distribution = {}
    for i in range(1, 11):
        count = sum(1 for r in reviews if r.rating == i)
        rating_distribution[str(i)] = count
    
    return MovieRatingStats(
        tmdb_id=tmdb_id,
        total_reviews=total_reviews,
        average_rating=round(average_rating, 1),
        rating_distribution=rating_distribution
    )


@router.get("/user/{user_id}", response_model=List[ReviewResponse])
def get_user_reviews(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all reviews by a specific user"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    reviews = (
        db.query(Review)
        .filter(Review.user_id == user_id)
        .order_by(desc(Review.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    return [
        ReviewResponse(
            id=review.id,
            user_id=review.user_id,
            user_name=user.display_name,
            user_avatar=user.avatar,
            tmdb_id=review.movie_id,  # Return movie_id as tmdb_id for API consistency
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
            updated_at=review.updated_at
        )
        for review in reviews
    ]


@router.get("/user/{user_id}/movie/{tmdb_id}")
def get_user_movie_review(
    user_id: int,
    tmdb_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific user's review for a specific movie"""
    
    review = db.query(Review, User).join(User, Review.user_id == User.id).filter(
        and_(
            Review.user_id == user_id,
            Review.movie_id == tmdb_id
        )
    ).first()
    
    if not review:
        return None
    
    review_obj, user = review
    
    return ReviewResponse(
        id=review_obj.id,
        user_id=review_obj.user_id,
        user_name=user.display_name,
        user_avatar=user.avatar,
        tmdb_id=review_obj.movie_id,  # Return movie_id as tmdb_id for API consistency
        rating=review_obj.rating,
        comment=review_obj.comment,
        created_at=review_obj.created_at,
        updated_at=review_obj.updated_at
    )


@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a review"""
    
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Check if user owns this review
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own reviews")
    
    db.delete(review)
    db.commit()
    return {"message": "Review deleted successfully"}


@router.get("/recent", response_model=List[ReviewResponse])
def get_recent_reviews(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get recent reviews across all movies"""
    
    reviews = (
        db.query(Review, User)
        .join(User, Review.user_id == User.id)
        .order_by(desc(Review.created_at))
        .limit(limit)
        .all()
    )
    
    return [
        ReviewResponse(
            id=review.id,
            user_id=review.user_id,
            user_name=user.display_name,
            user_avatar=user.avatar,
            tmdb_id=review.movie_id,  # Return movie_id as tmdb_id for API consistency
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
            updated_at=review.updated_at
        )
        for review, user in reviews
    ]
