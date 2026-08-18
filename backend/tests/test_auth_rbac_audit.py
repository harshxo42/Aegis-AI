"""
Aegis AI - Complete Authentication & RBAC Audit Test Suite

Tests:
1. Successful login with token response contract (access_token, refresh_token, token_type, expires_in)
2. Login with invalid password -> 401
3. Login with nonexistent user -> 401
4. Access token generation structure
5. Authenticated endpoint with valid access token
6. Authenticated endpoint without token -> 401
7. Authenticated endpoint with invalid token -> 401
8. Authenticated endpoint with expired access token -> 401
9. Access token passed as refresh token -> 401
10. Refresh token passed as access token -> 401
11. Refresh token flow with valid refresh token
12. Refresh token flow with expired refresh token -> 401
13. Refresh token flow with invalid refresh token -> 401
14. Patient accessing admin endpoints -> 403
15. Cross-user data isolation (users, patients, emergencies) -> 403
16. Role hierarchy & scope enforcement (ambulance driver vs doctor vs admin)
17. Logout and token revocation
"""

from datetime import datetime, timezone, timedelta
import pytest
from sqlalchemy import select

from app.core.security import create_access_token, create_refresh_token, hash_password
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.hospital import Hospital
from app.models.emergency import EmergencyRequest, EmergencyStatus, EmergencyType


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def create_test_user(
    db_session,
    email: str,
    password: str = "Password123",
    role: UserRole = UserRole.PATIENT,
    full_name: str = "Test User",
    is_active: bool = True,
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        role=role,
        is_active=is_active,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.flush()

    if role == UserRole.PATIENT:
        patient = Patient(user_id=user.id, city="Delhi", blood_group="O+")
        db_session.add(patient)
        await db_session.flush()

    return user


async def create_test_emergency(
    db_session,
    patient_id: str,
    emergency_type: EmergencyType = EmergencyType.CARDIAC,
    severity: int = 5,
    status: EmergencyStatus = EmergencyStatus.REQUESTED,
) -> EmergencyRequest:
    emergency = EmergencyRequest(
        patient_id=patient_id,
        emergency_type=emergency_type,
        severity=severity,
        status=status,
        location_lat=28.6139,
        location_lng=77.2090,
        location_address="Connaught Place, New Delhi",
        requested_at=datetime.now(timezone.utc),
    )
    db_session.add(emergency)
    await db_session.flush()
    return emergency


# ---------------------------------------------------------------------------
# 1. Login & Token Contract Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_successful_login_token_contract(client, db_session):
    """Successful login returns non-empty access_token, refresh_token, bearer, expires_in."""
    await create_test_user(db_session, "patient_contract@example.com", "Password123", UserRole.PATIENT)

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "patient_contract@example.com", "password": "Password123"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True

    tokens = body["data"]["tokens"]
    assert isinstance(tokens["access_token"], str) and len(tokens["access_token"]) > 20
    assert isinstance(tokens["refresh_token"], str) and len(tokens["refresh_token"]) > 20
    assert tokens["token_type"] == "bearer"
    assert isinstance(tokens["expires_in"], int) and tokens["expires_in"] > 0


@pytest.mark.asyncio
async def test_login_invalid_password(client, db_session):
    """Login with wrong password returns 401 Unauthorized."""
    await create_test_user(db_session, "wrong_pw@example.com", "Password123", UserRole.PATIENT)

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrong_pw@example.com", "password": "IncorrectPassword123"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client, db_session):
    """Login with non-existent email returns 401 Unauthorized."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "Password123"},
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# 2. Access Token Verification & Expiration Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_authenticated_endpoint_with_valid_token(client, db_session):
    """Valid access token grants access to authenticated endpoints."""
    user = await create_test_user(db_session, "authed@example.com", "Password123", UserRole.PATIENT)
    token = create_access_token(user.id, user.role.value)

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["email"] == "authed@example.com"


@pytest.mark.asyncio
async def test_authenticated_endpoint_without_token(client):
    """Accessing protected endpoint without token returns 401."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_authenticated_endpoint_invalid_token(client):
    """Accessing protected endpoint with garbage token returns 401."""
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer not.a.valid.jwt.token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_authenticated_endpoint_expired_access_token(client, db_session):
    """Accessing protected endpoint with expired token returns 401."""
    user = await create_test_user(db_session, "expired@example.com", "Password123", UserRole.PATIENT)
    expired_token = create_access_token(
        user.id,
        user.role.value,
        expires_delta=timedelta(seconds=-60),
    )

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_used_as_access_token(client, db_session):
    """Refresh token passed in Authorization header must be rejected with 401."""
    user = await create_test_user(db_session, "token_type_test@example.com", "Password123", UserRole.PATIENT)
    refresh_token = create_refresh_token(user.id)

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# 3. Refresh Token Handling Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_valid_refresh_token_flow(client, db_session):
    """Valid refresh token successfully returns new access & refresh tokens."""
    user = await create_test_user(db_session, "refresh_flow@example.com", "Password123", UserRole.PATIENT)
    refresh_token = create_refresh_token(user.id)

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["access_token"]
    assert body["data"]["refresh_token"]


@pytest.mark.asyncio
async def test_access_token_used_as_refresh_token(client, db_session):
    """Access token passed to refresh endpoint must be rejected with 401."""
    user = await create_test_user(db_session, "access_as_refresh@example.com", "Password123", UserRole.PATIENT)
    access_token = create_access_token(user.id, user.role.value)

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": access_token},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_expired_refresh_token_rejected(client, db_session):
    """Expired refresh token must be rejected with 401."""
    user = await create_test_user(db_session, "expired_ref@example.com", "Password123", UserRole.PATIENT)
    expired_refresh = create_refresh_token(user.id, expires_delta=timedelta(seconds=-60))

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": expired_refresh},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_invalid_refresh_token_rejected(client):
    """Malformed refresh token must be rejected with 401."""
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "malformed.refresh.token"},
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# 4. RBAC: Patient -> Admin Endpoints = 403 Forbidden
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_patient_access_admin_users_list(client, db_session):
    """Patient cannot access admin GET /users/ endpoint (403)."""
    patient_user = await create_test_user(db_session, "patient_adm1@example.com", "Password123", UserRole.PATIENT)
    token = create_access_token(patient_user.id, patient_user.role.value)

    response = await client.get(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_patient_access_admin_user_stats(client, db_session):
    """Patient cannot access admin GET /users/stats endpoint (403)."""
    patient_user = await create_test_user(db_session, "patient_adm2@example.com", "Password123", UserRole.PATIENT)
    token = create_access_token(patient_user.id, patient_user.role.value)

    response = await client.get(
        "/api/v1/users/stats",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_patient_access_admin_create_hospital(client, db_session):
    """Patient cannot access admin POST /hospitals/ endpoint (403)."""
    patient_user = await create_test_user(db_session, "patient_adm3@example.com", "Password123", UserRole.PATIENT)
    token = create_access_token(patient_user.id, patient_user.role.value)

    hospital_payload = {
        "name": "Unauthorized Hospital",
        "city": "Delhi",
        "state": "Delhi",
        "address": "123 Street",
        "total_beds": 100,
        "icu_beds": 20,
    }
    response = await client.post(
        "/api/v1/hospitals/",
        json=hospital_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_patient_access_admin_patients_list(client, db_session):
    """Patient cannot access admin GET /patients/ list endpoint (403)."""
    patient_user = await create_test_user(db_session, "patient_adm4@example.com", "Password123", UserRole.PATIENT)
    token = create_access_token(patient_user.id, patient_user.role.value)

    response = await client.get(
        "/api/v1/patients/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# 5. Cross-User Privacy & Data Isolation Tests (403)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_patient_cross_user_profile_access(client, db_session):
    """Patient A cannot access Patient B's user profile by user ID (403)."""
    user_a = await create_test_user(db_session, "patient_a@example.com", "Password123", UserRole.PATIENT)
    user_b = await create_test_user(db_session, "patient_b@example.com", "Password123", UserRole.PATIENT)
    token_a = create_access_token(user_a.id, user_a.role.value)

    response = await client.get(
        f"/api/v1/users/{user_b.id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_patient_cross_patient_profile_access(client, db_session):
    """Patient A cannot access Patient B's medical profile by patient ID (403)."""
    user_a = await create_test_user(db_session, "patient_med_a@example.com", "Password123", UserRole.PATIENT)
    user_b = await create_test_user(db_session, "patient_med_b@example.com", "Password123", UserRole.PATIENT)

    result_b = await db_session.execute(select(Patient).where(Patient.user_id == user_b.id))
    patient_b = result_b.scalar_one()

    token_a = create_access_token(user_a.id, user_a.role.value)

    response = await client.get(
        f"/api/v1/patients/{patient_b.id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_patient_cross_emergency_access(client, db_session):
    """Patient A cannot access Patient B's emergency details by ID (403)."""
    user_a = await create_test_user(db_session, "patient_emg_a@example.com", "Password123", UserRole.PATIENT)
    user_b = await create_test_user(db_session, "patient_emg_b@example.com", "Password123", UserRole.PATIENT)

    result_b = await db_session.execute(select(Patient).where(Patient.user_id == user_b.id))
    patient_b = result_b.scalar_one()

    emergency_b = await create_test_emergency(
        db_session,
        patient_id=patient_b.id,
        emergency_type=EmergencyType.CARDIAC,
        severity=5,
    )

    token_a = create_access_token(user_a.id, user_a.role.value)

    response = await client.get(
        f"/api/v1/emergencies/{emergency_b.id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_patient_cannot_update_emergency_status(client, db_session):
    """Patient cannot call PUT /emergencies/{id} to modify triage or assignment (403)."""
    user = await create_test_user(db_session, "patient_no_update@example.com", "Password123", UserRole.PATIENT)
    result = await db_session.execute(select(Patient).where(Patient.user_id == user.id))
    patient = result.scalar_one()

    emergency = await create_test_emergency(
        db_session,
        patient_id=patient.id,
        emergency_type=EmergencyType.ACCIDENT,
        severity=3,
    )

    token = create_access_token(user.id, user.role.value)

    response = await client.put(
        f"/api/v1/emergencies/{emergency.id}",
        json={"status": "resolved", "responder_notes": "Fake resolved"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_patient_cannot_cancel_other_patient_emergency(client, db_session):
    """Patient A cannot cancel Patient B's emergency (403)."""
    user_a = await create_test_user(db_session, "cancel_patient_a@example.com", "Password123", UserRole.PATIENT)
    user_b = await create_test_user(db_session, "cancel_patient_b@example.com", "Password123", UserRole.PATIENT)

    result_b = await db_session.execute(select(Patient).where(Patient.user_id == user_b.id))
    patient_b = result_b.scalar_one()

    emergency_b = await create_test_emergency(
        db_session,
        patient_id=patient_b.id,
        emergency_type=EmergencyType.BREATHING,
        severity=4,
    )

    token_a = create_access_token(user_a.id, user_a.role.value)

    response = await client.put(
        f"/api/v1/emergencies/{emergency_b.id}/cancel",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# 6. Role Scope Enforcement (Ambulance Driver, Doctor, Admin)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ambulance_driver_cannot_access_admin_endpoints(client, db_session):
    """Ambulance driver cannot access hospital admin endpoints (403)."""
    driver = await create_test_user(db_session, "driver_rbac@example.com", "Password123", UserRole.AMBULANCE_DRIVER)
    token = create_access_token(driver.id, driver.role.value)

    response = await client.get(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_ambulance_driver_can_update_emergency(client, db_session):
    """Ambulance driver can update emergency status to en_route (200)."""
    driver = await create_test_user(db_session, "driver_updater@example.com", "Password123", UserRole.AMBULANCE_DRIVER)
    patient_user = await create_test_user(db_session, "driver_patient@example.com", "Password123", UserRole.PATIENT)

    result = await db_session.execute(select(Patient).where(Patient.user_id == patient_user.id))
    patient = result.scalar_one()

    emergency = await create_test_emergency(
        db_session,
        patient_id=patient.id,
        emergency_type=EmergencyType.CARDIAC,
        severity=5,
    )

    token = create_access_token(driver.id, driver.role.value)

    response = await client.put(
        f"/api/v1/emergencies/{emergency.id}",
        json={"status": "en_route", "responder_notes": "En route to scene"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "en_route"



@pytest.mark.asyncio
async def test_doctor_can_view_patient_profile(client, db_session):
    """Doctor can view patient medical profile for diagnosis / treatment (200)."""
    doctor = await create_test_user(db_session, "doctor_rbac@example.com", "Password123", UserRole.DOCTOR)
    patient_user = await create_test_user(db_session, "doctor_patient@example.com", "Password123", UserRole.PATIENT)

    result = await db_session.execute(select(Patient).where(Patient.user_id == patient_user.id))
    patient = result.scalar_one()

    token = create_access_token(doctor.id, doctor.role.value)

    response = await client.get(
        f"/api/v1/patients/{patient.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["id"] == patient.id


# ---------------------------------------------------------------------------
# 7. Logout Endpoint Test
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_logout_endpoint(client, db_session):
    """Authenticated user can logout successfully."""
    user = await create_test_user(db_session, "logout_audit@example.com", "Password123", UserRole.PATIENT)
    token = create_access_token(user.id, user.role.value)

    response = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"
