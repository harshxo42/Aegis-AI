"""
Aegis AI – Database Seed Script

Populates the database with sample data for development and testing.
Run with: python -m scripts.seed_data
"""

import asyncio
import random
from datetime import datetime, timedelta, timezone

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


async def seed():
    """Seed the database with sample data."""
    print("🌱 Seeding database...")

    await init_db()

    async with async_session_factory() as db:
        try:
            # ── Create Users ─────────────────────────────────────
            print("  Creating users...")

            # Admin
            admin = User(
                email="admin@aegisai.com",
                password_hash=hash_password("Admin@123"),
                full_name="System Administrator",
                phone="+91-9876543210",
                role=UserRole.GOVERNMENT_ADMIN,
                is_active=True,
                is_verified=True,
            )
            db.add(admin)

            # Hospital Admin
            hospital_admin = User(
                email="hospital@aegisai.com",
                password_hash=hash_password("Hospital@123"),
                full_name="Dr. Priya Sharma",
                phone="+91-9876543211",
                role=UserRole.HOSPITAL_ADMIN,
                is_active=True,
                is_verified=True,
            )
            db.add(hospital_admin)

            # Patients
            patient_users = []
            patient_data = [
                ("patient@aegisai.com", "Rahul Kumar", "+91-9876543212"),
                ("arjun@aegisai.com", "Arjun Patel", "+91-9876543213"),
                ("sneha@aegisai.com", "Sneha Reddy", "+91-9876543214"),
            ]
            for email, name, phone in patient_data:
                user = User(
                    email=email,
                    password_hash=hash_password("Patient@123"),
                    full_name=name,
                    phone=phone,
                    role=UserRole.PATIENT,
                    is_active=True,
                    is_verified=True,
                )
                db.add(user)
                patient_users.append(user)

            # Doctors
            doctor_users = []
            doctor_data = [
                ("dr.mehta@aegisai.com", "Dr. Vikram Mehta"),
                ("dr.gupta@aegisai.com", "Dr. Anita Gupta"),
                ("dr.singh@aegisai.com", "Dr. Rajesh Singh"),
            ]
            for email, name in doctor_data:
                user = User(
                    email=email,
                    password_hash=hash_password("Doctor@123"),
                    full_name=name,
                    role=UserRole.DOCTOR,
                    is_active=True,
                    is_verified=True,
                )
                db.add(user)
                doctor_users.append(user)

            # Ambulance Drivers
            driver_users = []
            driver_data = [
                ("driver1@aegisai.com", "Suresh Kumar"),
                ("driver2@aegisai.com", "Manoj Yadav"),
            ]
            for email, name in driver_data:
                user = User(
                    email=email,
                    password_hash=hash_password("Driver@123"),
                    full_name=name,
                    role=UserRole.AMBULANCE_DRIVER,
                    is_active=True,
                    is_verified=True,
                )
                db.add(user)
                driver_users.append(user)

            await db.flush()

            # ── Create Patient Profiles ──────────────────────────
            print("  Creating patient profiles...")
            patients = []
            blood_groups = ["A+", "B+", "O+", "AB+", "A-", "B-"]
            for i, user in enumerate(patient_users):
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
                patients.append(patient)

            await db.flush()

            # ── Create Hospitals ─────────────────────────────────
            print("  Creating hospitals...")
            hospitals = []
            for h_data in HOSPITALS_DATA:
                hospital = Hospital(**h_data)
                db.add(hospital)
                hospitals.append(hospital)

            await db.flush()

            # ── Create Departments ───────────────────────────────
            print("  Creating departments...")
            for hospital in hospitals:
                for dept_name in DEPARTMENT_NAMES[:5]:
                    dept = Department(
                        hospital_id=hospital.id,
                        name=dept_name,
                        capacity=random.randint(20, 60),
                        current_patients=random.randint(5, 30),
                        floor=random.randint(1, 5),
                    )
                    db.add(dept)

            await db.flush()

            # ── Create Doctor Profiles ───────────────────────────
            print("  Creating doctor profiles...")
            for i, user in enumerate(doctor_users):
                doctor = Doctor(
                    user_id=user.id,
                    hospital_id=hospitals[i % len(hospitals)].id,
                    specialization=SPECIALIZATIONS[i],
                    license_number=f"DL{10000 + i}",
                    experience_years=random.randint(5, 25),
                    is_available=True,
                    consultation_fee=random.choice([500, 800, 1000, 1500]),
                    rating=round(random.uniform(3.5, 5.0), 1),
                    about=f"Experienced {SPECIALIZATIONS[i]} specialist with {5 + i * 3} years of practice.",
                )
                db.add(doctor)

            await db.flush()

            # ── Create Ambulances ────────────────────────────────
            print("  Creating ambulances...")
            ambulance_types = [AmbulanceType.BASIC, AmbulanceType.ADVANCED, AmbulanceType.ICU]
            for i, hospital in enumerate(hospitals[:3]):
                for j in range(2):
                    amb = Ambulance(
                        vehicle_number=f"DL-{10 + i}{chr(65 + j)}-{1000 + i * 10 + j}",
                        hospital_id=hospital.id,
                        driver_id=driver_users[j % len(driver_users)].id if j < len(driver_users) else None,
                        ambulance_type=ambulance_types[j % len(ambulance_types)],
                        status=AmbulanceStatus.AVAILABLE,
                        latitude=hospital.latitude + random.uniform(-0.01, 0.01),
                        longitude=hospital.longitude + random.uniform(-0.01, 0.01),
                        has_oxygen=True,
                        has_defibrillator=j % 2 == 0,
                        has_ventilator=j == 0,
                    )
                    db.add(amb)

            await db.flush()

            # ── Create Sample Emergency Requests ─────────────────
            print("  Creating sample emergencies...")
            emergency_types = list(EmergencyType)
            for i, patient in enumerate(patients):
                emergency = EmergencyRequest(
                    patient_id=patient.id,
                    hospital_id=hospitals[i % len(hospitals)].id,
                    emergency_type=emergency_types[i % len(emergency_types)],
                    severity=random.randint(2, 5),
                    description=f"Emergency case requiring immediate attention.",
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

            # ── Create Notifications ─────────────────────────────
            print("  Creating notifications...")
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

            await db.commit()
            print("\n✅ Database seeded successfully!")
            print("\n📋 Login Credentials:")
            print("  ┌─────────────────────────────────────────────┐")
            print("  │ Role              │ Email                   │ Password      │")
            print("  ├─────────────────────────────────────────────┤")
            print("  │ Gov Admin         │ admin@aegisai.com       │ Admin@123     │")
            print("  │ Hospital Admin    │ hospital@aegisai.com    │ Hospital@123  │")
            print("  │ Patient           │ patient@aegisai.com     │ Patient@123   │")
            print("  │ Doctor            │ dr.mehta@aegisai.com    │ Doctor@123    │")
            print("  │ Driver            │ driver1@aegisai.com     │ Driver@123    │")
            print("  └─────────────────────────────────────────────┘")

        except Exception as e:
            await db.rollback()
            print(f"\n❌ Seeding failed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(seed())
