"""
Aegis AI – User Schemas

Request/response models for user-related operations.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user fields."""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=150)
    phone: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    """User creation schema (internal use)."""
    password_hash: str
    role: str = "patient"


class UserUpdate(BaseModel):
    """User profile update schema."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    """User response schema (public profile)."""
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    bio: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    """Minimal user info for lists."""
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserStats(BaseModel):
    """User statistics for admin dashboards."""
    total_users: int = 0
    active_users: int = 0
    patients: int = 0
    doctors: int = 0
    ambulance_drivers: int = 0
    hospital_admins: int = 0
    government_admins: int = 0
