import pytest
from datetime import datetime, timezone

from app.api.v1.emergencies import (
    create_emergency,
    list_emergencies,
    get_active_emergencies,
    get_emergency,
    update_emergency,
    cancel_emergency,
)

from app.core.exceptions import NotFoundException, BadRequestException

from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.emergency import EmergencyRequest, EmergencyStatus

from app.schemas.emergency import EmergencyCreate, EmergencyUpdate
from app.schemas.common import SuccessResponse, PaginatedResponse


# ============================================================
# TEST HELPERS
# ============================================================

async def create_test_patient(
    db_session,
    role=UserRole.PATIENT,
):
    """Create a User and its Patient profile for testing."""

    user = User(
        email=f"test-{datetime.now().timestamp()}@example.com",
        password_hash="hashed-password",
        full_name="Test User",
        role=role,
        is_active=True,
    )

    db_session.add(user)
    await db_session.flush()

    patient = Patient(
        user_id=user.id,
        blood_group="O+",
        gender="Male",
    )

    db_session.add(patient)
    await db_session.flush()

    return user, patient


async def create_test_emergency(
    db_session,
    patient_id,
    status=EmergencyStatus.REQUESTED,
    severity=3,
):
    """Create an EmergencyRequest directly in the test database."""

    emergency = EmergencyRequest(
        patient_id=patient_id,
        emergency_type="cardiac",
        severity=severity,
        description="Test emergency",
        symptoms="Chest pain",
        location_lat=28.6139,
        location_lng=77.2090,
        location_address="New Delhi",
        status=status,
        requested_at=datetime.now(timezone.utc),
    )

    db_session.add(emergency)
    await db_session.flush()

    return emergency


# ============================================================
# CREATE EMERGENCY
# ============================================================

@pytest.mark.asyncio
async def test_create_emergency_success(db_session):
    user, patient = await create_test_patient(db_session)

    data = EmergencyCreate(
        emergency_type="cardiac",
        severity=5,
        description="Severe chest pain",
        symptoms="Chest pain and breathing difficulty",
        location_lat=28.6139,
        location_lng=77.2090,
        location_address="New Delhi",
    )

    response = await create_emergency(
        data=data,
        current_user=user,
        db=db_session,
    )

    assert isinstance(response, SuccessResponse)
    assert response.message == "Emergency request created. Help is on the way!"

    assert response.data["patient_id"] == patient.id
    assert response.data["severity"] == 5
    assert response.data["status"] == "requested"
    assert response.data["emergency_type"] == "cardiac"


@pytest.mark.asyncio
async def test_create_emergency_without_patient_profile(db_session):
    user = User(
        email="no-patient@example.com",
        password_hash="hashed-password",
        full_name="No Patient",
        role=UserRole.PATIENT,
        is_active=True,
    )

    db_session.add(user)
    await db_session.flush()

    data = EmergencyCreate(
        emergency_type="other",
        severity=3,
        location_lat=28.6139,
        location_lng=77.2090,
    )

    with pytest.raises(BadRequestException):
        await create_emergency(
            data=data,
            current_user=user,
            db=db_session,
        )


# ============================================================
# LIST EMERGENCIES
# ============================================================

@pytest.mark.asyncio
async def test_list_emergencies_for_patient(db_session):
    user, patient = await create_test_patient(db_session)

    await create_test_emergency(
        db_session,
        patient.id,
        severity=4,
    )

    response = await list_emergencies(
        page=1,
        per_page=20,
        status=None,
        severity=None,
        current_user=user,
        db=db_session,
    )

    assert isinstance(response, PaginatedResponse)

    assert len(response.data) == 1
    assert response.data[0]["patient_id"] == patient.id

    assert response.pagination.total == 1
    assert response.pagination.page == 1
    assert response.pagination.per_page == 20

    assert response.pagination.has_next is False
    assert response.pagination.has_prev is False


@pytest.mark.asyncio
async def test_list_emergencies_for_patient_without_profile(db_session):
    user = User(
        email="list-no-profile@example.com",
        password_hash="hashed-password",
        full_name="No Profile",
        role=UserRole.PATIENT,
        is_active=True,
    )

    db_session.add(user)
    await db_session.flush()

    response = await list_emergencies(
        page=1,
        per_page=20,
        status=None,
        severity=None,
        current_user=user,
        db=db_session,
    )

    assert isinstance(response, PaginatedResponse)
    assert response.data == []

    assert response.pagination.page == 1
    assert response.pagination.per_page == 20


