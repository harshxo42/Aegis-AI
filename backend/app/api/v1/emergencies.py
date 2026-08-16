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
from app.models.hospital import Hospital
from app.models.emergency import EmergencyRequest, EmergencyStatus

from app.schemas.emergency import (
    EmergencyCreate,
    EmergencyUpdate,
    EmergencyResponse,
    EmergencyListResponse,
)

from app.schemas.common import (
    SuccessResponse,
    PaginatedResponse,
    PaginationMeta,
)

from app.core.exceptions import (
    NotFoundException,
    BadRequestException,
)


router = APIRouter(prefix="/emergencies", tags=["Emergencies"])


# ============================================================
# CREATE EMERGENCY
# ============================================================

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

    Flow:
    1. Find patient profile
    2. Validate selected hospital
    3. Create emergency
    4. Save hospital assignment
    """

    # --------------------------------------------------------
    # Get patient profile
    # --------------------------------------------------------

    result = await db.execute(
        select(Patient).where(
            Patient.user_id == current_user.id
        )
    )

    patient = result.scalar_one_or_none()

    if not patient:
        raise BadRequestException(
            "Patient profile not found. "
            "Please complete your profile first."
        )

    # --------------------------------------------------------
    # Validate hospital if provided
    # --------------------------------------------------------

    hospital = None

    if data.hospital_id:

        hospital_result = await db.execute(
            select(Hospital).where(
                Hospital.id == data.hospital_id
            )
        )

        hospital = hospital_result.scalar_one_or_none()

        if not hospital:
            raise NotFoundException(
                "Hospital",
                data.hospital_id,
            )

        if not hospital.is_active:
            raise BadRequestException(
                "Selected hospital is currently inactive."
            )

        if not hospital.has_emergency:
            raise BadRequestException(
                "Selected hospital does not currently support emergency services."
            )

    # --------------------------------------------------------
    # Create emergency
    # --------------------------------------------------------

    emergency = EmergencyRequest(
        patient_id=patient.id,

        emergency_type=data.emergency_type,
        severity=data.severity,

        description=data.description,
        symptoms=data.symptoms,

        location_lat=data.location_lat,
        location_lng=data.location_lng,
        location_address=data.location_address,

        # Hospital assignment
        hospital_id=data.hospital_id,

        # Initial status
        status=EmergencyStatus.REQUESTED,

        requested_at=datetime.now(timezone.utc),
    )

    db.add(emergency)

    await db.flush()

    # --------------------------------------------------------
    # Build response
    # --------------------------------------------------------

    response_data = {
        "id": emergency.id,
        "patient_id": emergency.patient_id,

        "ambulance_id": emergency.ambulance_id,
        "hospital_id": emergency.hospital_id,

        "emergency_type": emergency.emergency_type,
        "severity": emergency.severity,

        "description": emergency.description,
        "symptoms": emergency.symptoms,

        "status": emergency.status.value
        if hasattr(emergency.status, "value")
        else emergency.status,

        "location_lat": emergency.location_lat,
        "location_lng": emergency.location_lng,
        "location_address": emergency.location_address,

        "requested_at": emergency.requested_at,
        "dispatched_at": emergency.dispatched_at,
        "arrived_at": emergency.arrived_at,
        "resolved_at": emergency.resolved_at,

        "ai_severity_score": emergency.ai_severity_score,
        "ai_recommended_hospital_id": (
            emergency.ai_recommended_hospital_id
        ),

        "estimated_arrival_minutes": (
            emergency.estimated_arrival_minutes
        ),

        "responder_notes": emergency.responder_notes,
        "hospital_notes": emergency.hospital_notes,

        "created_at": emergency.created_at,
        "updated_at": emergency.updated_at,

        "hospital_name": hospital.name if hospital else None,
        "hospital_address": hospital.address if hospital else None,
        "hospital_city": hospital.city if hospital else None,
        "hospital_state": hospital.state if hospital else None,
    }

    return SuccessResponse(
        message="Emergency request created. Help is on the way!",
        data=response_data,
    )


# ============================================================
# LIST EMERGENCIES
# ============================================================

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

    Patients:
        See only their own emergencies.

    Admins/drivers:
        See all emergencies.
    """

    query = (
        select(EmergencyRequest, Hospital)
        .outerjoin(
            Hospital,
            EmergencyRequest.hospital_id == Hospital.id,
        )
    )

    # --------------------------------------------------------
    # Role-based filtering
    # --------------------------------------------------------

    if current_user.role.value == "patient":

        patient_result = await db.execute(
            select(Patient).where(
                Patient.user_id == current_user.id
            )
        )

        patient = patient_result.scalar_one_or_none()

        if patient:
            query = query.where(
                EmergencyRequest.patient_id == patient.id
            )
        else:
            return PaginatedResponse(
                data=[],
                pagination=PaginationMeta(
                    page=page,
                    per_page=per_page,
                ),
            )

    # --------------------------------------------------------
    # Filters
    # --------------------------------------------------------

    if status:
        query = query.where(
            EmergencyRequest.status == status
        )

    if severity:
        query = query.where(
            EmergencyRequest.severity == severity
        )

    # --------------------------------------------------------
    # Count
    # --------------------------------------------------------

    count_base_query = select(
        EmergencyRequest.id
    ).select_from(EmergencyRequest)

    if current_user.role.value == "patient":

        patient_result = await db.execute(
            select(Patient).where(
                Patient.user_id == current_user.id
            )
        )

        patient = patient_result.scalar_one_or_none()

        if patient:
            count_base_query = count_base_query.where(
                EmergencyRequest.patient_id == patient.id
            )

    if status:
        count_base_query = count_base_query.where(
            EmergencyRequest.status == status
        )

    if severity:
        count_base_query = count_base_query.where(
            EmergencyRequest.severity == severity
        )

    count_query = select(
        func.count()
    ).select_from(
        count_base_query.subquery()
    )

    total_result = await db.execute(count_query)

    total = total_result.scalar() or 0

    # --------------------------------------------------------
    # Pagination
    # --------------------------------------------------------

    query = query.order_by(
        EmergencyRequest.requested_at.desc()
    )

    query = query.offset(
        (page - 1) * per_page
    ).limit(per_page)

    result = await db.execute(query)

    rows = result.all()

    total_pages = (
        (total + per_page - 1) // per_page
        if total
        else 0
    )

    # --------------------------------------------------------
    # Build list response
    # --------------------------------------------------------

    emergency_data = []

    for emergency, hospital in rows:

        emergency_data.append(
            {
                "id": emergency.id,
                "patient_id": emergency.patient_id,

                "hospital_id": emergency.hospital_id,

                "hospital_name": (
                    hospital.name
                    if hospital
                    else None
                ),

                "hospital_address": (
                    hospital.address
                    if hospital
                    else None
                ),

                "emergency_type": (
                    emergency.emergency_type
                ),

                "severity": emergency.severity,

                "status": (
                    emergency.status.value
                    if hasattr(emergency.status, "value")
                    else emergency.status
                ),

                "location_address": (
                    emergency.location_address
                ),

                "requested_at": (
                    emergency.requested_at
                ),

                "estimated_arrival_minutes": (
                    emergency.estimated_arrival_minutes
                ),
            }
        )

    return PaginatedResponse(
        data=emergency_data,

        pagination=PaginationMeta(
            page=page,
            per_page=per_page,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        ),
    )


