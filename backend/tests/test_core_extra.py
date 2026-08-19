"""
Aegis AI – Database, Models & Schema Validation Tests
"""

import pytest
from unittest.mock import patch, AsyncMock
from pydantic import ValidationError

from app.core.database import Base, get_async_session, init_db, close_db
from app.models.user import User, UserRole
from app.schemas.auth import (
    RegisterRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
)


def test_base_model_to_dict(db_session):
    """Test Base.to_dict() method on an ORM instance."""
    user = User(
        email="dict-test@example.com",
        password_hash="hash",
        full_name="Dict Test",
        role=UserRole.PATIENT,
    )
    data = user.to_dict()
    assert "email" in data
    assert data["email"] == "dict-test@example.com"
    assert "role" in data


@pytest.mark.asyncio
async def test_get_async_session_rollback():
    """Test get_async_session rolls back on exception."""
    with patch("app.core.database.async_session_factory") as mock_factory:
        mock_session = AsyncMock()
        mock_factory.return_value.__aenter__.return_value = mock_session

        gen = get_async_session()
        session = await anext(gen)
        assert session == mock_session

        with pytest.raises(RuntimeError):
            await gen.athrow(RuntimeError("DB operation failed"))

        mock_session.rollback.assert_awaited_once()
        mock_session.close.assert_awaited_once()


@pytest.mark.asyncio
async def test_init_db_and_close_db():
    """Test init_db and close_db lifecycle functions."""
    with patch("app.core.database.engine") as mock_engine:
        mock_conn = AsyncMock()
        mock_engine.begin.return_value.__aenter__.return_value = mock_conn
        mock_engine.dispose = AsyncMock()
        await init_db()
        assert mock_conn.run_sync.call_count == 1
        await close_db()
        assert mock_engine.dispose.call_count == 1


def test_user_register_password_complexity():
    """Test password complexity validation branches in RegisterRequest schema."""
    # Missing uppercase
    with pytest.raises(ValidationError) as exc1:
        RegisterRequest(
            email="test@example.com",
            password="lowercase123!",
            confirm_password="lowercase123!",
            full_name="Test User",
        )
    assert "uppercase" in str(exc1.value).lower()

    # Missing lowercase
    with pytest.raises(ValidationError) as exc2:
        RegisterRequest(
            email="test@example.com",
            password="UPPERCASE123!",
            confirm_password="UPPERCASE123!",
            full_name="Test User",
        )
    assert "lowercase" in str(exc2.value).lower()

    # Missing digit
    with pytest.raises(ValidationError) as exc3:
        RegisterRequest(
            email="test@example.com",
            password="UppercaseOnly!",
            confirm_password="UppercaseOnly!",
            full_name="Test User",
        )
    assert "digit" in str(exc3.value).lower()


def test_reset_and_change_password_mismatch():
    """Test confirm_password mismatch in ResetPasswordRequest and ChangePasswordRequest."""
    with pytest.raises(ValidationError) as exc1:
        ResetPasswordRequest(
            token="valid-token",
            new_password="Password123!",
            confirm_password="DifferentPassword123!",
        )
    assert "passwords do not match" in str(exc1.value).lower()

    with pytest.raises(ValidationError) as exc2:
        ChangePasswordRequest(
            current_password="OldPassword123!",
            new_password="Password123!",
            confirm_password="DifferentPassword123!",
        )
    assert "passwords do not match" in str(exc2.value).lower()
