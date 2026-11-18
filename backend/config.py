import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql://admin:your_secret_password@localhost:5432/parivartan_db"
    JWT_SECRET: str = "super_secret_jwt_signing_key_replace_me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    ENCRYPTION_SECRET_KEY: str = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    GOOGLE_CLIENT_ID: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