# ============================================================
# ACTIVE EMERGENCIES
# ============================================================

@router.get(
    "/active",
    summary="Get active emergencies",
)
async def get_active_emergencies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get all currently active emergencies."""

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

    query = (
        select(EmergencyRequest, Hospital)
        .outerjoin(
            Hospital,
            EmergencyRequest.hospital_id == Hospital.id,
        )
        .where(
            EmergencyRequest.status.in_(
                active_statuses
            )
        )
        .order_by(
            EmergencyRequest.severity.desc(),
            EmergencyRequest.requested_at,
        )
    )

    result = await db.execute(query)

    rows = result.all()

    data = []

    for emergency, hospital in rows:

        data.append(
            {
                "id": emergency.id,
                "patient_id": emergency.patient_id,

                "ambulance_id": emergency.ambulance_id,
                "hospital_id": emergency.hospital_id,

                "emergency_type": emergency.emergency_type,
                "severity": emergency.severity,

                "description": emergency.description,
                "symptoms": emergency.symptoms,

                "status": (
                    emergency.status.value
                    if hasattr(emergency.status, "value")
                    else emergency.status
                ),

                "location_lat": emergency.location_lat,
                "location_lng": emergency.location_lng,
                "location_address": emergency.location_address,

                "requested_at": emergency.requested_at,
                "dispatched_at": emergency.dispatched_at,
                "arrived_at": emergency.arrived_at,
                "resolved_at": emergency.resolved_at,

                "ai_severity_score": (
                    emergency.ai_severity_score
                ),

                "ai_recommended_hospital_id": (
                    emergency.ai_recommended_hospital_id
                ),

                "estimated_arrival_minutes": (
                    emergency.estimated_arrival_minutes
                ),

                "responder_notes": emergency.responder_notes,
                "hospital_notes": emergency.hospital_notes,

                "created_at": emergency.created_at,
                "updated_at": emergency.updated_at,

                "hospital_name": (
                    hospital.name
                    if hospital
                    else None
                ),

                "hospital_address": (
                    hospital.address
                    if hospital
                    else None
                ),

                "hospital_city": (
                    hospital.city
                    if hospital
                    else None
                ),

                "hospital_state": (
                    hospital.state
                    if hospital
                    else None
                ),
            }
        )

    return SuccessResponse(
        data=data,
    )


# ============================================================
# GET EMERGENCY DETAILS
# ============================================================

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
        select(EmergencyRequest, Hospital)
        .outerjoin(
            Hospital,
            EmergencyRequest.hospital_id == Hospital.id,
        )
        .where(
            EmergencyRequest.id == emergency_id
        )
    )

    row = result.first()

    if not row:
        raise NotFoundException(
            "Emergency request",
            emergency_id,
        )

    emergency, hospital = row

    data = {
        "id": emergency.id,
        "patient_id": emergency.patient_id,

        "ambulance_id": emergency.ambulance_id,
        "hospital_id": emergency.hospital_id,

        "emergency_type": emergency.emergency_type,
        "severity": emergency.severity,

        "description": emergency.description,
        "symptoms": emergency.symptoms,

        "status": (
            emergency.status.value
            if hasattr(emergency.status, "value")
            else emergency.status
        ),

        "location_lat": emergency.location_lat,
        "location_lng": emergency.location_lng,
        "location_address": emergency.location_address,

        "requested_at": emergency.requested_at,
        "dispatched_at": emergency.dispatched_at,
        "arrived_at": emergency.arrived_at,
        "resolved_at": emergency.resolved_at,

        "ai_severity_score": emergency.ai_severity_score,

        "ai_recommended_hospital_id": (
            emergency.ai_recommended_hospital_id
        ),

        "estimated_arrival_minutes": (
            emergency.estimated_arrival_minutes
        ),

        "responder_notes": emergency.responder_notes,
        "hospital_notes": emergency.hospital_notes,

        "created_at": emergency.created_at,
        "updated_at": emergency.updated_at,

        "hospital_name": (
            hospital.name
            if hospital
            else None
        ),

        "hospital_address": (
            hospital.address
            if hospital
            else None
        ),

        "hospital_city": (
            hospital.city
            if hospital
            else None
        ),

        "hospital_state": (
            hospital.state
            if hospital
            else None
        ),
    }

    return SuccessResponse(
        data=data,
    )


# ============================================================
# UPDATE EMERGENCY
# ============================================================

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

    Used by ambulance drivers, hospital admins,
    and system services.
    """

    result = await db.execute(
        select(EmergencyRequest).where(
            EmergencyRequest.id == emergency_id
        )
    )

    emergency = result.scalar_one_or_none()

    if not emergency:
        raise NotFoundException(
            "Emergency request",
            emergency_id,
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    # --------------------------------------------------------
    # Validate hospital if changing hospital
    # --------------------------------------------------------

    if "hospital_id" in update_data:

        hospital_id = update_data["hospital_id"]

        if hospital_id:

            hospital_result = await db.execute(
                select(Hospital).where(
                    Hospital.id == hospital_id
                )
            )

            hospital = (
                hospital_result.scalar_one_or_none()
            )

            if not hospital:
                raise NotFoundException(
                    "Hospital",
                    hospital_id,
                )

            if not hospital.is_active:
                raise BadRequestException(
                    "Selected hospital is inactive."
                )

    # --------------------------------------------------------
    # Track lifecycle timestamps
    # --------------------------------------------------------

    if "status" in update_data:

        new_status = update_data["status"]

        if (
            new_status == "dispatched"
            and not emergency.dispatched_at
        ):
            emergency.dispatched_at = (
                datetime.now(timezone.utc)
            )

        elif (
            new_status == "arrived"
            and not emergency.arrived_at
        ):
            emergency.arrived_at = (
                datetime.now(timezone.utc)
            )

        elif (
            new_status in ("resolved", "cancelled")
            and not emergency.resolved_at
        ):
            emergency.resolved_at = (
                datetime.now(timezone.utc)
            )

    # --------------------------------------------------------
    # Apply updates
    # --------------------------------------------------------

    for field, value in update_data.items():

        setattr(
            emergency,
            field,
            value,
        )

    await db.flush()

    # --------------------------------------------------------
    # Fetch hospital for response
    # --------------------------------------------------------

    hospital = None

    if emergency.hospital_id:

        hospital_result = await db.execute(
            select(Hospital).where(
                Hospital.id == emergency.hospital_id
            )
        )

        hospital = (
            hospital_result.scalar_one_or_none()
        )

    return SuccessResponse(
        message="Emergency request updated",

        data={
            "id": emergency.id,
            "patient_id": emergency.patient_id,

            "ambulance_id": emergency.ambulance_id,
            "hospital_id": emergency.hospital_id,

            "emergency_type": emergency.emergency_type,
            "severity": emergency.severity,

            "description": emergency.description,
            "symptoms": emergency.symptoms,

            "status": (
                emergency.status.value
                if hasattr(emergency.status, "value")
                else emergency.status
            ),

            "location_lat": emergency.location_lat,
            "location_lng": emergency.location_lng,
            "location_address": emergency.location_address,

            "requested_at": emergency.requested_at,
            "dispatched_at": emergency.dispatched_at,
            "arrived_at": emergency.arrived_at,
            "resolved_at": emergency.resolved_at,

            "ai_severity_score": emergency.ai_severity_score,

            "ai_recommended_hospital_id": (
                emergency.ai_recommended_hospital_id
            ),

            "estimated_arrival_minutes": (
                emergency.estimated_arrival_minutes
            ),

            "responder_notes": emergency.responder_notes,
            "hospital_notes": emergency.hospital_notes,

            "created_at": emergency.created_at,
            "updated_at": emergency.updated_at,

            "hospital_name": (
                hospital.name
                if hospital
                else None
            ),

            "hospital_address": (
                hospital.address
                if hospital
                else None
            ),

            "hospital_city": (
                hospital.city
                if hospital
                else None
            ),

            "hospital_state": (
                hospital.state
                if hospital
                else None
            ),
        },
    )


# ============================================================
# CANCEL EMERGENCY
# ============================================================

@router.put(
    "/{emergency_id}/cancel",
    summary="Cancel emergency request",
)
async def cancel_emergency(
    emergency_id: str,

    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Cancel an emergency request."""

    result = await db.execute(
        select(EmergencyRequest).where(
            EmergencyRequest.id == emergency_id
        )
    )

    emergency = result.scalar_one_or_none()

    if not emergency:
        raise NotFoundException(
            "Emergency request",
            emergency_id,
        )

    if emergency.status in (
        EmergencyStatus.RESOLVED,
        EmergencyStatus.CANCELLED,
    ):
        raise BadRequestException(
            "This emergency is already closed"
        )

    emergency.status = EmergencyStatus.CANCELLED

    emergency.resolved_at = (
        datetime.now(timezone.utc)
    )

    await db.flush()

    return SuccessResponse(
        message="Emergency request cancelled"
    )