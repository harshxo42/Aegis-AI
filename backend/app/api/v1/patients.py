"""
Aegis AI – Patients API Routes

Patient profile management and medical information.
"""

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, require_patient, require_any_admin
from app.models.user import User
from app.models.patient import Patient
from app.schemas.patient import PatientProfileUpdate, PatientProfileResponse
from app.schemas.common import SuccessResponse, PaginatedResponse, PaginationMeta
from app.core.exceptions import NotFoundException, ForbiddenException

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get(
    "/me",
    summary="Get current patient profile",
)
async def get_my_profile(
    current_user: User = Depends(require_patient),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get the authenticated patient's profile."""
    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    patient = result.scalar_one_or_none()

    if not patient:
        raise NotFoundException("Patient profile")

    return SuccessResponse(
        data=PatientProfileResponse.model_validate(patient).model_dump(),
    )


@router.put(
    "/me",
    summary="Update current patient profile",
)
async def update_my_profile(
    data: PatientProfileUpdate,
    current_user: User = Depends(require_patient),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update the authenticated patient's profile."""
    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    patient = result.scalar_one_or_none()

    if not patient:
        # Create profile if it doesn't exist
        patient = Patient(user_id=current_user.id)
        db.add(patient)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    await db.flush()

    return SuccessResponse(
        message="Patient profile updated successfully",
        data=PatientProfileResponse.model_validate(patient).model_dump(),
    )


@router.get(
    "/",
    summary="List all patients (admin only)",
)
async def list_patients(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    search: str = Query(default=None),
    city: str = Query(default=None),
    blood_group: str = Query(default=None),
    current_user: User = Depends(require_any_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """List all patients with search and filtering. Admin only."""
    query = select(Patient)

    if city:
        query = query.where(Patient.city.ilike(f"%{city}%"))
    if blood_group:
        query = query.where(Patient.blood_group == blood_group)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    query = query.order_by(Patient.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    patients = result.scalars().all()

    total_pages = (total + per_page - 1) // per_page

    return PaginatedResponse(
        data=[PatientProfileResponse.model_validate(p).model_dump() for p in patients],
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
    "/{patient_id}",
    summary="Get patient by ID",
)
async def get_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get patient profile by ID."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()

    if not patient:
        raise NotFoundException("Patient", patient_id)

    # Patients can only view their own profile unless admin/doctor
    if (current_user.role.value == "patient" and patient.user_id != current_user.id):
        raise ForbiddenException("You can only view your own profile")

    return SuccessResponse(
        data=PatientProfileResponse.model_validate(patient).model_dump(),
    )
