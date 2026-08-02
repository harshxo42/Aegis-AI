"""
Aegis AI – Common Schemas

Shared response models and pagination schemas.
"""

from typing import Any, List, Optional, TypeVar
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar("T")


class SuccessResponse(BaseModel):
    """Standard success response wrapper."""
    success: bool = True
    message: str = "Operation successful"
    data: Optional[Any] = None


class ErrorResponse(BaseModel):
    """Standard error response wrapper."""
    success: bool = False
    message: str
    details: Optional[Any] = None
    error_code: Optional[str] = None


class PaginationMeta(BaseModel):
    """Pagination metadata."""
    page: int = 1
    per_page: int = 20
    total: int = 0
    total_pages: int = 0
    has_next: bool = False
    has_prev: bool = False


class PaginatedResponse(BaseModel):
    """Paginated response with metadata."""
    success: bool = True
    message: str = "Data retrieved successfully"
    data: List[Any] = []
    pagination: PaginationMeta


class PaginationParams(BaseModel):
    """Query parameters for pagination."""
    page: int = Field(default=1, ge=1, description="Page number")
    per_page: int = Field(default=20, ge=1, le=100, description="Items per page")
    search: Optional[str] = Field(default=None, description="Search query")
    sort_by: Optional[str] = Field(default="created_at", description="Sort field")
    sort_order: Optional[str] = Field(default="desc", description="Sort order (asc/desc)")


class HealthCheck(BaseModel):
    """Health check response."""
    status: str = "healthy"
    version: str
    environment: str
    timestamp: datetime
