from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MovieBase(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    release_year: Optional[int] = None

    class Config:
        orm_mode = True

class ListItemOut(BaseModel):
    id: int
    movie: MovieBase
    kind: str
    created_at: datetime

    class Config:
        orm_mode = True

class UserPanel(BaseModel):
    id: int
    display_name: str
    email: str
    watchlist: List[ListItemOut] = []
    favorites: List[ListItemOut] = []
    watched: List[ListItemOut] = []

    class Config:
        orm_mode = True
