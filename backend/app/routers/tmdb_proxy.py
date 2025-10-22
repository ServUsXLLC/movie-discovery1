# app/routers/tmdb_proxy.py
from fastapi import APIRouter, HTTPException
from app.config import settings
import httpx

router = APIRouter(tags=["TMDB Proxy"])

TMDB_BASE = "https://api.themoviedb.org/3"

def get_tmdb_key():
    """
    Safely get TMDB API key from settings.
    """
    key = getattr(settings, "TMDB_API_KEY", None)
    if not key:
        raise HTTPException(status_code=500, detail="TMDB API key not configured")
    return key

async def fetch_tmdb(path: str, params: dict = None):
    """
    Fetch data from TMDB API using httpx.AsyncClient
    """
    params = params or {}
    params["api_key"] = get_tmdb_key()
    url = f"{TMDB_BASE}{path}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return resp.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"TMDB request failed: {str(e)}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"TMDB error: {e.response.text}")

# -------------------------
# Routes
# -------------------------

@router.get("/tmdb/movie/popular")
async def tmdb_popular(page: int = 1):
    """
    Get popular movies from TMDB
    """
    return await fetch_tmdb("/movie/popular", {"page": page})

@router.get("/tmdb/movie/{movie_id}")
async def tmdb_movie_details(movie_id: int):
    """
    Get details for a specific movie
    """
    return await fetch_tmdb(f"/movie/{movie_id}", {"append_to_response": "videos,credits,recommendations"})

@router.get("/tmdb/search")
async def tmdb_search(query: str, page: int = 1):
    """
    Search movies by query
    """
    return await fetch_tmdb("/search/movie", {"query": query, "page": page, "include_adult": "false"})
