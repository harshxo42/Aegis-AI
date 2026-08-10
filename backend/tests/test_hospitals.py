"""
Aegis AI – Hospital API Tests

Tests for:
- Hospital listing
- Hospital search/filtering
- Hospital creation
- Hospital details
- Hospital updates
- Bed availability
- Hospital deletion
- Distance calculation
- Error handling
"""

import pytest

from app.api.v1.hospitals import (
    haversine_distance,
    list_hospitals,
    create_hospital,
    get_hospital,
    update_hospital,
    update_bed_availability,
    delete_hospital,
)

from app.core.exceptions import NotFoundException

from app.models.hospital import Hospital, HospitalType
from app.models.user import User, UserRole

from app.schemas.hospital import (
    HospitalCreate,
    HospitalUpdate,
    BedAvailabilityUpdate,
)


# ============================================================
# HELPERS
# ============================================================


async def create_admin(db_session):
    """Create a hospital admin user for protected endpoint tests."""

    user = User(
        email="hospital-admin@example.com",
        password_hash="hashed-password",
        full_name="Hospital Admin",
        role=UserRole.HOSPITAL_ADMIN,
        is_active=True,
        is_verified=True,
    )

    db_session.add(user)
    await db_session.flush()

    return user


async def create_government_admin(db_session):
    """Create a government admin user for protected endpoint tests."""

    user = User(
        email="government-admin@example.com",
        password_hash="hashed-password",
        full_name="Government Admin",
        role=UserRole.GOVERNMENT_ADMIN,
        is_active=True,
        is_verified=True,
    )

    db_session.add(user)
    await db_session.flush()

    return user


def hospital_data(
    name="Apollo Hospital",
    city="New Delhi",
    state="Delhi",
    total_beds=100,
    icu_beds=20,
):
    """Return valid hospital creation data."""

    return HospitalCreate(
        name=name,
        registration_number=None,
        hospital_type="private",
        description="A modern emergency hospital",
        established_year=2000,
        phone="9876543210",
        email="hospital@example.com",
        website="https://example.com",
        address="123 Main Road",
        city=city,
        state=state,
        pincode="110001",
        latitude=28.6139,
        longitude=77.2090,
        total_beds=total_beds,
        icu_beds=icu_beds,
        has_emergency=True,
        has_ambulance=True,
        has_pharmacy=True,
        has_lab=True,
        has_blood_bank=True,
    )


async def create_test_hospital(
    db_session,
    name="Apollo Hospital",
    city="New Delhi",
    state="Delhi",
    total_beds=100,
    icu_beds=20,
):
    """Create a hospital directly in the database."""

    hospital = Hospital(
        name=name,
        registration_number=None,
        hospital_type=HospitalType.PRIVATE,
        description="Test hospital",
        established_year=2000,
        phone="9876543210",
        email="hospital@example.com",
        website="https://example.com",
        address="123 Main Road",
        city=city,
        state=state,
        pincode="110001",
        latitude=28.6139,
        longitude=77.2090,
        total_beds=total_beds,
        available_beds=total_beds,
        icu_beds=icu_beds,
        icu_available=icu_beds,
        ventilators=10,
        ventilators_available=10,
        has_emergency=True,
        has_ambulance=True,
        has_pharmacy=True,
        has_lab=True,
        has_blood_bank=True,
        rating=4.5,
        total_reviews=100,
        is_verified=True,
        is_active=True,
    )

    db_session.add(hospital)
    await db_session.flush()

    return hospital


# ============================================================
# HAVERSINE DISTANCE TESTS
# ============================================================


def test_haversine_distance_same_location():
    """Same coordinates should return zero distance."""

    distance = haversine_distance(
        28.6139,
        77.2090,
        28.6139,
        77.2090,
    )

    assert distance == pytest.approx(0.0)


def test_haversine_distance_delhi_to_nearby_location():
    """Distance calculation should return a positive value."""

    distance = haversine_distance(
        28.6139,
        77.2090,
        28.7041,
        77.1025,
    )

    assert distance > 0
    assert distance < 20


# ============================================================
# LIST HOSPITALS
# ============================================================