@pytest.mark.asyncio
async def test_list_emergencies_for_admin_with_filters(db_session):
    admin, _ = await create_test_patient(
        db_session,
        role=UserRole.HOSPITAL_ADMIN,
    )

    patient_user, patient = await create_test_patient(db_session)

    await create_test_emergency(
        db_session,
        patient.id,
        status=EmergencyStatus.REQUESTED,
        severity=5,
    )

    await create_test_emergency(
        db_session,
        patient.id,
        status=EmergencyStatus.ACKNOWLEDGED,
        severity=2,
    )

    response = await list_emergencies(
        page=1,
        per_page=20,
        status="requested",
        severity=5,
        current_user=admin,
        db=db_session,
    )

    assert len(response.data) == 1

    assert response.data[0]["severity"] == 5
    assert response.data[0]["status"] == "requested"


# ============================================================
# ACTIVE EMERGENCIES
# ============================================================

@pytest.mark.asyncio
async def test_get_active_emergencies(db_session):
    admin, _ = await create_test_patient(
        db_session,
        role=UserRole.HOSPITAL_ADMIN,
    )

    patient_user, patient = await create_test_patient(db_session)

    await create_test_emergency(
        db_session,
        patient.id,
        status=EmergencyStatus.REQUESTED,
        severity=3,
    )

    await create_test_emergency(
        db_session,
        patient.id,
        status=EmergencyStatus.DISPATCHED,
        severity=5,
    )

    await create_test_emergency(
        db_session,
        patient.id,
        status=EmergencyStatus.RESOLVED,
        severity=5,
    )

    response = await get_active_emergencies(
        current_user=admin,
        db=db_session,
    )

    assert isinstance(response, SuccessResponse)

    # Only REQUESTED and DISPATCHED should be returned.
    # RESOLVED should not be returned.
    assert len(response.data) == 2

    severities = [
        item["severity"]
        for item in response.data
    ]

    assert 5 in severities
    assert 3 in severities


# ============================================================
# GET EMERGENCY
# ============================================================

@pytest.mark.asyncio
async def test_get_emergency_success(db_session):
    user, patient = await create_test_patient(db_session)

    emergency = await create_test_emergency(
        db_session,
        patient.id,
        severity=4,
    )

    response = await get_emergency(
        emergency_id=emergency.id,
        current_user=user,
        db=db_session,
    )

    assert isinstance(response, SuccessResponse)

    assert response.data["id"] == emergency.id
    assert response.data["patient_id"] == patient.id
    assert response.data["severity"] == 4


@pytest.mark.asyncio
async def test_get_emergency_not_found(db_session):
    user, _ = await create_test_patient(db_session)

    with pytest.raises(NotFoundException):
        await get_emergency(
            emergency_id="does-not-exist",
            current_user=user,
            db=db_session,
        )


# ============================================================
# UPDATE EMERGENCY
# ============================================================

@pytest.mark.asyncio
async def test_update_emergency_normal_fields(db_session):
    user, patient = await create_test_patient(db_session)

    emergency = await create_test_emergency(
        db_session,
        patient.id,
    )

    data = EmergencyUpdate(
        responder_notes="Responder is on the way",
        hospital_notes="Hospital notified",
    )

    response = await update_emergency(
        emergency_id=emergency.id,
        data=data,
        current_user=user,
        db=db_session,
    )

    assert response.message == "Emergency request updated"

    assert (
        response.data["responder_notes"]
        == "Responder is on the way"
    )

    assert (
        response.data["hospital_notes"]
        == "Hospital notified"
    )


@pytest.mark.asyncio
async def test_update_emergency_dispatched(db_session):
    user, patient = await create_test_patient(db_session)

    emergency = await create_test_emergency(
        db_session,
        patient.id,
    )

    data = EmergencyUpdate(
        status="dispatched",
    )

    response = await update_emergency(
        emergency_id=emergency.id,
        data=data,
        current_user=user,
        db=db_session,
    )

    assert response.data["status"] == "dispatched"
    assert response.data["dispatched_at"] is not None


