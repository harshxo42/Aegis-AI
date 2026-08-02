"""
Aegis AI – Custom Exception Classes & Global Exception Handlers

Provides structured error responses for the API.
"""

from typing import Any, Optional
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


# ── Custom Exceptions ────────────────────────────────────────────

class AegisException(Exception):
    """Base exception for all Aegis AI errors."""

    def __init__(
        self,
        message: str = "An unexpected error occurred",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Any] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


class NotFoundException(AegisException):
    """Resource not found (404)."""

    def __init__(self, resource: str = "Resource", resource_id: str = ""):
        message = f"{resource} not found"
        if resource_id:
            message = f"{resource} with id '{resource_id}' not found"
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
        )


class UnauthorizedException(AegisException):
    """Authentication failed (401)."""

    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class ForbiddenException(AegisException):
    """Insufficient permissions (403)."""

    def __init__(self, message: str = "You don't have permission to perform this action"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
        )


class BadRequestException(AegisException):
    """Invalid request data (400)."""

    def __init__(self, message: str = "Bad request", details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class ConflictException(AegisException):
    """Resource conflict (409)."""

    def __init__(self, message: str = "Resource already exists"):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
        )


class RateLimitException(AegisException):
    """Rate limit exceeded (429)."""

    def __init__(self, message: str = "Too many requests. Please try again later."):
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )


# ── Global Exception Handlers ───────────────────────────────────

async def aegis_exception_handler(request: Request, exc: AegisException) -> JSONResponse:
    """Handle all custom Aegis exceptions with a consistent JSON response."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "details": exc.details,
            "error_code": exc.__class__.__name__,
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTPException with consistent formatting."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "details": None,
            "error_code": "HTTPException",
        },
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors with detailed field information."""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " → ".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation error",
            "details": errors,
            "error_code": "ValidationError",
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler for unhandled exceptions."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal server error",
            "details": str(exc) if True else None,  # Show details in debug mode
            "error_code": "InternalError",
        },
    )
