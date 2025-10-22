from fastapi import APIRouter

router = APIRouter()

@router.get("/movies")
async def get_movies():
    return {"message": "List of movies"}