@pytest.mark.asyncio
async def test_update_emergency_acknowledged(db_session):
    user, patient = await create_test_patient(db_session)

    emergency = await create_test_emergency(
        db_session,
        patient.id,
    )

    data = EmergencyUpdate(
        status="acknowledged",
    )

    response = await update_emergency(
        emergency_id=emergency.id,
        data=data,
        current_user=user,
        db=db_session,
    )

    assert response.data["status"] == "acknowledged"
    assert response.data["dispatched_at"] is None
    assert response.data["arrived_at"] is None
    assert response.data["resolved_at"] is None

@pytest.mark.asyncio
async def test_update_emergency_arrived(db_session):
    user, patient = await create_test_patient(db_session)

    emergency = await create_test_emergency(
        db_session,
        patient.id,
    )

    data = EmergencyUpdate(
        status="arrived",
    )

    response = await update_emergency(
        emergency_id=emergency.id,
        data=data,
        current_user=user,
        db=db_session,
    )

    assert response.data["status"] == "arrived"
    assert response.data["arrived_at"] is not None


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "status",
    [
        "resolved",
        "cancelled",
    ],
)
async def test_update_emergency_closed_status(
    db_session,
    status,
):
    user, patient = await create_test_patient(db_session)

    emergency = await create_test_emergency(
        db_session,
        patient.id,
    )

    data = EmergencyUpdate(
        status=status,
    )

    response = await update_emergency(
        emergency_id=emergency.id,
        data=data,
        current_user=user,
        db=db_session,
    )

    assert response.data["status"] == status
    assert response.data["resolved_at"] is not None


@pytest.mark.asyncio
async def test_update_emergency_not_found(db_session):
    user, _ = await create_test_patient(db_session)

    data = EmergencyUpdate(
        status="dispatched",
    )

    with pytest.raises(NotFoundException):
        await update_emergency(
            emergency_id="does-not-exist",
            data=data,
            current_user=user,
            db=db_session,
        )


# ============================================================
# CANCEL EMERGENCY
# ============================================================

@pytest.mark.asyncio
async def test_cancel_emergency_success(db_session):
    user, patient = await create_test_patient(db_session)

    emergency = await create_test_emergency(
        db_session,
        patient.id,
    )

    response = await cancel_emergency(
        emergency_id=emergency.id,
        current_user=user,
        db=db_session,
    )

    assert isinstance(response, SuccessResponse)
    assert response.message == "Emergency request cancelled"

    await db_session.refresh(emergency)

    assert emergency.status == EmergencyStatus.CANCELLED
    assert emergency.resolved_at is not None


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "status",
    [
        EmergencyStatus.RESOLVED,
        EmergencyStatus.CANCELLED,
    ],
)
async def test_cancel_already_closed_emergency(
    db_session,
    status,
):
    user, patient = await create_test_patient(db_session)

    emergency = await create_test_emergency(
        db_session,
        patient.id,
        status=status,
    )

    with pytest.raises(BadRequestException):
        await cancel_emergency(
            emergency_id=emergency.id,
            current_user=user,
            db=db_session,
        )


@pytest.mark.asyncio
async def test_cancel_emergency_not_found(db_session):
    user, _ = await create_test_patient(db_session)

    with pytest.raises(NotFoundException):
        await cancel_emergency(
            emergency_id="does-not-exist",
            current_user=user,
            db=db_session,
        )


# ============================================================
# HOSPITAL VALIDATION ON CREATION TESTS
# ============================================================

