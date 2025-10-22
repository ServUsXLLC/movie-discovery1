from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


# 🔍 Explicitly point to backend/.env
BASE_DIR = Path(__file__).resolve().parent.parent  # points to /backend
ENV_PATH = BASE_DIR / ".env"

class Settings(BaseSettings):
    APP_NAME: str = "Movie Discovery API"
    DATABASE_URL: str = "postgresql://raheel:@localhost:5432/moviedb"

    # JWT and auth
    JWT_SECRET: str = "bNwBacnmUEo4gF4MMr5pxtco8c1bnNlByUzZ6i4tuPok7Lvgw9hFFPOtNfQA3CklQp1it32wST1GtdD4ZRKcdg"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Email + frontend
    EMAIL_FROM: str | None = None
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    FRONTEND_URL: str | None = None

    # ✅ TMDB API key (the missing piece)
    TMDB_API_KEY: str | None = None

    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH),
        extra="allow"
    )

settings = Settings()
