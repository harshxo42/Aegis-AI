"""
Aegis AI – Database Models Package

Imports all models so Alembic can auto-detect them for migrations.
"""

from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.hospital import Hospital
from app.models.department import Department
from app.models.ambulance import Ambulance
from app.models.emergency import EmergencyRequest
from app.models.notification import Notification
from app.models.medical_report import MedicalReport
from app.models.prediction import Prediction
from app.models.audit_log import AuditLog

__all__ = [
    "User",
    "Patient",
    "Doctor",
    "Hospital",
    "Department",
    "Ambulance",
    "EmergencyRequest",
    "Notification",
    "MedicalReport",
    "Prediction",
    "AuditLog",
]
