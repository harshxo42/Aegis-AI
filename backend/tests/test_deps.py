"""
Aegis AI – Dependencies Unit & Integration Tests
"""

import pytest
from unittest.mock import patch, AsyncMock
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select

from app.api.deps import (
    get_db,
    get_current_user,
    get_current_active_user,
    require_role,
)
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.core.security import create_access_token
from app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_get_db_yields_session():
    """Verify get_db generator yields a valid AsyncSession."""
    async for session in get_db():
        assert session is not None
        break


@pytest.mark.asyncio
async def test_get_current_user_missing_credentials(db_session):
    """Missing credentials raises UnauthorizedException."""
    with pytest.raises(UnauthorizedException) as exc_info:
        await get_current_user(credentials=None, db=db_session)
    assert "Authentication token is required" in exc_info.value.message


@pytest.mark.asyncio
async def test_get_current_user_invalid_token(db_session):
    """Invalid token raises UnauthorizedException."""
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid.token.payload")
    with pytest.raises(UnauthorizedException) as exc_info:
        await get_current_user(credentials=credentials, db=db_session)
    assert "Invalid or expired" in exc_info.value.message


@pytest.mark.asyncio
async def test_get_current_user_revoked_token(db_session):
    """Revoked token in Redis raises UnauthorizedException."""
    token = create_access_token("test-user-id", "patient")
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    with patch("app.core.redis.cache_get", new_callable=AsyncMock) as mock_cache:
        mock_cache.return_value = True
        with pytest.raises(UnauthorizedException) as exc_info:
            await get_current_user(credentials=credentials, db=db_session)
        assert "Token has been revoked" in exc_info.value.message


@pytest.mark.asyncio
async def test_get_current_user_missing_sub(db_session):
    """Token without 'sub' raises UnauthorizedException."""
    with patch("app.api.deps.verify_access_token") as mock_verify:
        mock_verify.return_value = {"role": "patient"}  # No 'sub'
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="some.token")
        with pytest.raises(UnauthorizedException) as exc_info:
            await get_current_user(credentials=credentials, db=db_session)
        assert "Invalid token payload" in exc_info.value.message


@pytest.mark.asyncio
async def test_get_current_user_not_found(db_session):
    """Token with valid sub but user not in DB raises UnauthorizedException."""
    token = create_access_token("nonexistent-user-999", "patient")
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    with pytest.raises(UnauthorizedException) as exc_info:
        await get_current_user(credentials=credentials, db=db_session)
    assert "User not found" in exc_info.value.message


@pytest.mark.asyncio
async def test_get_current_user_deactivated(db_session):
    """Deactivated user raises UnauthorizedException."""
    user = User(
        email="inactive@example.com",
        password_hash="hash",
        full_name="Inactive User",
        role=UserRole.PATIENT,
        is_active=False,
    )
    db_session.add(user)
    await db_session.flush()

    token = create_access_token(str(user.id), "patient")
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    with pytest.raises(UnauthorizedException) as exc_info:
        await get_current_user(credentials=credentials, db=db_session)
    assert "account is deactivated" in exc_info.value.message


@pytest.mark.asyncio
async def test_get_current_active_user_success(db_session):
    """Active user passes through get_current_active_user."""
    user = User(
        email="active@example.com",
        password_hash="hash",
        full_name="Active User",
        role=UserRole.PATIENT,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    res = await get_current_active_user(current_user=user)
    assert res.id == user.id


@pytest.mark.asyncio
async def test_get_current_active_user_inactive():
    """Inactive user passed to get_current_active_user raises UnauthorizedException."""
    user = User(
        email="inactive2@example.com",
        password_hash="hash",
        full_name="Inactive User 2",
        role=UserRole.PATIENT,
        is_active=False,
    )
    with pytest.raises(UnauthorizedException) as exc_info:
        await get_current_active_user(current_user=user)
    assert "account is inactive" in exc_info.value.message


@pytest.mark.asyncio
async def test_require_role_authorized():
    """User with required role succeeds."""
    user = User(
        email="admin@example.com",
        password_hash="hash",
        full_name="Admin User",
        role=UserRole.GOVERNMENT_ADMIN,
        is_active=True,
    )
    role_checker = require_role(["government_admin", "hospital_admin"])
    res = await role_checker(current_user=user)
    assert res.id == user.id


@pytest.mark.asyncio
async def test_require_role_forbidden():
    """User with unauthorized role raises ForbiddenException."""
    user = User(
        email="patient@example.com",
        password_hash="hash",
        full_name="Patient User",
        role=UserRole.PATIENT,
        is_active=True,
    )
    role_checker = require_role(["government_admin", "hospital_admin"])
    with pytest.raises(ForbiddenException) as exc_info:
        await role_checker(current_user=user)
    assert "requires one of the following roles" in exc_info.value.message.lower()
