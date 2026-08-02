"""
Aegis AI – Analytics API Routes

Dashboard analytics and statistics for different user roles.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, require_any_admin
from app.models.user import User
from app.models.hospital import Hospital
from app.models.ambulance import Ambulance, AmbulanceStatus
from app.models.emergency import EmergencyRequest, EmergencyStatus
from app.models.patient import Patient
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/dashboard",
    summary="Get dashboard analytics",
)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get role-specific dashboard statistics.

    Returns different data based on the user's role.
    """

    stats: dict[str, Any] = {}

    if current_user.role.value in ("hospital_admin", "government_admin"):
        # Total hospitals
        h_result = await db.execute(select(func.count(Hospital.id)))
        stats["total_hospitals"] = h_result.scalar() or 0

        # Total beds available
        beds_result = await db.execute(select(func.sum(Hospital.available_beds)))
        stats["total_available_beds"] = beds_result.scalar() or 0

        # ICU available
        icu_result = await db.execute(select(func.sum(Hospital.icu_available)))
        stats["total_icu_available"] = icu_result.scalar() or 0

        # Total patients
        p_result = await db.execute(select(func.count(Patient.id)))
        stats["total_patients"] = p_result.scalar() or 0

        # Total ambulances
        a_result = await db.execute(select(func.count(Ambulance.id)))
        stats["total_ambulances"] = a_result.scalar() or 0

        # Available ambulances
        aa_result = await db.execute(
            select(func.count(Ambulance.id)).where(
                Ambulance.status == AmbulanceStatus.AVAILABLE
            )
        )
        stats["available_ambulances"] = aa_result.scalar() or 0

        # Active emergencies
        active_statuses = [
            EmergencyStatus.REQUESTED, EmergencyStatus.DISPATCHED,
            EmergencyStatus.EN_ROUTE, EmergencyStatus.ARRIVED,
            EmergencyStatus.IN_TREATMENT, EmergencyStatus.TRANSPORTING,
        ]
        ae_result = await db.execute(
            select(func.count(EmergencyRequest.id)).where(
                EmergencyRequest.status.in_(active_statuses)
            )
        )
        stats["active_emergencies"] = ae_result.scalar() or 0

        # Total emergencies today
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        te_result = await db.execute(
            select(func.count(EmergencyRequest.id)).where(
                EmergencyRequest.requested_at >= today_start
            )
        )
        stats["emergencies_today"] = te_result.scalar() or 0

        # Total users
        u_result = await db.execute(select(func.count(User.id)))
        stats["total_users"] = u_result.scalar() or 0

        # Emergency severity breakdown
        severity_data = []
        for sev in range(1, 6):
            sev_result = await db.execute(
                select(func.count(EmergencyRequest.id)).where(
                    EmergencyRequest.severity == sev
                )
            )
            severity_data.append({
                "severity": sev,
                "count": sev_result.scalar() or 0,
            })
        stats["severity_breakdown"] = severity_data

        # Recent emergencies
        recent_result = await db.execute(
            select(EmergencyRequest)
            .order_by(EmergencyRequest.requested_at.desc())
            .limit(10)
        )
        recent = recent_result.scalars().all()
        stats["recent_emergencies"] = [
            {
                "id": e.id,
                "type": e.emergency_type.value if hasattr(e.emergency_type, 'value') else e.emergency_type,
                "severity": e.severity,
                "status": e.status.value if hasattr(e.status, 'value') else e.status,
                "requested_at": e.requested_at.isoformat() if e.requested_at else None,
            }
            for e in recent
        ]

    elif current_user.role.value == "patient":
        # Patient-specific stats
        patient_result = await db.execute(
            select(Patient).where(Patient.user_id == current_user.id)
        )
        patient = patient_result.scalar_one_or_none()

        if patient:
            # Total emergencies
            pe_result = await db.execute(
                select(func.count(EmergencyRequest.id)).where(
                    EmergencyRequest.patient_id == patient.id
                )
            )
            stats["total_emergencies"] = pe_result.scalar() or 0

            # Active emergency
            active_result = await db.execute(
                select(EmergencyRequest).where(
                    EmergencyRequest.patient_id == patient.id,
                    EmergencyRequest.status.notin_([
                        EmergencyStatus.RESOLVED, EmergencyStatus.CANCELLED
                    ]),
                ).order_by(EmergencyRequest.requested_at.desc()).limit(1)
            )
            active = active_result.scalar_one_or_none()
            stats["active_emergency"] = (
                {
                    "id": active.id,
                    "status": active.status.value if hasattr(active.status, 'value') else active.status,
                    "severity": active.severity,
                }
                if active else None
            )

        # Nearby hospitals count
        nh_result = await db.execute(
            select(func.count(Hospital.id)).where(Hospital.is_active)
        )
        stats["nearby_hospitals"] = nh_result.scalar() or 0

    return SuccessResponse(
        message="Dashboard analytics retrieved",
        data=stats,
    )


@router.get(
    "/emergency-trends",
    summary="Get emergency trends (admin only)",
)
async def get_emergency_trends(
    days: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(require_any_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get emergency request trends over the specified number of days."""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(EmergencyRequest).where(
            EmergencyRequest.requested_at >= start_date
        ).order_by(EmergencyRequest.requested_at)
    )
    emergencies = result.scalars().all()

    # Group by date
    daily_counts = {}
    for e in emergencies:
        date_key = e.requested_at.strftime("%Y-%m-%d")
        if date_key not in daily_counts:
            daily_counts[date_key] = 0
        daily_counts[date_key] += 1

    trends = [
        {"date": date, "count": count}
        for date, count in sorted(daily_counts.items())
    ]

    return SuccessResponse(
        message="Emergency trends retrieved",
        data=trends,
    )
