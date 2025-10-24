# app/routers/user_insights.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func, text
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import statistics

from app.database import get_db
from app.models.user import User
from app.models.list_item import ListItem
from app.models.movie import Movie
from app.models.follow import Follow
from app.utils.deps import get_current_user

router = APIRouter(prefix="/user-insights", tags=["user-insights"])

@router.get("/{user_id}")
def get_user_insights(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive user insights and watching patterns"""
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's movie activity
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
    followers = db.query(Follow).filter(Follow.following_id == user_id).count()
    following = db.query(Follow).filter(Follow.follower_id == user_id).count()
    
    # Calculate insights
    insights = {
        "user": {
            "id": user.id,
            "display_name": user.display_name,
            "email": user.email,
            "created_at": user.created_at,
            "is_active": user.is_active
        },
        "activity_summary": {
            "total_movies": len(watchlist_items) + len(favorites_items),
            "watchlist_count": len(watchlist_items),
            "favorites_count": len(favorites_items),
            "followers_count": followers,
            "following_count": following,
            "activity_score": calculate_activity_score(len(watchlist_items), len(favorites_items), followers, following)
        },
        "watching_patterns": analyze_watching_patterns(watchlist_items, favorites_items),
        "engagement_metrics": calculate_engagement_metrics(watchlist_items, favorites_items, user.created_at),
        "preferences": analyze_preferences(watchlist_items, favorites_items),
        "social_activity": analyze_social_activity(followers, following, user.created_at),
        "recommendations": generate_recommendations(watchlist_items, favorites_items)
    }
    
    return insights

@router.get("/{user_id}/trends")
def get_user_trends(
    user_id: int,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user activity trends over time"""
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get daily activity
    daily_activity = []
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        next_date = current_date + timedelta(days=1)
        
        # Count watchlist additions
        watchlist_count = (
            db.query(ListItem)
            .filter(
                ListItem.user_id == user_id,
                ListItem.kind == "watchlist",
                ListItem.created_at >= current_date,
                ListItem.created_at < next_date
            )
            .count()
        )
        
        # Count favorites additions
        favorites_count = (
            db.query(ListItem)
            .filter(
                ListItem.user_id == user_id,
                ListItem.kind == "favorites",
                ListItem.created_at >= current_date,
                ListItem.created_at < next_date
            )
            .count()
        )
        
        daily_activity.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "watchlist_additions": watchlist_count,
            "favorites_additions": favorites_count,
            "total_activity": watchlist_count + favorites_count
        })
    
    return {
        "user_id": user_id,
        "period_days": days,
        "daily_activity": daily_activity,
        "summary": {
            "total_watchlist_additions": sum(day["watchlist_additions"] for day in daily_activity),
            "total_favorites_additions": sum(day["favorites_additions"] for day in daily_activity),
            "average_daily_activity": statistics.mean([day["total_activity"] for day in daily_activity]) if daily_activity else 0,
            "most_active_day": max(daily_activity, key=lambda x: x["total_activity"])["date"] if daily_activity else None
        }
    }

