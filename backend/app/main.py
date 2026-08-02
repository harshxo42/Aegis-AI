"""
Aegis AI – FastAPI Application Entry Point

Main application factory with middleware, exception handlers,
and API router registration.
"""

from typing import Any

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db, close_db
from app.core.exceptions import (
    AegisException,
    aegis_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler,
)

# Import API routers
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.patients import router as patients_router
from app.api.v1.hospitals import router as hospitals_router
from app.api.v1.emergencies import router as emergencies_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.ai import router as ai_router
from app.api.v1.websockets import router as websockets_router


from app.core.redis import init_redis, close_redis

@asynccontextmanager
async def lifespan(app: FastAPI) -> Any:
    """
    Application lifespan handler.

    Runs startup and shutdown logic:
    - Creates database tables on startup
    - Closes database connections on shutdown
    - Initializes Redis connection pool
    """
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Database: {settings.DATABASE_URL.split('://')[0]}")

    # Initialize database
    await init_db()
    print("Database initialized")

    # Initialize Redis
    await init_redis()
    print("Redis pool initialized")

    yield

    # Cleanup
    await close_redis()
    await close_db()
    print("Application shutdown complete")


# ── Create FastAPI Application ───────────────────────────────────

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from loguru import logger
from prometheus_fastapi_instrumentator import Instrumentator

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── Setup SlowAPI Rate Limiting ──────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Setup Prometheus Metrics ─────────────────────────────────────
Instrumentator().instrument(app).expose(app)

# ── Middleware ───────────────────────────────────────────────────

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Exception Handlers ──────────────────────────────────────────

app.add_exception_handler(AegisException, aegis_exception_handler)  # type: ignore
app.add_exception_handler(HTTPException, http_exception_handler)  # type: ignore
app.add_exception_handler(RequestValidationError, validation_exception_handler)  # type: ignore
app.add_exception_handler(Exception, unhandled_exception_handler)


# ── Register API Routers ────────────────────────────────────────

API_V1_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_V1_PREFIX)
app.include_router(users_router, prefix=API_V1_PREFIX)
app.include_router(patients_router, prefix=API_V1_PREFIX)
app.include_router(hospitals_router, prefix=API_V1_PREFIX)
app.include_router(emergencies_router, prefix=API_V1_PREFIX)
app.include_router(analytics_router, prefix=API_V1_PREFIX)
app.include_router(ai_router, prefix=API_V1_PREFIX)
app.include_router(websockets_router)  # Handles both /ws and /api/v1/notifications


# ── Health Check ─────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def root() -> Any:
    """Root endpoint – redirects to API docs."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check() -> Any:
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/v1/health", tags=["Health"])
async def api_health() -> Any:
    """API v1 health check."""
    return {
        "status": "healthy",
        "api_version": "v1",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
