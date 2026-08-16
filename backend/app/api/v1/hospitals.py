"""
Aegis AI – Hospitals API Routes

Hospital CRUD, search, and bed management endpoints.
"""

from typing import Any

import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_hospital_admin, require_any_admin
from app.models.user import User
from app.models.hospital import Hospital
from app.schemas.hospital import (
    HospitalCreate, HospitalUpdate, HospitalResponse,
    HospitalListResponse, BedAvailabilityUpdate,
)
from app.schemas.common import SuccessResponse, PaginatedResponse, PaginationMeta
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on Earth."""
    R = 6371  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@router.get(
    "",
    summary="List and search hospitals",
    include_in_schema=False,
)
@router.get(
    "/",
    summary="List and search hospitals",
)
async def list_hospitals(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    search: str = Query(default=None),
    city: str = Query(default=None),
    state: str = Query(default=None),
    hospital_type: str = Query(default=None),
    has_emergency: bool = Query(default=None),
    has_beds: bool = Query(default=None),
    lat: float = Query(default=None, description="User latitude for distance calc"),
    lng: float = Query(default=None, description="User longitude for distance calc"),
    radius_km: float = Query(default=50.0, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Search and list hospitals with geolocation, filtering, and pagination.

    No authentication required – public endpoint for emergency use.
    """
    query = select(Hospital).where(Hospital.is_active)

    # Text search
    if search:
        query = query.where(
            or_(
                Hospital.name.ilike(f"%{search}%"),
                Hospital.city.ilike(f"%{search}%"),
                Hospital.address.ilike(f"%{search}%"),
            )
        )

    # Filters
    if city:
        query = query.where(Hospital.city.ilike(f"%{city}%"))
    if state:
        query = query.where(Hospital.state.ilike(f"%{state}%"))
    if hospital_type:
        query = query.where(Hospital.hospital_type == hospital_type)
    if has_emergency is not None:
        query = query.where(Hospital.has_emergency == has_emergency)
    if has_beds:
        query = query.where(Hospital.available_beds > 0)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    query = query.order_by(Hospital.rating.desc(), Hospital.name)
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    hospitals = result.scalars().all()

    # Calculate distances if user location provided
    hospital_data = []
    for h in hospitals:
        h_dict = HospitalListResponse.model_validate(h).model_dump()
        if lat and lng and h.latitude and h.longitude:
            distance = haversine_distance(lat, lng, h.latitude, h.longitude)
            h_dict["distance_km"] = round(distance, 2)
        hospital_data.append(h_dict)

    # Sort by distance if location provided
    if lat and lng:
        hospital_data.sort(key=lambda x: x.get("distance_km", float("inf")))

    total_pages = (total + per_page - 1) // per_page

    return PaginatedResponse(
        data=hospital_data,
        pagination=PaginationMeta(
            page=page,
            per_page=per_page,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        ),
    )


@router.post(
    "/",
    summary="Create a new hospital (admin only)",
    status_code=201,
)
async def create_hospital(
    data: HospitalCreate,
    current_user: User = Depends(require_any_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Create a new hospital entry."""
    hospital = Hospital(
        **data.model_dump(),
        available_beds=data.total_beds,
        icu_available=data.icu_beds,
    )
    db.add(hospital)
    await db.flush()

    return SuccessResponse(
        message="Hospital created successfully",
        data=HospitalResponse.model_validate(hospital).model_dump(),
    )


@router.get(
    "/{hospital_id}",
    summary="Get hospital details",
)
async def get_hospital(
    hospital_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get detailed hospital information. Public endpoint."""
    result = await db.execute(
        select(Hospital).where(Hospital.id == hospital_id)
    )
    hospital = result.scalar_one_or_none()

    if not hospital:
        raise NotFoundException("Hospital", hospital_id)

    return SuccessResponse(
        data=HospitalResponse.model_validate(hospital).model_dump(),
    )


@router.put(
    "/{hospital_id}",
    summary="Update hospital (admin only)",
)
async def update_hospital(
    hospital_id: str,
    data: HospitalUpdate,
    current_user: User = Depends(require_any_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update hospital information. Admin only."""
    result = await db.execute(
        select(Hospital).where(Hospital.id == hospital_id)
    )
    hospital = result.scalar_one_or_none()

    if not hospital:
        raise NotFoundException("Hospital", hospital_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(hospital, field, value)

    await db.flush()

    return SuccessResponse(
        message="Hospital updated successfully",
        data=HospitalResponse.model_validate(hospital).model_dump(),
    )


@router.put(
    "/{hospital_id}/beds",
    summary="Update bed availability",
)
async def update_bed_availability(
    hospital_id: str,
    data: BedAvailabilityUpdate,
    current_user: User = Depends(require_hospital_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update hospital bed availability. Hospital admin only."""
    result = await db.execute(
        select(Hospital).where(Hospital.id == hospital_id)
    )
    hospital = result.scalar_one_or_none()

    if not hospital:
        raise NotFoundException("Hospital", hospital_id)

    if data.available_beds is not None:
        hospital.available_beds = min(data.available_beds, hospital.total_beds)
    if data.icu_available is not None:
        hospital.icu_available = min(data.icu_available, hospital.icu_beds)
    if data.ventilators_available is not None:
        hospital.ventilators_available = min(data.ventilators_available, hospital.ventilators)

    await db.flush()

    return SuccessResponse(
        message="Bed availability updated",
        data=HospitalResponse.model_validate(hospital).model_dump(),
    )


@router.delete(
    "/{hospital_id}",
    summary="Delete hospital (admin only)",
)
async def delete_hospital(
    hospital_id: str,
    current_user: User = Depends(require_any_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Soft-delete a hospital. Admin only."""
    result = await db.execute(
        select(Hospital).where(Hospital.id == hospital_id)
    )
    hospital = result.scalar_one_or_none()

    if not hospital:
        raise NotFoundException("Hospital", hospital_id)

    hospital.is_active = False
    await db.flush()

    return SuccessResponse(message="Hospital deleted successfully")
