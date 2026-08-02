"""
Aegis AI – User Model

Core user entity with role-based access control.
All other profiles (Patient, Doctor, etc.) link to this model.
"""

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    """Enumeration of all user roles in the system."""
    PATIENT = "patient"
    DOCTOR = "doctor"
    AMBULANCE_DRIVER = "ambulance_driver"
    HOSPITAL_ADMIN = "hospital_admin"
    GOVERNMENT_ADMIN = "government_admin"


class User(Base):
    """
    User model – central authentication entity.

    Every person in the system has a User record.
    Role-specific data is stored in related profile models
    (Patient, Doctor, etc.) linked via foreign keys.
    """

    __tablename__ = "users"

    # ── Identity ─────────────────────────────────────────────────
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # ── Role & Status ────────────────────────────────────────────
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), nullable=False, default=UserRole.PATIENT
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Metadata ─────────────────────────────────────────────────
    last_login: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Relationships ────────────────────────────────────────────
    patient_profile = relationship(
        "Patient", back_populates="user", uselist=False, lazy="selectin"
    )
    doctor_profile = relationship(
        "Doctor", back_populates="user", uselist=False, lazy="selectin"
    )
    notifications = relationship(
        "Notification", back_populates="user", lazy="dynamic"
    )
    audit_logs = relationship(
        "AuditLog", back_populates="user", lazy="dynamic"
    )

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role.value})>"
