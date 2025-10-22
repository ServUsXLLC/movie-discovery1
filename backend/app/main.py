from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, SessionLocal

# Import routers
from app.routers import auth, tmdb_proxy
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.reviews import router as reviews_router
from app.routers.lists import router as lists_router
from app.routers.migration import router as migration_router
from app.routers.users import router as users_router
from app.routers.movies import router as movies_router

# ------------------------------------------------------
# Initialize FastAPI app
# ------------------------------------------------------
app = FastAPI(
    title="🎬 Movie Discovery API",
    version="1.0.0",
    description="Backend service for movie discovery and user reviews.",
)

# ------------------------------------------------------
# Middleware (CORS)
# ------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------
# Database setup
# ------------------------------------------------------
Base.metadata.create_all(bind=engine)


def get_db_session():
    """Provide a clean database session for dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ------------------------------------------------------
# Routers registration
# ------------------------------------------------------
app.include_router(admin_router, prefix="/api", tags=["Admin"])
app.include_router(auth_router, prefix="/api", tags=["Auth"])
app.include_router(users_router, prefix="/api", tags=["Users"])
app.include_router(reviews_router, prefix="/api", tags=["Reviews"])
app.include_router(lists_router, prefix="/api", tags=["Lists"])
app.include_router(migration_router, prefix="/api", tags=["Migration"])
app.include_router(movies_router, prefix="/api", tags=["Movies"])

# ✅ Add the TMDB proxy router
app.include_router(tmdb_proxy.router, prefix="/api", tags=["TMDB"])

# ------------------------------------------------------
# Root endpoint
# ------------------------------------------------------
@app.get("/", tags=["Root"])
def root():
    return {"message": "🎥 Movie Discovery API is running 🚀"}
