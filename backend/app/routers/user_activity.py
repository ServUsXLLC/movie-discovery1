# app/routers/user_activity.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Dict, Any

from app.database import get_db
from app.models.user import User
from app.models.list_item import ListItem
from app.models.movie import Movie
from app.models.follow import Follow
from app.utils.deps import get_current_user

router = APIRouter(prefix="/user-activity", tags=["user-activity"])

@router.get("/{user_id}")
def get_user_activity(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive user activity including movies and follows"""
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's movie lists
    watchlist_items = (
        db.query(ListItem, Movie)
        .join(Movie, ListItem.movie_id == Movie.id)
        .filter(ListItem.user_id == user_id, ListItem.kind == "watchlist")
        .order_by(desc(ListItem.created_at))
        .all()
    )
    
    favorites_items = (
        db.query(ListItem, Movie)
        .join(Movie, ListItem.movie_id == Movie.id)
        .filter(ListItem.user_id == user_id, ListItem.kind == "favorites")
        .order_by(desc(ListItem.created_at))
        .all()
    )
    
    # Get follow activity
    followers = (
        db.query(Follow, User)
        .join(User, Follow.follower_id == User.id)
        .filter(Follow.following_id == user_id)
        .order_by(desc(Follow.created_at))
        .all()
    )
    
    following = (
        db.query(Follow, User)
        .join(User, Follow.following_id == User.id)
        .filter(Follow.follower_id == user_id)
        .order_by(desc(Follow.created_at))
        .all()
    )
    
    # Format the response
    activity = {
        "user": {
            "id": user.id,
            "display_name": user.display_name,
            "email": user.email,
            "avatar": user.avatar,
            "bio": user.bio,
            "created_at": user.created_at,
            "is_active": user.is_active
        },
        "movie_activity": {
            "watchlist": [
                {
                    "movie_id": movie.tmdb_id,
                    "title": movie.title,
                    "added_at": item.created_at
                }
                for item, movie in watchlist_items
            ],
            "favorites": [
                {
                    "movie_id": movie.tmdb_id,
                    "title": movie.title,
                    "added_at": item.created_at
                }
                for item, movie in favorites_items
            ],
            "total_watchlist": len(watchlist_items),
            "total_favorites": len(favorites_items)
        },
        "follow_activity": {
            "followers": [
                {
                    "user_id": follower.id,
                    "display_name": follower.display_name,
                    "email": follower.email,
                    "followed_at": follow.created_at
                }
                for follow, follower in followers
            ],
            "following": [
                {
                    "user_id": following_user.id,
                    "display_name": following_user.display_name,
                    "email": following_user.email,
                    "followed_at": follow.created_at
                }
                for follow, following_user in following
            ],
            "total_followers": len(followers),
            "total_following": len(following)
        },
        "summary": {
            "total_movies": len(watchlist_items) + len(favorites_items),
            "total_connections": len(followers) + len(following),
            "account_age_days": 0  # Simplified for now
        }
    }
    
    return activity

@router.get("/{user_id}/recent")
def get_recent_user_activity(
    user_id: int,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent user activity in chronological order"""
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    recent_activities = []
    
    # Get recent watchlist additions
    watchlist_items = (
        db.query(ListItem, Movie)
        .join(Movie, ListItem.movie_id == Movie.id)
        .filter(ListItem.user_id == user_id, ListItem.kind == "watchlist")
        .order_by(desc(ListItem.created_at))
        .limit(limit)
        .all()
    )
    
    for item, movie in watchlist_items:
        recent_activities.append({
            "type": "watchlist",
            "action": "added to watchlist",
            "movie_id": movie.tmdb_id,
            "movie_title": movie.title,
            "timestamp": item.created_at
        })
    
    # Get recent favorites
    favorites_items = (
        db.query(ListItem, Movie)
        .join(Movie, ListItem.movie_id == Movie.id)
        .filter(ListItem.user_id == user_id, ListItem.kind == "favorites")
        .order_by(desc(ListItem.created_at))
        .limit(limit)
        .all()
    )
    
    for item, movie in favorites_items:
        recent_activities.append({
            "type": "favorites",
            "action": "added to favorites",
            "movie_id": movie.tmdb_id,
            "movie_title": movie.title,
            "timestamp": item.created_at
        })
    
    # Get recent follow activities
    followers = (
        db.query(Follow, User)
        .join(User, Follow.follower_id == User.id)
        .filter(Follow.following_id == user_id)
        .order_by(desc(Follow.created_at))
        .limit(limit)
        .all()
    )
    
    for follow, follower in followers:
        recent_activities.append({
            "type": "follow",
            "action": "gained follower",
            "user_id": follower.id,
            "user_name": follower.display_name,
            "timestamp": follow.created_at
        })
    
    following = (
        db.query(Follow, User)
        .join(User, Follow.following_id == User.id)
        .filter(Follow.follower_id == user_id)
        .order_by(desc(Follow.created_at))
        .limit(limit)
        .all()
    )
    
    for follow, following_user in following:
        recent_activities.append({
            "type": "follow",
            "action": "started following",
            "user_id": following_user.id,
            "user_name": following_user.display_name,
            "timestamp": follow.created_at
        })
    
    # Sort all activities by timestamp
    recent_activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "user": {
            "id": user.id,
            "display_name": user.display_name,
            "email": user.email
        },
        "recent_activities": recent_activities[:limit]
    }
