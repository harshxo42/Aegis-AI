"""
Aegis AI - Users API Tests

Comprehensive tests for user management endpoints.
"""

import pytest

from app.api.v1.users import (
    list_users,
    get_user_stats,
    get_user,
    update_profile,
    toggle_user_active,
)
from app.core.exceptions import NotFoundException
from app.models.user import User, UserRole
from app.schemas.user import UserUpdate


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def create_user(
    db_session,
    email="user@example.com",
    full_name="Test User",
    role=UserRole.PATIENT,
    is_active=True,
):
    """Create a test user."""
    user = User(
        email=email,
        password_hash="hashed-password",
        full_name=full_name,
        role=role,
        is_active=is_active,
        is_verified=True,
    )

    db_session.add(user)
    await db_session.flush()

    return user


async def create_admin(
    db_session,
    email="admin@example.com",
    role=UserRole.GOVERNMENT_ADMIN,
):
    """Create an admin user."""
    return await create_user(
        db_session,
        email=email,
        full_name="Admin User",
        role=role,
        is_active=True,
    )


# ---------------------------------------------------------------------------
# list_users
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_users_success(db_session):
    """Admin can list users."""
    admin = await create_admin(db_session)

    await create_user(
        db_session,
        email="patient1@example.com",
        full_name="Patient One",
        role=UserRole.PATIENT,
    )

    await create_user(
        db_session,
        email="doctor1@example.com",
        full_name="Doctor One",
        role=UserRole.DOCTOR,
    )

    response = await list_users(
        page=1,
        per_page=20,
        search=None,
        role=None,
        is_active=None,
        current_user=admin,
        db=db_session,
    )

    assert response is not None
    assert response.data is not None
    assert response.pagination.total >= 3
    assert response.pagination.page == 1


@pytest.mark.asyncio
async def test_list_users_pagination(db_session):
    """User listing supports pagination."""
    admin = await create_admin(db_session)

    for i in range(5):
        await create_user(
            db_session,
            email=f"patient{i}@example.com",
            full_name=f"Patient {i}",
            role=UserRole.PATIENT,
        )

    response = await list_users(
        page=1,
        per_page=2,
        search=None,
        role=None,
        is_active=None,
        current_user=admin,
        db=db_session,
    )

    assert response.pagination.per_page == 2
    assert len(response.data) == 2
    assert response.pagination.has_next is True


@pytest.mark.asyncio
async def test_list_users_search_by_name(db_session):
    """User search works by full name."""
    admin = await create_admin(db_session)

    await create_user(
        db_session,
        email="rahul@example.com",
        full_name="Rahul Sharma",
    )

    await create_user(
        db_session,
        email="amit@example.com",
        full_name="Amit Kumar",
    )

    response = await list_users(
        page=1,
        per_page=20,
        search="Rahul",
        role=None,
        is_active=None,
        current_user=admin,
        db=db_session,
    )

    assert response.pagination.total == 1
    assert response.data[0]["full_name"] == "Rahul Sharma"


@pytest.mark.asyncio
async def test_list_users_search_by_email(db_session):
    """User search works by email."""
    admin = await create_admin(db_session)

    await create_user(
        db_session,
        email="special@example.com",
        full_name="Special User",
    )

    response = await list_users(
        page=1,
        per_page=20,
        search="special@example.com",
        role=None,
        is_active=None,
        current_user=admin,
        db=db_session,
    )

    assert response.pagination.total == 1
    assert response.data[0]["email"] == "special@example.com"


@pytest.mark.asyncio
async def test_list_users_filter_by_role(db_session):
    """User listing supports role filtering."""
    admin = await create_admin(db_session)

    await create_user(
        db_session,
        email="doctor@example.com",
        full_name="Doctor",
        role=UserRole.DOCTOR,
    )

    await create_user(
        db_session,
        email="patient@example.com",
        full_name="Patient",
        role=UserRole.PATIENT,
    )

    response = await list_users(
        page=1,
        per_page=20,
        search=None,
        role=UserRole.DOCTOR.value,
        is_active=None,
        current_user=admin,
        db=db_session,
    )

    assert response.pagination.total == 1
    assert response.data[0]["role"] == UserRole.DOCTOR.value


@pytest.mark.asyncio
async def test_list_users_filter_active(db_session):
    """User listing supports active status filtering."""
    admin = await create_admin(db_session)

    await create_user(
        db_session,
        email="active@example.com",
        full_name="Active User",
        is_active=True,
    )

    await create_user(
        db_session,
        email="inactive@example.com",
        full_name="Inactive User",
        is_active=False,
    )

    response = await list_users(
        page=1,
        per_page=20,
        search=None,
        role=None,
        is_active=True,
        current_user=admin,
        db=db_session,
    )

    assert response.pagination.total == 2
    assert all(user["is_active"] is True for user in response.data)


# ---------------------------------------------------------------------------
# get_user_stats
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_user_stats(db_session):
    """Admin can retrieve user statistics."""
    admin = await create_admin(db_session)

    await create_user(
        db_session,
        email="patient@example.com",
        role=UserRole.PATIENT,
    )

    await create_user(
        db_session,
        email="doctor@example.com",
        role=UserRole.DOCTOR,
    )

    await create_user(
        db_session,
        email="driver@example.com",
        role=UserRole.AMBULANCE_DRIVER,
    )

    response = await get_user_stats(
        current_user=admin,
        db=db_session,
    )

    assert response is not None
    assert response.data["total_users"] >= 4
    assert response.data["active_users"] >= 4
    assert response.data["patients"] >= 1
    assert response.data["doctors"] >= 1
    assert response.data["ambulance_drivers"] >= 1


