"""
Aegis AI – Database Seed Script

Populates the database with sample data for development and testing.
Run with: python -m scripts.seed_data
"""

import asyncio
import os
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.database import async_session_factory, init_db
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.hospital import Hospital, HospitalType
from app.models.department import Department
from app.models.ambulance import Ambulance, AmbulanceType, AmbulanceStatus
from app.models.emergency import EmergencyRequest, EmergencyType, EmergencyStatus
from app.models.notification import Notification, NotificationType


# ── Sample Data ──────────────────────────────────────────────────

HOSPITALS_DATA = [
    {
        "name": "Apollo Emergency Hospital",
        "hospital_type": HospitalType.PRIVATE,
        "phone": "+91-11-2345-6789",
        "email": "emergency@apollo.com",
        "address": "Sarita Vihar, Delhi-Mathura Road",
        "city": "New Delhi",
        "state": "Delhi",
        "pincode": "110076",
        "latitude": 28.5355,
        "longitude": 77.2910,
        "total_beds": 500,
        "available_beds": 120,
        "icu_beds": 50,
        "icu_available": 12,
        "ventilators": 30,
        "ventilators_available": 8,
        "has_emergency": True,
        "has_ambulance": True,
        "has_pharmacy": True,
        "has_lab": True,
        "has_blood_bank": True,
        "rating": 4.5,
        "is_verified": True,
        "description": "Multi-specialty tertiary care hospital with 24/7 emergency services.",
    },
    {
        "name": "AIIMS Trauma Centre",
        "hospital_type": HospitalType.GOVERNMENT,
        "phone": "+91-11-2658-8500",
        "email": "trauma@aiims.edu",
        "address": "Ansari Nagar, East Aurobindo Marg",
        "city": "New Delhi",
        "state": "Delhi",
        "pincode": "110029",
        "latitude": 28.5672,
        "longitude": 77.2100,
        "total_beds": 800,
        "available_beds": 200,
        "icu_beds": 80,
        "icu_available": 25,
        "ventilators": 50,
        "ventilators_available": 15,
        "has_emergency": True,
        "has_ambulance": True,
        "has_pharmacy": True,
        "has_lab": True,
        "has_blood_bank": True,
        "rating": 4.8,
        "is_verified": True,
        "description": "India's premier government hospital with world-class trauma care.",
    },
    {
        "name": "Fortis Hospital",
        "hospital_type": HospitalType.PRIVATE,
        "phone": "+91-124-492-1021",
        "email": "info@fortis.com",
        "address": "Sector 62, Phase VIII, Mohali",
        "city": "Mohali",
        "state": "Punjab",
        "pincode": "160062",
        "latitude": 30.7046,
        "longitude": 76.7179,
        "total_beds": 350,
        "available_beds": 80,
        "icu_beds": 40,
        "icu_available": 10,
        "ventilators": 20,
        "ventilators_available": 5,
        "has_emergency": True,
        "has_ambulance": True,
        "has_pharmacy": True,
        "has_lab": True,
        "has_blood_bank": False,
        "rating": 4.3,
        "is_verified": True,
        "description": "Multi-specialty hospital with advanced cardiac and neuro care.",
    },
    {
        "name": "Max Super Speciality Hospital",
        "hospital_type": HospitalType.PRIVATE,
        "phone": "+91-11-2651-5050",
        "email": "info@maxhealthcare.com",
        "address": "1, Press Enclave Road, Saket",
        "city": "New Delhi",
        "state": "Delhi",
        "pincode": "110017",
        "latitude": 28.5245,
        "longitude": 77.2066,
        "total_beds": 400,
        "available_beds": 95,
        "icu_beds": 45,
        "icu_available": 15,
        "ventilators": 25,
        "ventilators_available": 7,
        "has_emergency": True,
        "has_ambulance": True,
        "has_pharmacy": True,
        "has_lab": True,
        "has_blood_bank": True,
        "rating": 4.6,
        "is_verified": True,
        "description": "Leading super speciality hospital with cutting-edge technology.",
    },
    {
        "name": "Safdarjung Hospital",
        "hospital_type": HospitalType.GOVERNMENT,
        "phone": "+91-11-2616-4033",
        "email": "admin@safdarjung.gov.in",
        "address": "Ring Road, Near AIIMS",
        "city": "New Delhi",
        "state": "Delhi",
        "pincode": "110029",
        "latitude": 28.5685,
        "longitude": 77.2065,
        "total_beds": 1600,
        "available_beds": 400,
        "icu_beds": 100,
        "icu_available": 30,
        "ventilators": 60,
        "ventilators_available": 20,
        "has_emergency": True,
        "has_ambulance": True,
        "has_pharmacy": True,
        "has_lab": True,
        "has_blood_bank": True,
        "rating": 4.1,
        "is_verified": True,
        "description": "One of the largest government hospitals in India.",
    },
]

