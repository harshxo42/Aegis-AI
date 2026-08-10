import pytest
from sqlalchemy import delete

from app.models.patient import Patient


# ============================================================
# Helper Functions
# ============================================================


async def register_user(
    client,
    email: str,
    password: str = "StrongPass123",
    full_name: str = "Test User",
    role: str = "patient",
):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "confirm_password": password,
            "full_name": full_name,
            "role": role,
        },
    )

    assert response.status_code == 201
    return response.json()


async def login_user(
    client,
    email: str,
    password: str = "StrongPass123",
):
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert response.status_code == 200

    return response.json()["data"]["tokens"]["access_token"]


async def create_patient(
    client,
    email: str,
    full_name: str = "Test Patient",
):
    await register_user(
        client,
        email=email,
        full_name=full_name,
        role="patient",
    )

    token = await login_user(client, email)

    response = await client.put(
        "/api/v1/patients/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "blood_group": "O+",
            "date_of_birth": "2000-01-01",
            "gender": "male",
            "height_cm": 175.0,
            "weight_kg": 70.0,
            "allergies": "None",
            "medical_history": "No major history",
            "current_medications": "None",
            "chronic_conditions": "None",
            "emergency_contact_name": "Emergency Contact",
            "emergency_contact_phone": "9876543210",
            "emergency_contact_relation": "Father",
            "insurance_provider": "Test Insurance",
            "insurance_id": "INS-12345",
            "address": "Test Address",
            "city": "Delhi",
            "state": "Delhi",
            "pincode": "110001",
            "location_lat": 28.6139,
            "location_lng": 77.2090,
        },
    )

    assert response.status_code == 200

    return token, response.json()["data"]


# ============================================================
# GET /patients/me
# ============================================================


