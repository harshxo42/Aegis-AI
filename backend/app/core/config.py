"""
Aegis AI – Core Configuration Module

Centralizes all environment-based configuration using Pydantic Settings.
Supports .env files for local development and environment variables for production.
"""

from typing import Optional, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "Aegis AI"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Intelligent Emergency Response & Disaster Management Platform"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development | staging | production

    # ── Server ───────────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://aegis-ai-ruddy.vercel.app",
    ]

    # ── Database ─────────────────────────────────────────────────
    # PostgreSQL for production/enterprise deployment
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/aegis_ai"
    DATABASE_ECHO: bool = False

    # ── Redis ────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── MongoDB ──────────────────────────────────────────────────
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "aegis_ai_ml"

    # ── JWT Authentication ───────────────────────────────────────
    JWT_SECRET_KEY: str = "aegis-ai-super-secret-key-change-in-production-2024"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── External APIs ────────────────────────────────────────────
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_MAPS_API_KEY: Optional[str] = None

    # ── File Upload ──────────────────────────────────────────────
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # ── ML Service ───────────────────────────────────────────────
    ML_SERVICE_URL: str = "http://localhost:8001"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> Any:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @property
    def async_database_url(self) -> str:
        """Return the async-compatible database URL."""
        if self.DATABASE_URL.startswith("postgresql://"):
            return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self.DATABASE_URL


# Global settings singleton
settings = Settings()
