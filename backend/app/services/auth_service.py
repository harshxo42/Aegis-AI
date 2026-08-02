"""
Aegis AI – Authentication Service

Business logic for user registration, login, token management.
"""

from datetime import datetime, timezone
from typing import Optional, Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
)
from app.core.config import settings
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    UnauthorizedException,
)
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse


class AuthService:
    """Handles all authentication-related business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: RegisterRequest) -> dict[str, Any]:
        """
        Register a new user.

        Steps:
        1. Check if email already exists
        2. Create user with hashed password
        3. Create role-specific profile (e.g., Patient)
        4. Generate JWT tokens

        Returns:
            Dict with user data and tokens
        """
        # Check for existing user
        result = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise ConflictException("An account with this email already exists")

        # Create user
        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            phone=data.phone,
            role=UserRole(data.role),
            is_active=True,
            is_verified=False,
        )
        self.db.add(user)
        await self.db.flush()  # Get user.id before creating profile

        # Create role-specific profile
        if data.role == "patient":
            patient = Patient(user_id=user.id)
            self.db.add(patient)

        await self.db.flush()

        # Generate tokens
        access_token = create_access_token(user.id, user.role.value)
        refresh_token = create_refresh_token(user.id)

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value,
                "is_verified": user.is_verified,
            },
            "tokens": TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            ),
        }

    async def login(self, data: LoginRequest) -> dict[str, Any]:
        """
        Authenticate user and return tokens.

        Raises:
            UnauthorizedException: If credentials are invalid
        """
        # Find user by email
        result = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        user = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("Your account has been deactivated")

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        await self.db.flush()

        # Generate tokens
        access_token = create_access_token(user.id, user.role.value)
        refresh_token = create_refresh_token(user.id)

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value,
                "avatar_url": user.avatar_url,
                "is_verified": user.is_verified,
            },
            "tokens": TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            ),
        }

    async def refresh_tokens(self, refresh_token_str: str) -> TokenResponse:
        """
        Refresh access token using a valid refresh token.

        Raises:
            UnauthorizedException: If refresh token is invalid
        """
        payload = verify_refresh_token(refresh_token_str)
        if not payload:
            raise UnauthorizedException("Invalid or expired refresh token")

        user_id = payload.get("sub")

        # Verify user still exists and is active
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise UnauthorizedException("User not found or deactivated")

        # Generate new tokens
        access_token = create_access_token(user.id, user.role.value)
        new_refresh_token = create_refresh_token(user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def change_password(
        self, user: User, current_password: str, new_password: str
    ) -> bool:
        """Change user's password after verifying current password."""
        if not verify_password(current_password, user.password_hash):
            raise BadRequestException("Current password is incorrect")

        user.password_hash = hash_password(new_password)
        await self.db.flush()
        return True

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Fetch user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Fetch user by email."""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