@pytest.mark.asyncio
async def test_get_my_patient_profile(client):
    token, patient = await create_patient(
        client,
        "patient-profile@test.com",
        "Patient Profile Test",
    )

    response = await client.get(
        "/api/v1/patients/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert "data" in body
    assert body["data"]["id"] == patient["id"]
    assert body["data"]["user_id"] == patient["user_id"]
    assert body["data"]["blood_group"] == "O+"
    assert body["data"]["city"] == "Delhi"


@pytest.mark.asyncio
async def test_get_my_patient_profile_without_token(client):
    response = await client.get(
        "/api/v1/patients/me",
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_patient_profile_not_found(client, db_session):
    await register_user(
        client,
        "no-profile@test.com",
        full_name="No Profile Patient",
        role="patient",
    )

    token = await login_user(
        client,
        "no-profile@test.com",
    )

    me_response = await client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert me_response.status_code == 200

    user_id = me_response.json()["data"]["id"]

    await db_session.execute(
        delete(Patient).where(
            Patient.user_id == user_id
        )
    )

    await db_session.commit()

    response = await client.get(
        "/api/v1/patients/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 404


# ============================================================
# PUT /patients/me
# ============================================================


@pytest.mark.asyncio
async def test_update_my_patient_profile(client):
    token, patient = await create_patient(
        client,
        "patient-update@test.com",
        "Patient Update Test",
    )

    response = await client.put(
        "/api/v1/patients/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "blood_group": "A+",
            "weight_kg": 75.5,
            "city": "Mumbai",
            "state": "Maharashtra",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["message"] == "Patient profile updated successfully"
    assert body["data"]["id"] == patient["id"]
    assert body["data"]["blood_group"] == "A+"
    assert body["data"]["weight_kg"] == 75.5
    assert body["data"]["city"] == "Mumbai"
    assert body["data"]["state"] == "Maharashtra"


@pytest.mark.asyncio
async def test_update_my_patient_profile_without_token(client):
    response = await client.put(
        "/api/v1/patients/me",
        json={
            "blood_group": "O+",
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_creates_missing_patient_profile(
    client,
    db_session,
):
    await register_user(
        client,
        "create-profile@test.com",
        full_name="Create Profile Patient",
        role="patient",
    )

    token = await login_user(
        client,
        "create-profile@test.com",
    )

    me_response = await client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert me_response.status_code == 200

    user_id = me_response.json()["data"]["id"]

    await db_session.execute(
        delete(Patient).where(
            Patient.user_id == user_id
        )
    )

    await db_session.commit()

    response = await client.put(
        "/api/v1/patients/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "blood_group": "B+",
            "city": "Noida",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["message"] == "Patient profile updated successfully"
    assert body["data"]["blood_group"] == "B+"
    assert body["data"]["city"] == "Noida"
    assert body["data"]["user_id"] == user_id


@pytest.mark.asyncio
async def test_update_patient_profile_with_multiple_fields(client):
    token, patient = await create_patient(
        client,
        "coverage-update@test.com",
        "Coverage Update Test",
    )

    response = await client.put(
        "/api/v1/patients/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "blood_group": "AB+",
            "weight_kg": 80.5,
            "height_cm": 180.0,
            "city": "Noida",
            "state": "Uttar Pradesh",
            "pincode": "201301",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["message"] == "Patient profile updated successfully"
    assert body["data"]["id"] == patient["id"]
    assert body["data"]["blood_group"] == "AB+"
    assert body["data"]["weight_kg"] == 80.5
    assert body["data"]["height_cm"] == 180.0
    assert body["data"]["city"] == "Noida"
    assert body["data"]["state"] == "Uttar Pradesh"
    assert body["data"]["pincode"] == "201301"


# ============================================================
# GET /patients/{patient_id}
# ============================================================


@pytest.mark.asyncio
async def test_get_patient_by_id(client):
    token, patient = await create_patient(
        client,
        "patient-by-id@test.com",
        "Patient By ID Test",
    )

    response = await client.get(
        f"/api/v1/patients/{patient['id']}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["data"]["id"] == patient["id"]
    assert body["data"]["user_id"] == patient["user_id"]


@pytest.mark.asyncio
async def test_patient_cannot_view_another_patient(client):
    token_one, _ = await create_patient(
        client,
        "patient-one@test.com",
        "Patient One",
    )

    _, patient_two = await create_patient(
        client,
        "patient-two@test.com",
        "Patient Two",
    )

    response = await client.get(
        f"/api/v1/patients/{patient_two['id']}",
        headers={
            "Authorization": f"Bearer {token_one}",
        },
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_patient_not_found(client):
    token, _ = await create_patient(
        client,
        "patient-not-found@test.com",
        "Patient Not Found Test",
    )

    response = await client.get(
        "/api/v1/patients/non-existent-patient-id",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_patient_by_id_without_token(client):
    response = await client.get(
        "/api/v1/patients/some-patient-id",
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_doctor_can_view_patient(client):
    _, patient = await create_patient(
        client,
        "doctor-patient@test.com",
        "Doctor Patient",
    )

    await register_user(
        client,
        "doctor@test.com",
        full_name="Test Doctor",
        role="doctor",
    )

    doctor_token = await login_user(
        client,
        "doctor@test.com",
    )

    response = await client.get(
        f"/api/v1/patients/{patient['id']}",
        headers={
            "Authorization": f"Bearer {doctor_token}",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["data"]["id"] == patient["id"]
    assert body["data"]["user_id"] == patient["user_id"]


@pytest.mark.asyncio
async def test_doctor_can_view_patient_profile_response(client):
    _, patient = await create_patient(
        client,
        "coverage-doctor-patient@test.com",
        "Coverage Doctor Patient",
    )

    await register_user(
        client,
        "coverage-doctor@test.com",
        full_name="Coverage Doctor",
        role="doctor",
    )

    doctor_token = await login_user(
        client,
        "coverage-doctor@test.com",
    )

    response = await client.get(
        f"/api/v1/patients/{patient['id']}",
        headers={
            "Authorization": f"Bearer {doctor_token}",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert "data" in body
    assert body["data"]["id"] == patient["id"]
    assert body["data"]["user_id"] == patient["user_id"]


# ============================================================
# GET /patients/ - Admin
# ============================================================


@pytest.mark.asyncio
async def test_list_patients_requires_admin(client):
    token, _ = await create_patient(
        client,
        "patient-list-forbidden@test.com",
        "Patient List Forbidden",
    )

    response = await client.get(
        "/api/v1/patients/",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_list_patients(client):
    await create_patient(
        client,
        "admin-list-patient@test.com",
        "Admin List Patient",
    )

    await register_user(
        client,
        "hospital-admin@test.com",
        full_name="Hospital Admin",
        role="hospital_admin",
    )

    admin_token = await login_user(
        client,
        "hospital-admin@test.com",
    )

    response = await client.get(
        "/api/v1/patients/",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert "data" in body
    assert "pagination" in body
    assert body["pagination"]["total"] >= 1


@pytest.mark.asyncio
async def test_admin_can_filter_patients_by_city(client):
    await create_patient(
        client,
        "delhi-patient@test.com",
        "Delhi Patient",
    )

    await register_user(
        client,
        "admin-city@test.com",
        full_name="City Admin",
        role="hospital_admin",
    )

    admin_token = await login_user(
        client,
        "admin-city@test.com",
    )

    response = await client.get(
        "/api/v1/patients/?city=Delhi",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["pagination"]["total"] >= 1

    for patient in body["data"]:
        assert patient["city"] == "Delhi"


@pytest.mark.asyncio
async def test_admin_can_filter_patients_by_blood_group(client):
    await create_patient(
        client,
        "blood-group-patient@test.com",
        "Blood Group Patient",
    )

    await register_user(
        client,
        "admin-blood@test.com",
        full_name="Blood Group Admin",
        role="hospital_admin",
    )

    admin_token = await login_user(
        client,
        "admin-blood@test.com",
    )

    response = await client.get(
        "/api/v1/patients/?blood_group=O%2B",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["pagination"]["total"] >= 1

    for patient in body["data"]:
        assert patient["blood_group"] == "O+"


@pytest.mark.asyncio
async def test_admin_patient_pagination(client):
    await create_patient(
        client,
        "pagination-patient@test.com",
        "Pagination Patient",
    )

    await register_user(
        client,
        "pagination-admin@test.com",
        full_name="Pagination Admin",
        role="hospital_admin",
    )

    admin_token = await login_user(
        client,
        "pagination-admin@test.com",
    )

    response = await client.get(
        "/api/v1/patients/?page=1&per_page=1",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["pagination"]["page"] == 1
    assert body["pagination"]["per_page"] == 1
    assert len(body["data"]) <= 1


@pytest.mark.asyncio
async def test_admin_list_patients_with_all_filters(client):
    await create_patient(
        client,
        "coverage-list@test.com",
        "Coverage List Patient",
    )

    await register_user(
        client,
        "coverage-admin@test.com",
        full_name="Coverage Admin",
        role="hospital_admin",
    )

    admin_token = await login_user(
        client,
        "coverage-admin@test.com",
    )

    response = await client.get(
        "/api/v1/patients/?page=1&per_page=20&city=Delhi&blood_group=O%2B",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert "data" in body
    assert "pagination" in body
    assert body["pagination"]["page"] == 1
    assert body["pagination"]["per_page"] == 20
    assert body["pagination"]["total"] >= 0
    assert body["pagination"]["total_pages"] >= 0
    assert body["pagination"]["has_next"] is False
    assert body["pagination"]["has_prev"] is False


@pytest.mark.asyncio
async def test_admin_list_patients_second_page(client):
    await create_patient(
        client,
        "coverage-page@test.com",
        "Coverage Page Patient",
    )

    await register_user(
        client,
        "coverage-page-admin@test.com",
        full_name="Coverage Page Admin",
        role="hospital_admin",
    )

    admin_token = await login_user(
        client,
        "coverage-page-admin@test.com",
    )

    response = await client.get(
        "/api/v1/patients/?page=2&per_page=1",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["pagination"]["page"] == 2
    assert body["pagination"]["per_page"] == 1
    assert body["pagination"]["has_prev"] is True


@pytest.mark.asyncio
async def test_admin_list_patients_empty_result(client):
    await register_user(
        client,
        "empty-result-admin@test.com",
        full_name="Empty Result Admin",
        role="hospital_admin",
    )

    admin_token = await login_user(
        client,
        "empty-result-admin@test.com",
    )

    response = await client.get(
        "/api/v1/patients/?city=DefinitelyNonExistingCity999",
        headers={
            "Authorization": f"Bearer {admin_token}",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert "data" in body
    assert "pagination" in body

    assert body["data"] == []
    assert body["pagination"]["total"] == 0
    assert body["pagination"]["total_pages"] == 0
    assert body["pagination"]["has_next"] is False
    assert body["pagination"]["has_prev"] is False