@pytest.mark.asyncio
async def test_list_hospitals_empty(db_session):
    """Listing hospitals should work when database is empty."""

    response = await list_hospitals(
        page=1,
        per_page=20,
        search=None,
        city=None,
        state=None,
        hospital_type=None,
        has_emergency=None,
        has_beds=None,
        lat=None,
        lng=None,
        radius_km=50,
        db=db_session,
    )

    assert response.data == []
    assert response.pagination.total == 0
    assert response.pagination.page == 1
    assert response.pagination.has_next is False
    assert response.pagination.has_prev is False


@pytest.mark.asyncio
async def test_list_hospitals_success(db_session):
    """Hospitals should be returned from the listing endpoint."""

    hospital = await create_test_hospital(db_session)

    response = await list_hospitals(
        page=1,
        per_page=20,
        search=None,
        city=None,
        state=None,
        hospital_type=None,
        has_emergency=None,
        has_beds=None,
        lat=None,
        lng=None,
        radius_km=50,
        db=db_session,
    )

    assert response.pagination.total == 1
    assert len(response.data) == 1
    assert response.data[0]["id"] == hospital.id
    assert response.data[0]["name"] == hospital.name


@pytest.mark.asyncio
async def test_list_hospitals_search_by_name(db_session):
    """Hospital name search should work."""

    await create_test_hospital(
        db_session,
        name="Apollo Emergency Hospital",
    )

    await create_test_hospital(
        db_session,
        name="City Care Hospital",
    )

    response = await list_hospitals(
        page=1,
        per_page=20,
        search="Apollo",
        city=None,
        state=None,
        hospital_type=None,
        has_emergency=None,
        has_beds=None,
        lat=None,
        lng=None,
        radius_km=50,
        db=db_session,
    )

    assert response.pagination.total == 1
    assert response.data[0]["name"] == "Apollo Emergency Hospital"


@pytest.mark.asyncio
async def test_list_hospitals_filter_by_city(db_session):
    """City filtering should work."""

    await create_test_hospital(
        db_session,
        name="Delhi Hospital",
        city="New Delhi",
    )

    await create_test_hospital(
        db_session,
        name="Mumbai Hospital",
        city="Mumbai",
        state="Maharashtra",
    )

    response = await list_hospitals(
        page=1,
        per_page=20,
        search=None,
        city="Mumbai",
        state=None,
        hospital_type=None,
        has_emergency=None,
        has_beds=None,
        lat=None,
        lng=None,
        radius_km=50,
        db=db_session,
    )

    assert response.pagination.total == 1
    assert response.data[0]["city"] == "Mumbai"


@pytest.mark.asyncio
async def test_list_hospitals_filter_by_state(db_session):
    """State filtering should work."""

    await create_test_hospital(
        db_session,
        name="Delhi Hospital",
        city="New Delhi",
        state="Delhi",
    )

    await create_test_hospital(
        db_session,
        name="Mumbai Hospital",
        city="Mumbai",
        state="Maharashtra",
    )

    response = await list_hospitals(
        page=1,
        per_page=20,
        search=None,
        city=None,
        state="Delhi",
        hospital_type=None,
        has_emergency=None,
        has_beds=None,
        lat=None,
        lng=None,
        radius_km=50,
        db=db_session,
    )

    assert response.pagination.total == 1
    assert response.data[0]["state"] == "Delhi"


@pytest.mark.asyncio
async def test_list_hospitals_filter_emergency(db_session):
    """Emergency facility filter should work."""

    hospital = await create_test_hospital(db_session)

    response = await list_hospitals(
        page=1,
        per_page=20,
        search=None,
        city=None,
        state=None,
        hospital_type=None,
        has_emergency=True,
        has_beds=None,
        lat=None,
        lng=None,
        radius_km=50,
        db=db_session,
    )

    assert response.pagination.total == 1
    assert response.data[0]["id"] == hospital.id
    assert response.data[0]["has_emergency"] is True


