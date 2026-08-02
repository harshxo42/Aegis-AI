"""
Aegis AI – Emergencies API Routes

Emergency request creation, lifecycle management, and dispatch.
"""

from typing import Any

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, require_patient
from app.models.user import User
from app.models.patient import Patient
from app.models.emergency import EmergencyRequest, EmergencyStatus
from app.schemas.emergency import (
    EmergencyCreate, EmergencyUpdate, EmergencyResponse, EmergencyListResponse,
)
from app.schemas.common import SuccessResponse, PaginatedResponse, PaginationMeta
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter(prefix="/emergencies", tags=["Emergencies"])


@router.post(
    "/",
    summary="Create emergency request (SOS)",
    status_code=201,
)
async def create_emergency(
    data: EmergencyCreate,
    current_user: User = Depends(require_patient),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create a new emergency request.

    This is the SOS endpoint – triggers the emergency response flow:
    1. Creates emergency record
    2. (Future) Finds nearest available ambulance
    3. (Future) Dispatches ambulance
    4. (Future) Notifies hospital
    """
    # Get patient profile
    result = await db.execute(
        select(Patient).where(Patient.user_id == current_user.id)
    )
    patient = result.scalar_one_or_none()

    if not patient:
        raise BadRequestException("Patient profile not found. Please complete your profile first.")

    emergency = EmergencyRequest(
        patient_id=patient.id,
        emergency_type=data.emergency_type,
        severity=data.severity,
        description=data.description,
        symptoms=data.symptoms,
        location_lat=data.location_lat,
        location_lng=data.location_lng,
        location_address=data.location_address,
        status=EmergencyStatus.REQUESTED,
        requested_at=datetime.now(timezone.utc),
    )
    db.add(emergency)
    await db.flush()

    return SuccessResponse(
        message="Emergency request created. Help is on the way!",
        data=EmergencyResponse.model_validate(emergency).model_dump(),
    )


@router.get(
    "/",
    summary="List emergency requests",
)
async def list_emergencies(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    status: str = Query(default=None),
    severity: int = Query(default=None, ge=1, le=5),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    List emergency requests.

    - Patients see only their own emergencies
    - Admins/drivers see all emergencies
    """
    query = select(EmergencyRequest)

    # Role-based filtering
    if current_user.role.value == "patient":
        patient_result = await db.execute(
            select(Patient).where(Patient.user_id == current_user.id)
        )
        patient = patient_result.scalar_one_or_none()
        if patient:
            query = query.where(EmergencyRequest.patient_id == patient.id)
        else:
            return PaginatedResponse(
                data=[],
                pagination=PaginationMeta(page=page, per_page=per_page),
            )

    # Filters
    if status:
        query = query.where(EmergencyRequest.status == status)
    if severity:
        query = query.where(EmergencyRequest.severity == severity)

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate (most recent first)
    query = query.order_by(EmergencyRequest.requested_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    emergencies = result.scalars().all()

    total_pages = (total + per_page - 1) // per_page

    return PaginatedResponse(
        data=[EmergencyListResponse.model_validate(e).model_dump() for e in emergencies],
        pagination=PaginationMeta(
            page=page, per_page=per_page, total=total,
            total_pages=total_pages,
            has_next=page < total_pages, has_prev=page > 1,
        ),
    )


@router.get(
    "/active",
    summary="Get active emergencies",
)
async def get_active_emergencies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get all currently active (unresolved) emergencies."""
    active_statuses = [
        EmergencyStatus.REQUESTED,
        EmergencyStatus.ACKNOWLEDGED,
        EmergencyStatus.DISPATCHED,
        EmergencyStatus.EN_ROUTE,
        EmergencyStatus.ARRIVED,
        EmergencyStatus.IN_TREATMENT,
        EmergencyStatus.TRANSPORTING,
        EmergencyStatus.AT_HOSPITAL,
    ]

    query = select(EmergencyRequest).where(
        EmergencyRequest.status.in_(active_statuses)
    ).order_by(EmergencyRequest.severity.desc(), EmergencyRequest.requested_at)

    result = await db.execute(query)
    emergencies = result.scalars().all()

    return SuccessResponse(
        data=[EmergencyResponse.model_validate(e).model_dump() for e in emergencies],
    )


@router.get(
    "/{emergency_id}",
    summary="Get emergency details",
)
async def get_emergency(
    emergency_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get emergency request details by ID."""
    result = await db.execute(
        select(EmergencyRequest).where(EmergencyRequest.id == emergency_id)
    )
    emergency = result.scalar_one_or_none()

    if not emergency:
        raise NotFoundException("Emergency request", emergency_id)

    return SuccessResponse(
        data=EmergencyResponse.model_validate(emergency).model_dump(),
    )


@router.put(
    "/{emergency_id}",
    summary="Update emergency status",
)
async def update_emergency(
    emergency_id: str,
    data: EmergencyUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Update emergency request status and details.

    Used by ambulance drivers, hospital admins, and system.
    """
    result = await db.execute(
        select(EmergencyRequest).where(EmergencyRequest.id == emergency_id)
    )
    emergency = result.scalar_one_or_none()

    if not emergency:
        raise NotFoundException("Emergency request", emergency_id)

    update_data = data.model_dump(exclude_unset=True)

    # Track lifecycle timestamps
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == "dispatched" and not emergency.dispatched_at:
            emergency.dispatched_at = datetime.now(timezone.utc)
        elif new_status == "arrived" and not emergency.arrived_at:
            emergency.arrived_at = datetime.now(timezone.utc)
        elif new_status in ("resolved", "cancelled") and not emergency.resolved_at:
            emergency.resolved_at = datetime.now(timezone.utc)

    for field, value in update_data.items():
        setattr(emergency, field, value)

    await db.flush()

    return SuccessResponse(
        message="Emergency request updated",
        data=EmergencyResponse.model_validate(emergency).model_dump(),
    )


@router.put(
    "/{emergency_id}/cancel",
    summary="Cancel emergency request",
)
async def cancel_emergency(
    emergency_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Cancel an emergency request. Only the requesting patient can cancel."""
    result = await db.execute(
        select(EmergencyRequest).where(EmergencyRequest.id == emergency_id)
    )
    emergency = result.scalar_one_or_none()

    if not emergency:
        raise NotFoundException("Emergency request", emergency_id)

    if emergency.status in (EmergencyStatus.RESOLVED, EmergencyStatus.CANCELLED):
        raise BadRequestException("This emergency is already closed")

    emergency.status = EmergencyStatus.CANCELLED
    emergency.resolved_at = datetime.now(timezone.utc)
    await db.flush()

    return SuccessResponse(message="Emergency request cancelled")
