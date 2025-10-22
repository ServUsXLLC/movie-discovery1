from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Movie Discovery API"
   DATABASE_URL = "postgresql://raheel:@localhost:5432/moviedb"
    SECRET_KEY: str = "your_secret_key_here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"  # load environment variables from .env if available

settings = Settings()
