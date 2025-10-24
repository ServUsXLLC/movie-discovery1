# app/routers/follows.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional

from app.database import get_db
from app.models.follow import Follow
from app.models.user import User
from app.schemas.follow import FollowCreate, FollowResponse, UserFollowInfo, FollowStats
from app.utils.deps import get_current_user

router = APIRouter(prefix="/follows", tags=["follows"])

@router.post("/", response_model=FollowResponse)
def follow_user(
    follow_data: FollowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Follow a user"""
    # Can't follow yourself
    if follow_data.following_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    # Check if user exists
    target_user = db.query(User).filter(User.id == follow_data.following_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already following
    existing_follow = db.query(Follow).filter(
        and_(
            Follow.follower_id == current_user.id,
            Follow.following_id == follow_data.following_id
        )
    ).first()
    
    if existing_follow:
        raise HTTPException(status_code=400, detail="Already following this user")
    
    # Create follow relationship
    follow = Follow(
        follower_id=current_user.id,
        following_id=follow_data.following_id
    )
    db.add(follow)
    db.commit()
    db.refresh(follow)
    
    return follow

@router.delete("/{following_id}")
def unfollow_user(
    following_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unfollow a user"""
    follow = db.query(Follow).filter(
        and_(
            Follow.follower_id == current_user.id,
            Follow.following_id == following_id
        )
    ).first()
    
    if not follow:
        raise HTTPException(status_code=404, detail="Follow relationship not found")
    
    db.delete(follow)
    db.commit()
    
    return {"message": "Successfully unfollowed user"}

@router.get("/followers/{user_id}", response_model=List[UserFollowInfo])
def get_followers(
    user_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get followers of a user"""
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get followers with follow stats
    followers_query = db.query(
        User,
        func.count(Follow.id).label('followers_count'),
        func.count(Follow.id).label('following_count')
    ).join(
        Follow, User.id == Follow.follower_id
    ).filter(
        Follow.following_id == user_id
    ).group_by(User.id)
    
    followers = []
    for user_obj, followers_count, following_count in followers_query.all():
        # Check if current user is following this follower
        is_following = False
        if current_user:
            follow_check = db.query(Follow).filter(
                and_(
                    Follow.follower_id == current_user.id,
                    Follow.following_id == user_obj.id
                )
            ).first()
            is_following = follow_check is not None
        
        followers.append(UserFollowInfo(
            id=user_obj.id,
            display_name=user_obj.display_name,
            email=user_obj.email,
            avatar=user_obj.avatar,
            bio=user_obj.bio,
            is_following=is_following,
            followers_count=followers_count,
            following_count=following_count
        ))
    
    return followers

@router.get("/following/{user_id}", response_model=List[UserFollowInfo])
def get_following(
    user_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get users that a user is following"""
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get following with follow stats
    following_query = db.query(
        User,
        func.count(Follow.id).label('followers_count'),
        func.count(Follow.id).label('following_count')
    ).join(
        Follow, User.id == Follow.following_id
    ).filter(
        Follow.follower_id == user_id
    ).group_by(User.id)
    
    following = []
    for user_obj, followers_count, following_count in following_query.all():
        # Check if current user is following this user
        is_following = False
        if current_user:
            follow_check = db.query(Follow).filter(
                and_(
                    Follow.follower_id == current_user.id,
                    Follow.following_id == user_obj.id
                )
            ).first()
            is_following = follow_check is not None
        
        following.append(UserFollowInfo(
            id=user_obj.id,
            display_name=user_obj.display_name,
            email=user_obj.email,
            avatar=user_obj.avatar,
            bio=user_obj.bio,
            is_following=is_following,
            followers_count=followers_count,
            following_count=following_count
        ))
    
    return following

@router.get("/stats/{user_id}", response_model=FollowStats)
def get_follow_stats(
    user_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get follow statistics for a user"""
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get followers count
    followers_count = db.query(Follow).filter(Follow.following_id == user_id).count()
    
    # Get following count
    following_count = db.query(Follow).filter(Follow.follower_id == user_id).count()
    
    # Check if current user is following this user
    is_following = False
    if current_user:
        follow_check = db.query(Follow).filter(
            and_(
                Follow.follower_id == current_user.id,
                Follow.following_id == user_id
            )
        ).first()
        is_following = follow_check is not None
    
    return FollowStats(
        followers_count=followers_count,
        following_count=following_count,
        is_following=is_following
    )

@router.get("/users", response_model=List[UserFollowInfo])
def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all users with follow information"""
    users = db.query(User).filter(User.is_active == True).offset(skip).limit(limit).all()
    
    result = []
    for user in users:
        # Get follow stats
        followers_count = db.query(Follow).filter(Follow.following_id == user.id).count()
        following_count = db.query(Follow).filter(Follow.follower_id == user.id).count()
        
        # Check if current user is following this user
        is_following = False
        if current_user and current_user.id != user.id:
            follow_check = db.query(Follow).filter(
                and_(
                    Follow.follower_id == current_user.id,
                    Follow.following_id == user.id
                )
            ).first()
            is_following = follow_check is not None
        
        result.append(UserFollowInfo(
            id=user.id,
            display_name=user.display_name,
            email=user.email,
            avatar=user.avatar,
            bio=user.bio,
            is_following=is_following,
            followers_count=followers_count,
            following_count=following_count
        ))
    
    return result