@pytest.mark.asyncio
async def test_list_hospitals_filter_available_beds(db_session):
    """has_beds=True should return hospitals with available beds."""

    await create_test_hospital(
        db_session,
        name="Available Hospital",
        total_beds=100,
    )

    no_bed_hospital = await create_test_hospital(
        db_session,
        name="Full Hospital",
        total_beds=50,
    )

    no_bed_hospital.available_beds = 0
    await db_session.flush()

    response = await list_hospitals(
        page=1,
        per_page=20,
        search=None,
        city=None,
        state=None,
        hospital_type=None,
        has_emergency=None,
        has_beds=True,
        lat=None,
        lng=None,
        radius_km=50,
        db=db_session,
    )

    assert response.pagination.total == 1
    assert response.data[0]["name"] == "Available Hospital"


@pytest.mark.asyncio
async def test_list_hospitals_distance_calculation(db_session):
    """Distance should be calculated when latitude and longitude are supplied."""

    hospital = await create_test_hospital(db_session)

    response = await list_hospitals(
        page=1,
        per_page=20,
        search=None,
        city=None,
        state=None,
        hospital_type=None,
        has_emergency=None,
        has_beds=None,
        lat=28.6139,
        lng=77.2090,
        radius_km=50,
        db=db_session,
    )

    assert response.pagination.total == 1
    assert response.data[0]["id"] == hospital.id
    assert response.data[0]["distance_km"] == pytest.approx(0.0)


@pytest.mark.asyncio
async def test_list_hospitals_pagination(db_session):
    """Pagination metadata should be correct."""

    for index in range(5):
        await create_test_hospital(
            db_session,
            name=f"Hospital {index}",
        )

    response = await list_hospitals(
        page=1,
        per_page=2,
        search=None,
        city=None,
        state=None,
        hospital_type=None,
        has_emergency=None,
        has_beds=None,
        lat=None,
        lng=None,
        radius_km=50,
        db=db_session,
    )

    assert response.pagination.total == 5
    assert response.pagination.page == 1
    assert response.pagination.per_page == 2
    assert response.pagination.total_pages == 3
    assert response.pagination.has_next is True
    assert response.pagination.has_prev is False
    assert len(response.data) == 2


# ============================================================
# CREATE HOSPITAL
# ============================================================


@pytest.mark.asyncio
async def test_create_hospital_success(db_session):
    """Admin should be able to create a hospital."""

    admin = await create_admin(db_session)

    data = hospital_data(
        name="New Emergency Hospital",
        total_beds=200,
        icu_beds=40,
    )

    response = await create_hospital(
        data=data,
        current_user=admin,
        db=db_session,
    )

    assert response.message == "Hospital created successfully"
    assert response.data["name"] == "New Emergency Hospital"
    assert response.data["total_beds"] == 200
    assert response.data["available_beds"] == 200
    assert response.data["icu_beds"] == 40
    assert response.data["icu_available"] == 40


@pytest.mark.asyncio
async def test_create_hospital_default_bed_values(db_session):
    """New hospital should initialize available beds from capacity."""

    admin = await create_admin(db_session)

    data = hospital_data(
        name="Small Hospital",
        total_beds=50,
        icu_beds=10,
    )

    response = await create_hospital(
        data=data,
        current_user=admin,
        db=db_session,
    )

    assert response.data["total_beds"] == 50
    assert response.data["available_beds"] == 50
    assert response.data["icu_beds"] == 10
    assert response.data["icu_available"] == 10


# ============================================================
# GET HOSPITAL
# ============================================================


@pytest.mark.asyncio
async def test_get_hospital_success(db_session):
    """Hospital details should be returned for a valid ID."""

    hospital = await create_test_hospital(db_session)

    response = await get_hospital(
        hospital_id=hospital.id,
        db=db_session,
    )

    assert response.data["id"] == hospital.id
    assert response.data["name"] == hospital.name
    assert response.data["city"] == hospital.city
    assert response.data["total_beds"] == hospital.total_beds


@pytest.mark.asyncio
async def test_get_hospital_not_found(db_session):
    """Invalid hospital ID should raise NotFoundException."""

    with pytest.raises(NotFoundException):
        await get_hospital(
            hospital_id="non-existent-hospital-id",
            db=db_session,
        )


# ============================================================
# UPDATE HOSPITAL
# ============================================================


