from pydantic import BaseModel
from typing import Optional

class MovieBase(BaseModel):
    title: str
    description: Optional[str] = None
    year: int

class MovieCreate(MovieBase):
    pass

class Movie(MovieBase):
    id: int

    class Config:
        orm_mode = True