@router.get("/comparison/{user_id}")
def compare_user_activity(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare user activity with platform averages"""
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user stats
    user_watchlist = db.query(ListItem).filter(ListItem.user_id == user_id, ListItem.kind == "watchlist").count()
    user_favorites = db.query(ListItem).filter(ListItem.user_id == user_id, ListItem.kind == "favorites").count()
    user_followers = db.query(Follow).filter(Follow.following_id == user_id).count()
    user_following = db.query(Follow).filter(Follow.follower_id == user_id).count()
    
    # Get platform averages
    total_users = db.query(User).count()
    total_watchlist = db.query(ListItem).filter(ListItem.kind == "watchlist").count()
    total_favorites = db.query(ListItem).filter(ListItem.kind == "favorites").count()
    total_follows = db.query(Follow).count()
    
    platform_avg_watchlist = total_watchlist / total_users if total_users > 0 else 0
    platform_avg_favorites = total_favorites / total_users if total_users > 0 else 0
    platform_avg_follows = total_follows / total_users if total_users > 0 else 0
    
    return {
        "user_id": user_id,
        "user_stats": {
            "watchlist": user_watchlist,
            "favorites": user_favorites,
            "followers": user_followers,
            "following": user_following
        },
        "platform_averages": {
            "watchlist": round(platform_avg_watchlist, 2),
            "favorites": round(platform_avg_favorites, 2),
            "follows": round(platform_avg_follows, 2)
        },
        "comparison": {
            "watchlist_vs_avg": round((user_watchlist / platform_avg_watchlist - 1) * 100, 1) if platform_avg_watchlist > 0 else 0,
            "favorites_vs_avg": round((user_favorites / platform_avg_favorites - 1) * 100, 1) if platform_avg_favorites > 0 else 0,
            "follows_vs_avg": round(((user_followers + user_following) / (platform_avg_follows * 2) - 1) * 100, 1) if platform_avg_follows > 0 else 0
        }
    }

def calculate_activity_score(watchlist_count: int, favorites_count: int, followers_count: int, following_count: int) -> int:
    """Calculate user activity score (0-100)"""
    score = 0
    score += min(watchlist_count * 2, 30)  # Max 30 points for watchlist
    score += min(favorites_count * 5, 25)  # Max 25 points for favorites
    score += min(followers_count * 3, 20)  # Max 20 points for followers
    score += min(following_count * 2, 15)  # Max 15 points for following
    score += 10 if watchlist_count > 0 or favorites_count > 0 else 0  # Bonus for any activity
    return min(score, 100)

def analyze_watching_patterns(watchlist_items: List, favorites_items: List) -> Dict:
    """Analyze user's watching patterns"""
    all_items = watchlist_items + favorites_items
    
    if not all_items:
        return {
            "activity_level": "Inactive",
            "preference_consistency": "Unknown",
            "discovery_rate": "Unknown",
            "engagement_depth": "Unknown"
        }
    
    # Calculate time between additions
    timestamps = [item.created_at for item, movie in all_items]
    timestamps.sort()
    
    if len(timestamps) > 1:
        time_diffs = [(timestamps[i+1] - timestamps[i]).days for i in range(len(timestamps)-1)]
        avg_time_between = statistics.mean(time_diffs) if time_diffs else 0
    else:
        avg_time_between = 0
    
    # Determine activity level
    total_items = len(all_items)
    if total_items >= 20:
        activity_level = "Very Active"
    elif total_items >= 10:
        activity_level = "Active"
    elif total_items >= 5:
        activity_level = "Moderate"
    elif total_items >= 1:
        activity_level = "Light"
    else:
        activity_level = "Inactive"
    
    # Calculate engagement depth (favorites vs watchlist ratio)
    favorites_ratio = len(favorites_items) / total_items if total_items > 0 else 0
    if favorites_ratio >= 0.5:
        engagement_depth = "High"
    elif favorites_ratio >= 0.2:
        engagement_depth = "Medium"
    else:
        engagement_depth = "Low"
    
    return {
        "activity_level": activity_level,
        "total_movies_interacted": total_items,
        "average_time_between_additions_days": round(avg_time_between, 1),
        "favorites_ratio": round(favorites_ratio, 2),
        "engagement_depth": engagement_depth,
        "discovery_rate": "High" if avg_time_between < 7 else "Medium" if avg_time_between < 30 else "Low"
    }

def calculate_engagement_metrics(watchlist_items: List, favorites_items: List, user_created_at: datetime) -> Dict:
    """Calculate user engagement metrics"""
    total_items = len(watchlist_items) + len(favorites_items)
    
    if not user_created_at:
        return {"account_age_days": 0, "items_per_day": 0, "engagement_level": "Unknown"}
    
    account_age_days = (datetime.utcnow() - user_created_at).days
    items_per_day = total_items / account_age_days if account_age_days > 0 else 0
    
    # Determine engagement level
    if items_per_day >= 1:
        engagement_level = "Very High"
    elif items_per_day >= 0.5:
        engagement_level = "High"
    elif items_per_day >= 0.1:
        engagement_level = "Medium"
    elif items_per_day > 0:
        engagement_level = "Low"
    else:
        engagement_level = "None"
    
    return {
        "account_age_days": account_age_days,
        "items_per_day": round(items_per_day, 3),
        "engagement_level": engagement_level,
        "total_sessions": total_items  # Simplified: assuming each addition is a session
    }

def analyze_preferences(watchlist_items: List, favorites_items: List) -> Dict:
    """Analyze user preferences (simplified - would need more movie data for real analysis)"""
    all_items = watchlist_items + favorites_items
    
    if not all_items:
        return {
            "preferred_genres": [],
            "preferred_years": [],
            "diversity_score": 0,
            "preference_stability": "Unknown"
        }
    
    # This is simplified - in a real app, you'd analyze actual movie genres, years, etc.
    return {
        "preferred_genres": ["Action", "Drama", "Comedy"],  # Placeholder
        "preferred_years": ["2020s", "2010s"],  # Placeholder
        "diversity_score": 75,  # Placeholder
        "preference_stability": "High" if len(favorites_items) > len(watchlist_items) else "Medium"
    }

def analyze_social_activity(followers_count: int, following_count: int, user_created_at: datetime) -> Dict:
    """Analyze user's social activity"""
    total_connections = followers_count + following_count
    
    # Determine social level
    if total_connections >= 20:
        social_level = "Very Social"
    elif total_connections >= 10:
        social_level = "Social"
    elif total_connections >= 5:
        social_level = "Moderately Social"
    elif total_connections >= 1:
        social_level = "Lightly Social"
    else:
        social_level = "Not Social"
    
    # Calculate influence score
    influence_score = min(followers_count * 2 + following_count, 100)
    
    return {
        "social_level": social_level,
        "total_connections": total_connections,
        "influence_score": influence_score,
        "follower_to_following_ratio": round(followers_count / following_count, 2) if following_count > 0 else float('inf')
    }

def generate_recommendations(watchlist_items: List, favorites_items: List) -> Dict:
    """Generate recommendations based on user activity"""
    total_items = len(watchlist_items) + len(favorites_items)
    
    recommendations = []
    
    if total_items == 0:
        recommendations.append("Start exploring movies by adding some to your watchlist!")
    elif len(favorites_items) == 0:
        recommendations.append("Try marking some movies as favorites to help us understand your preferences better.")
    elif len(watchlist_items) > len(favorites_items) * 2:
        recommendations.append("You have many movies in your watchlist. Consider watching some and marking favorites!")
    elif total_items < 5:
        recommendations.append("Keep exploring! Add more movies to get better recommendations.")
    else:
        recommendations.append("Great activity! Keep discovering new movies.")
    
    return {
        "recommendations": recommendations,
        "next_actions": [
            "Explore trending movies",
            "Check out recommendations from users you follow",
            "Add movies to your watchlist",
            "Mark movies as favorites"
        ]
    }
