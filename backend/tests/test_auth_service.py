import pytest

from app.core.exceptions import (
    BadRequestException,
    UnauthorizedException,
)
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.auth_service import AuthService


@pytest.mark.asyncio
async def test_register_non_patient(client, db_session):
    service = AuthService(db_session)

    data = RegisterRequest(
        email="doctor_service@example.com",
        password="StrongPass123",
        confirm_password="StrongPass123",
        full_name="Doctor Service",
        role="doctor",
    )

    result = await service.register(data)

    assert result["user"]["email"] == "doctor_service@example.com"
    assert result["user"]["role"] == "doctor"
    assert result["tokens"].access_token
    assert result["tokens"].refresh_token


@pytest.mark.asyncio
async def test_register_duplicate_email(db_session):
    service = AuthService(db_session)

    data = RegisterRequest(
        email="duplicate_service@example.com",
        password="StrongPass123",
        confirm_password="StrongPass123",
        full_name="Duplicate User",
        role="patient",
    )

    await service.register(data)
    await db_session.commit()

    with pytest.raises(Exception):
        await service.register(data)


@pytest.mark.asyncio
async def test_login_inactive_user(db_session):
    service = AuthService(db_session)

    user = User(
        email="inactive_service@example.com",
        password_hash="",
        full_name="Inactive User",
        role=UserRole.PATIENT,
        is_active=False,
        is_verified=False,
    )

    from app.core.security import hash_password

    user.password_hash = hash_password("StrongPass123")
    db_session.add(user)
    await db_session.commit()

    data = LoginRequest(
        email="inactive_service@example.com",
        password="StrongPass123",
    )

    with pytest.raises(UnauthorizedException):
        await service.login(data)


@pytest.mark.asyncio
async def test_refresh_tokens_invalid_token(db_session):
    service = AuthService(db_session)

    with pytest.raises(UnauthorizedException):
        await service.refresh_tokens("invalid-refresh-token")


@pytest.mark.asyncio
async def test_refresh_tokens_user_not_found(db_session):
    service = AuthService(db_session)

    from app.core.security import create_refresh_token

    fake_user_id = "non-existing-user-id"
    refresh_token = create_refresh_token(fake_user_id)

    with pytest.raises(UnauthorizedException):
        await service.refresh_tokens(refresh_token)


@pytest.mark.asyncio
async def test_change_password_wrong_current_password(db_session):
    service = AuthService(db_session)

    from app.core.security import hash_password

    user = User(
        email="password_service@example.com",
        password_hash=hash_password("CorrectPass123"),
        full_name="Password User",
        role=UserRole.PATIENT,
        is_active=True,
        is_verified=False,
    )

    with pytest.raises(BadRequestException):
        await service.change_password(
            user,
            "WrongPassword123",
            "NewStrongPass123",
        )


@pytest.mark.asyncio
async def test_change_password_success(db_session):
    service = AuthService(db_session)

    from app.core.security import hash_password, verify_password

    user = User(
        email="change_service@example.com",
        password_hash=hash_password("OldPass123"),
        full_name="Change Password",
        role=UserRole.PATIENT,
        is_active=True,
        is_verified=False,
    )

    result = await service.change_password(
        user,
        "OldPass123",
        "NewStrongPass123",
    )

    assert result is True
    assert verify_password("NewStrongPass123", user.password_hash)


@pytest.mark.asyncio
async def test_get_user_by_id(db_session):
    service = AuthService(db_session)

    from app.core.security import hash_password

    user = User(
        email="lookup_id@example.com",
        password_hash=hash_password("StrongPass123"),
        full_name="Lookup ID",
        role=UserRole.PATIENT,
        is_active=True,
        is_verified=False,
    )

    db_session.add(user)
    await db_session.commit()

    found = await service.get_user_by_id(user.id)

    assert found is not None
    assert found.email == "lookup_id@example.com"


@pytest.mark.asyncio
async def test_get_user_by_id_not_found(db_session):
    service = AuthService(db_session)

    result = await service.get_user_by_id("does-not-exist")

    assert result is None


@pytest.mark.asyncio
async def test_get_user_by_email(db_session):
    service = AuthService(db_session)

    from app.core.security import hash_password

    user = User(
        email="lookup_email@example.com",
        password_hash=hash_password("StrongPass123"),
        full_name="Lookup Email",
        role=UserRole.PATIENT,
        is_active=True,
        is_verified=False,
    )

    db_session.add(user)
    await db_session.commit()

    found = await service.get_user_by_email(
        "lookup_email@example.com"
    )

    assert found is not None
    assert found.id == user.id


@pytest.mark.asyncio
async def test_get_user_by_email_not_found(db_session):
    service = AuthService(db_session)

    result = await service.get_user_by_email(
        "missing@example.com"
    )

    assert result is None
