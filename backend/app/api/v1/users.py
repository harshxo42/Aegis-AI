"""
Aegis AI – Users API Routes

User management endpoints for admin operations.
"""

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, require_any_admin
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserListResponse, UserUpdate, UserStats
from app.schemas.common import SuccessResponse, PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/",
    summary="List all users (admin only)",
)
async def list_users(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    search: str = Query(default=None),
    role: str = Query(default=None),
    is_active: bool = Query(default=None),
    current_user: User = Depends(require_any_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """List all users with pagination, search, and filtering. Admin only."""
    query = select(User)

    # Apply filters
    if search:
        query = query.where(
            (User.full_name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )
    if role:
        query = query.where(User.role == UserRole(role))
    if is_active is not None:
        query = query.where(User.is_active == is_active)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    query = query.order_by(User.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    users = result.scalars().all()

    total_pages = (total + per_page - 1) // per_page

    return PaginatedResponse(
        data=[UserListResponse.model_validate(u).model_dump() for u in users],
        pagination=PaginationMeta(
            page=page,
            per_page=per_page,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        ),
    )


@router.get(
    "/stats",
    summary="Get user statistics (admin only)",
)
async def get_user_stats(
    current_user: User = Depends(require_any_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get aggregate user statistics for dashboards."""
    # Total users
    total_result = await db.execute(select(func.count(User.id)))
    total = total_result.scalar() or 0

    # Active users
    active_result = await db.execute(
        select(func.count(User.id)).where(User.is_active)
    )
    active = active_result.scalar() or 0

    # Count by role
    stats = UserStats(total_users=total, active_users=active)

    for role in UserRole:
        role_result = await db.execute(
            select(func.count(User.id)).where(User.role == role)
        )
        count = role_result.scalar() or 0
        if role == UserRole.PATIENT:
            stats.patients = count
        elif role == UserRole.DOCTOR:
            stats.doctors = count
        elif role == UserRole.AMBULANCE_DRIVER:
            stats.ambulance_drivers = count
        elif role == UserRole.HOSPITAL_ADMIN:
            stats.hospital_admins = count
        elif role == UserRole.GOVERNMENT_ADMIN:
            stats.government_admins = count

    return SuccessResponse(
        message="User statistics retrieved",
        data=stats.model_dump(),
    )


@router.get(
    "/{user_id}",
    summary="Get user by ID",
)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get a user's profile by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("User", user_id)

    return SuccessResponse(
        data=UserResponse.model_validate(user).model_dump(),
    )


@router.put(
    "/me",
    summary="Update current user profile",
)
async def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update the authenticated user's profile."""
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.flush()

    return SuccessResponse(
        message="Profile updated successfully",
        data=UserResponse.model_validate(current_user).model_dump(),
    )


@router.put(
    "/{user_id}/toggle-active",
    summary="Activate/deactivate user (admin only)",
)
async def toggle_user_active(
    user_id: str,
    current_user: User = Depends(require_any_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Toggle a user's active status. Admin only."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("User", user_id)

    user.is_active = not user.is_active
    await db.flush()

    status_text = "activated" if user.is_active else "deactivated"
    return SuccessResponse(
        message=f"User {status_text} successfully",
        data={"is_active": user.is_active},
    )