SPECIALIZATIONS = [
    "Cardiology", "Neurology", "Orthopedics", "Emergency Medicine",
    "Pulmonology", "General Surgery", "Pediatrics", "Oncology",
]

DEPARTMENT_NAMES = [
    "Emergency", "Cardiology", "Neurology", "Orthopedics",
    "General Medicine", "Surgery", "Pediatrics", "ICU",
]


from sqlalchemy import select, func


async def get_or_create_user(
    db, email: str, password: str, full_name: str, role: UserRole, phone: str = None
) -> tuple[User, bool]:
    """Retrieve existing user or create a new one."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        return user, False

    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        phone=phone,
        role=role,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    await db.flush()
    return user, True


async def seed():
    """Seed the database with sample data (idempotent - safe to run multiple times)."""
    print("[SEED] Starting database seeding...")

    await init_db()

    async with async_session_factory() as db:
        try:
            # ── 1. Create Users ──────────────────────────────────
            print("  Seeding users...")

            # Admin
            admin, _ = await get_or_create_user(
                db,
                email="admin@aegisai.com",
                password="Admin@123",
                full_name="System Administrator",
                phone="+91-9876543210",
                role=UserRole.GOVERNMENT_ADMIN,
            )

            # Hospital Admin
            hospital_admin, _ = await get_or_create_user(
                db,
                email="hospital@aegisai.com",
                password="Hospital@123",
                full_name="Dr. Priya Sharma",
                phone="+91-9876543211",
                role=UserRole.HOSPITAL_ADMIN,
            )

            # Patients
            patient_users = []
            patient_data = [
                ("patient@aegisai.com", "Rahul Kumar", "+91-9876543212"),
                ("arjun@aegisai.com", "Arjun Patel", "+91-9876543213"),
                ("sneha@aegisai.com", "Sneha Reddy", "+91-9876543214"),
            ]
            for email, name, phone in patient_data:
                u, _ = await get_or_create_user(
                    db,
                    email=email,
                    password="Patient@123",
                    full_name=name,
                    phone=phone,
                    role=UserRole.PATIENT,
                )
                patient_users.append(u)

            # Doctors
            doctor_users = []
            doctor_data = [
                ("dr.mehta@aegisai.com", "Dr. Vikram Mehta"),
                ("dr.gupta@aegisai.com", "Dr. Anita Gupta"),
                ("dr.singh@aegisai.com", "Dr. Rajesh Singh"),
            ]
            for email, name in doctor_data:
                u, _ = await get_or_create_user(
                    db,
                    email=email,
                    password="Doctor@123",
                    full_name=name,
                    role=UserRole.DOCTOR,
                )
                doctor_users.append(u)

            # Ambulance Drivers
            driver_users = []
            driver_data = [
                ("driver1@aegisai.com", "Suresh Kumar"),
                ("driver2@aegisai.com", "Manoj Yadav"),
            ]
            for email, name in driver_data:
                u, _ = await get_or_create_user(
                    db,
                    email=email,
                    password="Driver@123",
                    full_name=name,
                    role=UserRole.AMBULANCE_DRIVER,
                )
                driver_users.append(u)

            await db.flush()

            # ── 2. Create Patient Profiles ───────────────────────
            print("  Seeding patient profiles...")
            patients = []
            blood_groups = ["A+", "B+", "O+", "AB+", "A-", "B-"]
            for i, user in enumerate(patient_users):
                res = await db.execute(select(Patient).where(Patient.user_id == user.id))
                patient = res.scalar_one_or_none()
                if not patient:
                    patient = Patient(
                        user_id=user.id,
                        blood_group=blood_groups[i % len(blood_groups)],
                        gender="Male" if i % 2 == 0 else "Female",
                        date_of_birth=f"199{i}-0{i+1}-1{i+5}",
                        city="New Delhi",
                        state="Delhi",
                        location_lat=28.5355 + random.uniform(-0.05, 0.05),
                        location_lng=77.2910 + random.uniform(-0.05, 0.05),
                        emergency_contact_name="Emergency Contact",
                        emergency_contact_phone="+91-9999999999",
                        emergency_contact_relation="Family",
                    )
                    db.add(patient)
                    await db.flush()
                patients.append(patient)

            # ── 3. Create Hospitals ──────────────────────────────
            print("  Seeding hospitals...")
            hospitals = []
            for h_data in HOSPITALS_DATA:
                res = await db.execute(
                    select(Hospital).where(Hospital.name == h_data["name"])
                )
                hospital = res.scalar_one_or_none()
                if not hospital:
                    hospital = Hospital(**h_data)
                    db.add(hospital)
                    await db.flush()
                hospitals.append(hospital)

            # ── 4. Create Departments ────────────────────────────
            print("  Seeding departments...")
            for hospital in hospitals:
                for dept_name in DEPARTMENT_NAMES[:5]:
                    res = await db.execute(
                        select(Department).where(
                            Department.hospital_id == hospital.id,
                            Department.name == dept_name,
                        )
                    )
                    if not res.scalar_one_or_none():
                        dept = Department(
                            hospital_id=hospital.id,
                            name=dept_name,
                            capacity=random.randint(20, 60),
                            current_patients=random.randint(5, 30),
                            floor=random.randint(1, 5),
                        )
                        db.add(dept)
            await db.flush()

            # ── 5. Create Doctor Profiles ────────────────────────
            print("  Seeding doctor profiles...")
            for i, user in enumerate(doctor_users):
                res = await db.execute(select(Doctor).where(Doctor.user_id == user.id))
                if not res.scalar_one_or_none():
                    doctor = Doctor(
                        user_id=user.id,
                        hospital_id=hospitals[i % len(hospitals)].id,
                        specialization=SPECIALIZATIONS[i % len(SPECIALIZATIONS)],
                        license_number=f"DL{10000 + i}",
                        experience_years=random.randint(5, 25),
                        is_available=True,
                        consultation_fee=random.choice([500, 800, 1000, 1500]),
                        rating=round(random.uniform(3.5, 5.0), 1),
                        about=f"Experienced {SPECIALIZATIONS[i % len(SPECIALIZATIONS)]} specialist with {5 + i * 3} years of practice.",
                    )
                    db.add(doctor)
            await db.flush()

            # ── 6. Create Ambulances ─────────────────────────────
            print("  Seeding ambulances...")
            ambulance_types = [AmbulanceType.BASIC, AmbulanceType.ADVANCED, AmbulanceType.ICU]
            for i, hospital in enumerate(hospitals[:3]):
                for j in range(2):
                    v_num = f"DL-{10 + i}{chr(65 + j)}-{1000 + i * 10 + j}"
                    res = await db.execute(
                        select(Ambulance).where(Ambulance.vehicle_number == v_num)
                    )
                    if not res.scalar_one_or_none():
                        amb = Ambulance(
                            vehicle_number=v_num,
                            hospital_id=hospital.id,
                            driver_id=driver_users[j % len(driver_users)].id if j < len(driver_users) else None,
                            ambulance_type=ambulance_types[j % len(ambulance_types)],
                            status=AmbulanceStatus.AVAILABLE,
                            latitude=hospital.latitude + random.uniform(-0.01, 0.01) if hospital.latitude else 28.5355,
                            longitude=hospital.longitude + random.uniform(-0.01, 0.01) if hospital.longitude else 77.2910,
                            has_oxygen=True,
                            has_defibrillator=j % 2 == 0,
                            has_ventilator=j == 0,
                        )
                        db.add(amb)
            await db.flush()

            # ── 7. Create Sample Emergencies ─────────────────────
            print("  Seeding sample emergencies...")
            em_count_res = await db.execute(select(func.count(EmergencyRequest.id)))
            em_count = em_count_res.scalar() or 0
            if em_count == 0 and patients and hospitals:
                emergency_types = list(EmergencyType)
                for i, patient in enumerate(patients):
                    emergency = EmergencyRequest(
                        patient_id=patient.id,
                        hospital_id=hospitals[i % len(hospitals)].id,
                        emergency_type=emergency_types[i % len(emergency_types)],
                        severity=random.randint(2, 5),
                        description="Emergency case requiring immediate attention.",
                        location_lat=patient.location_lat or 28.5355,
                        location_lng=patient.location_lng or 77.2910,
                        location_address="Sample Address, New Delhi",
                        status=EmergencyStatus.RESOLVED,
                        requested_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30)),
                        resolved_at=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 1)),
                    )
                    db.add(emergency)

                # One active emergency
                active_emergency = EmergencyRequest(
                    patient_id=patients[0].id,
                    hospital_id=hospitals[0].id if hospitals else None,
                    emergency_type=EmergencyType.CARDIAC,
                    severity=4,
                    description="Chest pain and difficulty breathing. Need immediate help.",
                    location_lat=28.5400,
                    location_lng=77.2850,
                    location_address="Sector 15, Noida, UP",
                    status=EmergencyStatus.REQUESTED,
                    requested_at=datetime.now(timezone.utc),
                )
                db.add(active_emergency)
                await db.flush()

            # ── 8. Create Notifications ──────────────────────────
            print("  Seeding notifications...")
            notif_count_res = await db.execute(select(func.count(Notification.id)))
            notif_count = notif_count_res.scalar() or 0
            if notif_count == 0:
                for user in [admin, hospital_admin, *patient_users[:2]]:
                    for j in range(3):
                        notif = Notification(
                            user_id=user.id,
                            title=f"System Notification {j + 1}",
                            message=f"This is a sample notification message #{j + 1}.",
                            notification_type=NotificationType.INFO,
                            is_read=j > 0,
                        )
                        db.add(notif)
                await db.flush()

            await db.commit()
            print("\n[OK] Database seeded successfully (idempotent)!")
            print("\nDemo Login Credentials:")
            print("  +-------------------------------------------------------------+")
            print("  | Role              | Email                   | Password      |")
            print("  +-------------------------------------------------------------+")
            print("  | Gov Admin         | admin@aegisai.com       | Admin@123     |")
            print("  | Hospital Admin    | hospital@aegisai.com    | Hospital@123  |")
            print("  | Patient           | patient@aegisai.com     | Patient@123   |")
            print("  | Doctor            | dr.mehta@aegisai.com    | Doctor@123    |")
            print("  | Driver            | driver1@aegisai.com     | Driver@123    |")
            print("  +-------------------------------------------------------------+")

        except Exception as e:
            await db.rollback()
            print(f"\n[ERROR] Seeding failed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(seed())

