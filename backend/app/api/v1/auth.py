"""
Aegis AI – Auth API Routes

Authentication endpoints: register, login, refresh, me, change password.
"""

from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    RefreshTokenRequest,
    ChangePasswordRequest,
)
from app.schemas.user import UserResponse
from app.schemas.common import SuccessResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    response_description="User created successfully with JWT tokens",
)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Register a new user with role selection.

    - **email**: Valid email address (must be unique)
    - **password**: Min 8 chars, must include uppercase, lowercase, and digit
    - **full_name**: User's full name
    - **role**: One of patient, doctor, ambulance_driver, hospital_admin, government_admin
    """
    service = AuthService(db)
    result = await service.register(data)
    response = SuccessResponse(
        message="Account created successfully",
        data=result,
    )
    return response


@router.post(
    "/login",
    summary="Login with email and password",
    response_description="Authentication tokens",
)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Authenticate with email and password.

    Returns JWT access token and refresh token.
    """
    service = AuthService(db)
    result = await service.login(data)
    response = SuccessResponse(
        message="Login successful",
        data=result,
    )
    return response


@router.post(
    "/refresh",
    summary="Refresh access token",
    response_description="New authentication tokens",
)
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Obtain a new access token using a valid refresh token.

    Use this when the access token expires to get new tokens
    without requiring the user to log in again.
    """
    service = AuthService(db)
    tokens = await service.refresh_tokens(data.refresh_token)
    response = SuccessResponse(
        message="Token refreshed successfully",
        data=tokens.model_dump(),
    )
    return response


@router.get(
    "/me",
    response_model=SuccessResponse,
    summary="Get current user profile",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get the authenticated user's profile information.

    Requires a valid Bearer token in the Authorization header.
    """
    user_data = UserResponse.model_validate(current_user)
    return SuccessResponse(
        message="User profile retrieved",
        data=user_data.model_dump(),
    )


@router.put(
    "/change-password",
    summary="Change user password",
)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Change the authenticated user's password.

    Requires the current password for verification.
    """
    service = AuthService(db)
    await service.change_password(
        current_user, data.current_password, data.new_password
    )
    return SuccessResponse(message="Password changed successfully")


@router.post(
    "/logout",
    summary="Logout user",
)
async def logout(
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Logout the current user.

    Note: JWT tokens are stateless, so this endpoint serves as
    a confirmation. Client should discard stored tokens.
    In production, implement token blacklisting with Redis.
    """
    return SuccessResponse(message="Logged out successfully")
