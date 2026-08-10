import pytest
from datetime import datetime, timezone

from sqlalchemy import select

from app.models.user import User
from app.models.patient import Patient
from app.models.emergency import (
    EmergencyRequest,
    EmergencyType,
    EmergencyStatus,
)


@pytest.mark.asyncio
async def test_dashboard_patient(client, db_session):
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "analytics_patient@test.com",
            "password": "StrongPass123",
            "confirm_password": "StrongPass123",
            "full_name": "Analytics Patient",
            "role": "patient",
        },
    )

    assert register_response.status_code == 201

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "analytics_patient@test.com",
            "password": "StrongPass123",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["data"]["tokens"]["access_token"]

    response = await client.get(
        "/api/v1/analytics/dashboard",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()["data"]

    assert "nearby_hospitals" in data
    assert "total_emergencies" in data
    assert "active_emergency" in data


@pytest.mark.asyncio
async def test_dashboard_without_token(client):
    response = await client.get(
        "/api/v1/analytics/dashboard"
    )

    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_emergency_trends_without_token(client):
    response = await client.get(
        "/api/v1/analytics/emergency-trends"
    )

    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_emergency_trends_patient_forbidden(
    client,
):
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "analytics_forbidden@test.com",
            "password": "StrongPass123",
            "confirm_password": "StrongPass123",
            "full_name": "Analytics Forbidden Patient",
            "role": "patient",
        },
    )

    assert register_response.status_code == 201

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "analytics_forbidden@test.com",
            "password": "StrongPass123",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["data"]["tokens"]["access_token"]

    response = await client.get(
        "/api/v1/analytics/emergency-trends",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_dashboard_hospital_admin(
    client,
):
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "analytics_admin@test.com",
            "password": "StrongPass123",
            "confirm_password": "StrongPass123",
            "full_name": "Analytics Hospital Admin",
            "role": "hospital_admin",
        },
    )

    assert register_response.status_code == 201

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "analytics_admin@test.com",
            "password": "StrongPass123",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["data"]["tokens"]["access_token"]

    response = await client.get(
        "/api/v1/analytics/dashboard",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()["data"]

    assert "total_hospitals" in data
    assert "total_available_beds" in data
    assert "total_icu_available" in data
    assert "total_patients" in data
    assert "total_ambulances" in data
    assert "available_ambulances" in data
    assert "active_emergencies" in data
    assert "emergencies_today" in data
    assert "total_users" in data
    assert "severity_breakdown" in data
    assert "recent_emergencies" in data


@pytest.mark.asyncio
async def test_emergency_trends_admin_empty(
    client,
):
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "analytics_trends_admin@test.com",
            "password": "StrongPass123",
            "confirm_password": "StrongPass123",
            "full_name": "Analytics Trends Admin",
            "role": "hospital_admin",
        },
    )

    assert register_response.status_code == 201

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "analytics_trends_admin@test.com",
            "password": "StrongPass123",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["data"]["tokens"]["access_token"]

    response = await client.get(
        "/api/v1/analytics/emergency-trends",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()["data"]

    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_dashboard_patient_with_active_emergency(
    client,
    db_session,
):
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "analytics_active@test.com",
            "password": "StrongPass123",
            "confirm_password": "StrongPass123",
            "full_name": "Active Emergency Patient",
            "role": "patient",
        },
    )

    assert register_response.status_code == 201

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "analytics_active@test.com",
            "password": "StrongPass123",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["data"]["tokens"]["access_token"]

    user_result = await db_session.execute(
        select(User).where(
            User.email == "analytics_active@test.com"
        )
    )

    user = user_result.scalar_one()

    # Registration may already create the Patient profile.
    # Therefore, first check whether it already exists.
    patient_result = await db_session.execute(
        select(Patient).where(
            Patient.user_id == user.id
        )
    )

    patient = patient_result.scalar_one_or_none()

    if patient is None:
        patient = Patient(
            user_id=user.id
        )

        db_session.add(patient)

        await db_session.commit()
        await db_session.refresh(patient)

    emergency = EmergencyRequest(
        patient_id=patient.id,
        emergency_type=EmergencyType.CARDIAC,
        severity=5,
        description="Active cardiac emergency",
        symptoms="Chest pain and breathing difficulty",
        status=EmergencyStatus.REQUESTED,
        location_lat=28.6139,
        location_lng=77.2090,
        location_address="New Delhi",
        requested_at=datetime.now(timezone.utc),
    )

    db_session.add(emergency)

    await db_session.commit()

    response = await client.get(
        "/api/v1/analytics/dashboard",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()["data"]

    assert data["total_emergencies"] == 1

    assert data["active_emergency"] is not None

    assert data["active_emergency"]["severity"] == 5

    assert data["active_emergency"]["status"] == "requested"

    assert data["active_emergency"]["id"] == emergency.id
    assert "nearby_hospitals" in data

@pytest.mark.asyncio
async def test_dashboard_doctor(client):
    """Doctor role hits the fallback empty branch for dashboard stats."""
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "doctor_dash@test.com",
            "password": "StrongPass123",
            "confirm_password": "StrongPass123",
            "full_name": "Dr Dash",
            "role": "doctor",
        },
    )
    assert register_response.status_code == 201

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "doctor_dash@test.com",
            "password": "StrongPass123",
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()["data"]["tokens"]["access_token"]

    response = await client.get(
        "/api/v1/analytics/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["data"] == {}

@pytest.mark.asyncio
async def test_dashboard_patient_no_profile(client, db_session):
    """Patient with no profile hits the if patient: False branch."""
    from app.models.user import User
    from app.models.patient import Patient
    from sqlalchemy import select

    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "patient_no_prof@test.com",
            "password": "StrongPass123",
            "confirm_password": "StrongPass123",
            "full_name": "No Prof",
            "role": "patient",
        },
    )
    assert register_response.status_code == 201

    # Manually delete patient profile
    result = await db_session.execute(select(User).where(User.email == "patient_no_prof@test.com"))
    user = result.scalar_one()
    patient_result = await db_session.execute(select(Patient).where(Patient.user_id == user.id))
    patient = patient_result.scalar_one()
    await db_session.delete(patient)
    await db_session.commit()

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "patient_no_prof@test.com",
            "password": "StrongPass123",
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()["data"]["tokens"]["access_token"]

    response = await client.get(
        "/api/v1/analytics/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["nearby_hospitals"] >= 0

@pytest.mark.asyncio
async def test_emergency_trends_with_data(client, db_session):
    """Test emergency trends with an actual emergency to cover the loop."""
    # Ensure there is an emergency first
    from app.models.user import User
    from app.models.patient import Patient
    from app.models.emergency import EmergencyRequest, EmergencyType, EmergencyStatus
    from sqlalchemy import select
    from datetime import datetime, timezone

    # create patient
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "trend_patient@test.com",
            "password": "StrongPass123",
            "confirm_password": "StrongPass123",
            "full_name": "Trend P",
            "role": "patient",
        },
    )
    result = await db_session.execute(select(User).where(User.email == "trend_patient@test.com"))
    user = result.scalar_one()
    patient_result = await db_session.execute(select(Patient).where(Patient.user_id == user.id))
    patient = patient_result.scalar_one()

    # create emergencies
    emergency = EmergencyRequest(
        patient_id=patient.id,
        emergency_type=EmergencyType.CARDIAC,
        severity=5,
        description="Active cardiac emergency",
        symptoms="Chest pain and breathing difficulty",
        status=EmergencyStatus.REQUESTED,
        location_lat=28.6139,
        location_lng=77.2090,
        location_address="New Delhi",
        requested_at=datetime.now(timezone.utc),
    )
    
    emergency2 = EmergencyRequest(
        patient_id=patient.id,
        emergency_type=EmergencyType.TRAUMA,
        severity=4,
        description="Trauma",
        symptoms="Bleeding",
        status=EmergencyStatus.REQUESTED,
        location_lat=28.6139,
        location_lng=77.2090,
        location_address="New Delhi",
        requested_at=datetime.now(timezone.utc),
    )
    db_session.add_all([emergency, emergency2])
    await db_session.commit()

    # Get trends as admin
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "trends_admin@test.com",
            "password": "StrongPass123",
            "confirm_password": "StrongPass123",
            "full_name": "Trends Admin",
            "role": "hospital_admin",
        },
    )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "trends_admin@test.com",
            "password": "StrongPass123",
        },
    )
    token = login_response.json()["data"]["tokens"]["access_token"]

    response = await client.get(
        "/api/v1/analytics/emergency-trends",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    trends = response.json()["data"]
    assert len(trends) > 0
    assert trends[-1]["count"] >= 1

@pytest.mark.asyncio
async def test_patient_repr(db_session):
    from app.models.patient import Patient

    patient = Patient(user_id="test-user-id")

    assert repr(patient) == "<Patient user_id=test-user-id>"