@pytest.mark.asyncio
async def test_create_emergency_with_hospital_branches(db_session):
    from app.models.hospital import Hospital

    user, patient = await create_test_patient(db_session)

    # 1. Hospital not found
    data_bad_id = EmergencyCreate(
        emergency_type="cardiac",
        severity=4,
        location_lat=28.6139,
        location_lng=77.2090,
        hospital_id="nonexistent-hospital-id",
    )
    with pytest.raises(NotFoundException):
        await create_emergency(data=data_bad_id, current_user=user, db=db_session)

    # 2. Inactive hospital
    inactive_hosp = Hospital(
        name="Inactive Hospital",
        phone="9876543210",
        address="Test Addr",
        city="Delhi",
        state="Delhi",
        pincode="110001",
        has_emergency=True,
        is_active=False,
    )
    db_session.add(inactive_hosp)
    await db_session.flush()

    data_inactive = EmergencyCreate(
        emergency_type="cardiac",
        severity=4,
        location_lat=28.6139,
        location_lng=77.2090,
        hospital_id=str(inactive_hosp.id),
    )
    with pytest.raises(BadRequestException) as exc_inactive:
        await create_emergency(data=data_inactive, current_user=user, db=db_session)
    assert "inactive" in str(exc_inactive.value.message)

    # 3. Hospital without emergency services
    no_em_hosp = Hospital(
        name="No Emergency Clinic",
        phone="9876543210",
        address="Test Addr 2",
        city="Delhi",
        state="Delhi",
        pincode="110001",
        has_emergency=False,
        is_active=True,
    )
    db_session.add(no_em_hosp)
    await db_session.flush()

    data_no_em = EmergencyCreate(
        emergency_type="cardiac",
        severity=4,
        location_lat=28.6139,
        location_lng=77.2090,
        hospital_id=str(no_em_hosp.id),
    )
    with pytest.raises(BadRequestException) as exc_no_em:
        await create_emergency(data=data_no_em, current_user=user, db=db_session)
    assert "emergency services" in str(exc_no_em.value.message)

    # 4. Valid hospital
    valid_hosp = Hospital(
        name="Apollo City Hospital",
        phone="9876543210",
        address="Main Ring Road",
        city="Delhi",
        state="Delhi",
        pincode="110001",
        has_emergency=True,
        is_active=True,
    )
    db_session.add(valid_hosp)
    await db_session.flush()

    data_valid = EmergencyCreate(
        emergency_type="cardiac",
        severity=4,
        location_lat=28.6139,
        location_lng=77.2090,
        hospital_id=str(valid_hosp.id),
    )
    res = await create_emergency(data=data_valid, current_user=user, db=db_session)
    assert res.data["hospital_id"] == str(valid_hosp.id)
    assert res.data["hospital_name"] == "Apollo City Hospital"


@pytest.mark.asyncio
async def test_cancel_emergency_by_other_patient_forbidden(db_session):
    from app.core.exceptions import ForbiddenException

    user_a, patient_a = await create_test_patient(db_session)
    user_b, _ = await create_test_patient(db_session)

    emergency = await create_test_emergency(db_session, patient_a.id)

    with pytest.raises(ForbiddenException) as exc_info:
        await cancel_emergency(
            emergency_id=emergency.id,
            current_user=user_b,
            db=db_session,
        )
    assert "permission" in exc_info.value.message.lower()


@pytest.mark.asyncio
async def test_list_emergencies_additional_filters(db_session):
    """Test list_emergencies with status and severity filters."""
    admin = User(
        email=f"admin-filter-{datetime.now().timestamp()}@test.com",
        password_hash="hash",
        full_name="Admin User",
        role=UserRole.GOVERNMENT_ADMIN,
        is_active=True,
    )
    db_session.add(admin)
    await db_session.flush()

    user, patient = await create_test_patient(db_session)
    em = EmergencyRequest(
        patient_id=patient.id,
        emergency_type="cardiac",
        severity=5,
        status=EmergencyStatus.REQUESTED,
        location_lat=28.6139,
        location_lng=77.2090,
        location_address="Delhi",
        requested_at=datetime.now(timezone.utc),
    )
    db_session.add(em)
    await db_session.flush()

    # Filter by severity=5 — should find at least our record
    res_sev = await list_emergencies(
        page=1,
        per_page=20,
        status=None,
        severity=5,
        current_user=admin,
        db=db_session,
    )
    assert res_sev.pagination.total >= 1

    # Filter by status=REQUESTED
    res_status = await list_emergencies(
        page=1,
        per_page=20,
        status="REQUESTED",
        severity=None,
        current_user=admin,
        db=db_session,
    )
    assert res_status.pagination.total >= 1

    # Filter by non-matching (severity=1, status=RESOLVED) — should return 0
    res_none = await list_emergencies(
        page=1,
        per_page=20,
        status="RESOLVED",
        severity=1,
        current_user=admin,
        db=db_session,
    )
    assert res_none.pagination.total == 0