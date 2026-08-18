"""
Aegis AI – API Dependencies

FastAPI dependency injection for authentication, authorization,
and database sessions.
"""

from typing import List, Optional, AsyncGenerator, Any

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.security import verify_access_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.models.user import User

# HTTP Bearer token security scheme
security = HTTPBearer(auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency: Provides an async database session.

    Usage:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async for session in get_async_session():
        yield session


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency: Extract and validate JWT token, return current user.

    Raises:
        UnauthorizedException: If token is missing, invalid, or user not found
    """
    if not credentials:
        raise UnauthorizedException("Authentication token is required")

    token = credentials.credentials
    payload = verify_access_token(token)

    if not payload:
        raise UnauthorizedException("Invalid or expired authentication token")

    # Check if token is blacklisted/revoked in Redis
    try:
        from app.core.redis import cache_get
        is_revoked = await cache_get(f"revoked_token:{token}")
        if is_revoked:
            raise UnauthorizedException("Token has been revoked")
    except UnauthorizedException:
        raise
    except Exception:
        pass

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token payload")

    # Fetch user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedException("User not found")

    if not user.is_active:
        raise UnauthorizedException("User account is deactivated")

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency: Ensures the current user is active."""
    if not current_user.is_active:
        raise UnauthorizedException("User account is inactive")
    return current_user


def require_role(allowed_roles: List[str]) -> Any:
    """
    Dependency factory: Creates a dependency that checks user role.

    Usage:
        @router.get("/admin")
        async def admin_endpoint(
            user: User = Depends(require_role(["hospital_admin", "government_admin"]))
        ):
            ...
    """
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role.value not in allowed_roles:
            raise ForbiddenException(
                f"This action requires one of the following roles: {', '.join(allowed_roles)}"
            )
        return current_user

    return role_checker


# Pre-built role dependencies for convenience
require_patient = require_role(["patient"])
require_doctor = require_role(["doctor"])
require_ambulance_driver = require_role(["ambulance_driver"])
require_hospital_admin = require_role(["hospital_admin"])
require_government_admin = require_role(["government_admin"])
require_any_admin = require_role(["hospital_admin", "government_admin"])
require_medical_staff = require_role(["doctor", "hospital_admin"])
require_responder = require_role(["ambulance_driver", "doctor", "hospital_admin", "government_admin"])
