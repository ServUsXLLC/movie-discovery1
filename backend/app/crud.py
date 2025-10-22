from sqlalchemy.orm import Session
from app.models.user import User, ListItem

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_panel(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)
    if not user:
        return None

    panel = {
        "id": user.id,
        "display_name": user.display_name,
        "email": user.email,
        "watchlist": [item for item in user.list_items if item.kind == "watchlist"],
        "favorites": [item for item in user.list_items if item.kind == "favorites"],
        "watched": [item for item in user.list_items if item.kind == "watched"],
    }
    return panel