@pytest.mark.asyncio
async def test_update_hospital_success(db_session):
    """Admin should be able to update hospital information."""

    admin = await create_admin(db_session)
    hospital = await create_test_hospital(db_session)

    data = HospitalUpdate(
        name="Updated Emergency Hospital",
        phone="9999999999",
        city="Gurugram",
    )

    response = await update_hospital(
        hospital_id=hospital.id,
        data=data,
        current_user=admin,
        db=db_session,
    )

    assert response.message == "Hospital updated successfully"
    assert response.data["name"] == "Updated Emergency Hospital"
    assert response.data["phone"] == "9999999999"
    assert response.data["city"] == "Gurugram"


@pytest.mark.asyncio
async def test_update_hospital_not_found(db_session):
    """Updating a non-existing hospital should fail."""

    admin = await create_admin(db_session)

    data = HospitalUpdate(
        name="Updated Hospital",
    )

    with pytest.raises(NotFoundException):
        await update_hospital(
            hospital_id="non-existent-id",
            data=data,
            current_user=admin,
            db=db_session,
        )


@pytest.mark.asyncio
async def test_update_hospital_partial_update(db_session):
    """Only supplied fields should be updated."""

    admin = await create_admin(db_session)

    hospital = await create_test_hospital(
        db_session,
        name="Original Hospital",
    )

    original_phone = hospital.phone

    data = HospitalUpdate(
        name="Only Name Updated",
    )

    response = await update_hospital(
        hospital_id=hospital.id,
        data=data,
        current_user=admin,
        db=db_session,
    )

    assert response.data["name"] == "Only Name Updated"
    assert response.data["phone"] == original_phone


# ============================================================
# BED AVAILABILITY
# ============================================================


@pytest.mark.asyncio
async def test_update_bed_availability_success(db_session):
    """Hospital admin should be able to update bed availability."""

    admin = await create_admin(db_session)

    hospital = await create_test_hospital(
        db_session,
        total_beds=100,
        icu_beds=20,
    )

    data = BedAvailabilityUpdate(
        available_beds=60,
        icu_available=10,
        ventilators_available=5,
    )

    response = await update_bed_availability(
        hospital_id=hospital.id,
        data=data,
        current_user=admin,
        db=db_session,
    )

    assert response.message == "Bed availability updated"
    assert response.data["available_beds"] == 60
    assert response.data["icu_available"] == 10
    assert response.data["ventilators_available"] == 5


@pytest.mark.asyncio
async def test_update_bed_availability_cannot_exceed_total(
    db_session,
):
    """Available beds should never exceed total capacity."""

    admin = await create_admin(db_session)

    hospital = await create_test_hospital(
        db_session,
        total_beds=100,
        icu_beds=20,
    )

    data = BedAvailabilityUpdate(
        available_beds=999,
        icu_available=999,
        ventilators_available=999,
    )

    response = await update_bed_availability(
        hospital_id=hospital.id,
        data=data,
        current_user=admin,
        db=db_session,
    )

    assert response.data["available_beds"] == hospital.total_beds
    assert response.data["icu_available"] == hospital.icu_beds
    assert (
        response.data["ventilators_available"]
        == hospital.ventilators
    )


@pytest.mark.asyncio
async def test_update_bed_availability_partial(
    db_session,
):
    """Updating only specific bed types should work without affecting others."""
    admin = await create_admin(db_session)
    hospital = await create_test_hospital(
        db_session,
        total_beds=100,
        icu_beds=20,
    )

    data = BedAvailabilityUpdate(
        available_beds=50,
        # icu_available is None
        # ventilators_available is None
    )

    response = await update_bed_availability(
        hospital_id=hospital.id,
        data=data,
        current_user=admin,
        db=db_session,
    )

    assert response.data["available_beds"] == 50
    assert response.data["icu_available"] == hospital.icu_available
    assert response.data["ventilators_available"] == hospital.ventilators_available

@pytest.mark.asyncio
async def test_update_bed_availability_partial_icu_only(
    db_session,
):
    """Updating only ICU beds should not affect others."""
    admin = await create_admin(db_session)
    hospital = await create_test_hospital(
        db_session,
        total_beds=100,
        icu_beds=20,
    )

    data = BedAvailabilityUpdate(
        icu_available=10,
    )

    response = await update_bed_availability(
        hospital_id=hospital.id,
        data=data,
        current_user=admin,
        db=db_session,
    )

    assert response.data["available_beds"] == hospital.available_beds
    assert response.data["icu_available"] == 10
    assert response.data["ventilators_available"] == hospital.ventilators_available