@pytest.mark.asyncio
async def test_get_user_stats_all_roles(db_session):
    """Statistics correctly count supported roles."""
    admin = await create_admin(db_session)

    await create_user(
        db_session,
        email="patient@example.com",
        role=UserRole.PATIENT,
    )

    await create_user(
        db_session,
        email="doctor@example.com",
        role=UserRole.DOCTOR,
    )

    await create_user(
        db_session,
        email="driver@example.com",
        role=UserRole.AMBULANCE_DRIVER,
    )

    await create_user(
        db_session,
        email="hospitaladmin@example.com",
        role=UserRole.HOSPITAL_ADMIN,
    )

    await create_user(
        db_session,
        email="govadmin@example.com",
        role=UserRole.GOVERNMENT_ADMIN,
    )

    response = await get_user_stats(
        current_user=admin,
        db=db_session,
    )

    assert response.data["patients"] >= 1
    assert response.data["doctors"] >= 1
    assert response.data["ambulance_drivers"] >= 1
    assert response.data["hospital_admins"] >= 1
    assert response.data["government_admins"] >= 1


# ---------------------------------------------------------------------------
# get_user
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_user_success(db_session):
    """Authenticated user can retrieve a user profile."""
    current_user = await create_user(
        db_session,
        email="profile@example.com",
        full_name="Profile User",
    )

    response = await get_user(
        user_id=current_user.id,
        current_user=current_user,
        db=db_session,
    )

    assert response is not None
    assert response.data["id"] == current_user.id
    assert response.data["email"] == "profile@example.com"
    assert response.data["full_name"] == "Profile User"


@pytest.mark.asyncio
async def test_get_user_not_found(db_session):
    """Getting a missing user raises NotFoundException."""
    current_user = await create_user(
        db_session,
        email="current@example.com",
    )

    with pytest.raises(NotFoundException):
        await get_user(
            user_id="non-existent-user-id",
            current_user=current_user,
            db=db_session,
        )


# ---------------------------------------------------------------------------
# update_profile
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_profile_success(db_session):
    """Authenticated user can update their profile."""
    current_user = await create_user(
        db_session,
        email="update@example.com",
        full_name="Old Name",
    )

    data = UserUpdate(
        full_name="Updated Name",
        phone="9876543210",
        bio="Updated bio",
    )

    response = await update_profile(
        data=data,
        current_user=current_user,
        db=db_session,
    )

    assert response is not None
    assert response.data["full_name"] == "Updated Name"
    assert response.data["phone"] == "9876543210"
    assert response.data["bio"] == "Updated bio"

    assert current_user.full_name == "Updated Name"
    assert current_user.phone == "9876543210"
    assert current_user.bio == "Updated bio"


@pytest.mark.asyncio
async def test_update_profile_partial_update(db_session):
    """Profile update supports partial updates."""
    current_user = await create_user(
        db_session,
        email="partial@example.com",
        full_name="Original Name",
    )

    current_user.phone = "1111111111"
    current_user.bio = "Original bio"
    await db_session.flush()

    data = UserUpdate(
        full_name="New Name",
    )

    response = await update_profile(
        data=data,
        current_user=current_user,
        db=db_session,
    )

    assert response.data["full_name"] == "New Name"
    assert response.data["phone"] == "1111111111"
    assert response.data["bio"] == "Original bio"


@pytest.mark.asyncio
async def test_update_profile_avatar(db_session):
    """User can update avatar URL."""
    current_user = await create_user(
        db_session,
        email="avatar@example.com",
    )

    data = UserUpdate(
        avatar_url="https://example.com/avatar.jpg",
    )

    response = await update_profile(
        data=data,
        current_user=current_user,
        db=db_session,
    )

    assert response.data["avatar_url"] == "https://example.com/avatar.jpg"


# ---------------------------------------------------------------------------
# toggle_user_active
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_toggle_user_active_deactivate(db_session):
    """Admin can deactivate an active user."""
    admin = await create_admin(db_session)

    user = await create_user(
        db_session,
        email="active-user@example.com",
        is_active=True,
    )

    response = await toggle_user_active(
        user_id=user.id,
        current_user=admin,
        db=db_session,
    )

    assert response.data["is_active"] is False
    assert user.is_active is False
    assert "deactivated" in response.message.lower()


@pytest.mark.asyncio
async def test_toggle_user_active_activate(db_session):
    """Admin can activate an inactive user."""
    admin = await create_admin(db_session)

    user = await create_user(
        db_session,
        email="inactive-user@example.com",
        is_active=False,
    )

    response = await toggle_user_active(
        user_id=user.id,
        current_user=admin,
        db=db_session,
    )

    assert response.data["is_active"] is True
    assert user.is_active is True
    assert "activated" in response.message.lower()


@pytest.mark.asyncio
async def test_toggle_user_active_not_found(db_session):
    """Toggling a missing user raises NotFoundException."""
    admin = await create_admin(db_session)

    with pytest.raises(NotFoundException):
        await toggle_user_active(
            user_id="non-existent-user-id",
            current_user=admin,
            db=db_session,
        )


@pytest.mark.asyncio
async def test_get_user_stats_government_admin_only(db_session):
    """Admin can retrieve user statistics focusing on government admins."""
    admin = await create_admin(db_session)
    # The create_admin helper creates a UserRole.GOVERNMENT_ADMIN by default.
    # We just need to check if government_admins is populated correctly.

    response = await get_user_stats(
        current_user=admin,
        db=db_session,
    )

    assert response is not None
    assert response.data["government_admins"] >= 1