@pytest.mark.asyncio
async def test_update_bed_availability_not_found(db_session):
    """Updating beds for a non-existing hospital should fail."""

    admin = await create_admin(db_session)

    data = BedAvailabilityUpdate(
        available_beds=10,
    )

    with pytest.raises(NotFoundException):
        await update_bed_availability(
            hospital_id="non-existent-id",
            data=data,
            current_user=admin,
            db=db_session,
        )


# ============================================================
# DELETE HOSPITAL
# ============================================================


@pytest.mark.asyncio
async def test_delete_hospital_success(db_session):
    """Admin should be able to soft-delete a hospital."""

    admin = await create_admin(db_session)

    hospital = await create_test_hospital(db_session)

    response = await delete_hospital(
        hospital_id=hospital.id,
        current_user=admin,
        db=db_session,
    )

    assert response.message == "Hospital deleted successfully"
    assert hospital.is_active is False


@pytest.mark.asyncio
async def test_delete_hospital_not_found(db_session):
    """Deleting a non-existing hospital should fail."""

    admin = await create_admin(db_session)

    with pytest.raises(NotFoundException):
        await delete_hospital(
            hospital_id="non-existent-id",
            current_user=admin,
            db=db_session,
        )


@pytest.mark.asyncio
async def test_deleted_hospital_not_returned_in_list(db_session):
    """Soft-deleted hospitals should not appear in active hospital list."""

    admin = await create_admin(db_session)

    hospital = await create_test_hospital(db_session)

    await delete_hospital(
        hospital_id=hospital.id,
        current_user=admin,
        db=db_session,
    )

    response = await list_hospitals(
        page=1,
        per_page=20,
        search=None,
        city=None,
        state=None,
        hospital_type=None,
        has_emergency=None,
        has_beds=None,
        lat=None,
        lng=None,
        radius_km=50,
        db=db_session,
    )

    assert response.pagination.total == 0
    assert response.data == []


# ============================================================
# HOSPITAL TYPE
# ============================================================


@pytest.mark.asyncio
async def test_list_hospitals_filter_by_type(db_session):
    """Hospital type filtering should work."""

    private_hospital = await create_test_hospital(
        db_session,
        name="Private Hospital",
    )

    government_hospital = Hospital(
        name="Government Hospital",
        hospital_type=HospitalType.GOVERNMENT,
        description="Government hospital",
        phone="9876543211",
        address="Government Road",
        city="New Delhi",
        state="Delhi",
        pincode="110002",
        latitude=28.6200,
        longitude=77.2100,
        total_beds=200,
        available_beds=200,
        icu_beds=30,
        icu_available=30,
        ventilators=20,
        ventilators_available=20,
        has_emergency=True,
        is_active=True,
        rating=4.0,
        total_reviews=50,
    )

    db_session.add(government_hospital)
    await db_session.flush()

    response = await list_hospitals(
        page=1,
        per_page=20,
        search=None,
        city=None,
        state=None,
        hospital_type="government",
        has_emergency=None,
        has_beds=None,
        lat=None,
        lng=None,
        radius_km=50,
        db=db_session,
    )

    assert response.pagination.total == 1
    assert response.data[0]["id"] == government_hospital.id
    assert response.data[0]["id"] != private_hospital.id


@pytest.mark.asyncio
async def test_update_bed_availability_partial_payload(db_session):
    """Updating bed availability with partial payload covers None branches."""
    hospital = await create_test_hospital(db_session)
    admin = await create_admin(db_session)
    
    # Provide only available_beds, leaving others None
    data = BedAvailabilityUpdate(
        available_beds=5,
        icu_available=None,
        ventilators_available=None,
    )

    response = await update_bed_availability(
        hospital_id=hospital.id,
        data=data,
        current_user=admin,
        db=db_session,
    )

    assert response.data["available_beds"] == 5
    assert response.data["icu_available"] == hospital.icu_available
    assert response.data["ventilators_available"] == hospital.ventilators_available