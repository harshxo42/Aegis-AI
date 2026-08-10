"""
Aegis AI – Patient Model

Extended patient profile linked to the User model.
Stores medical and emergency-specific information.
"""

from typing import Optional

from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Patient(Base):
    """
    Patient profile model.

    Extends the base User with medical information,
    emergency contacts, insurance, and location data.
    """

    __tablename__ = "patients"

    # ── Foreign Keys ─────────────────────────────────────────────

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # ── Medical Information ──────────────────────────────────────

    blood_group: Mapped[Optional[str]] = mapped_column(
        String(5),
        nullable=True,
    )

    date_of_birth: Mapped[Optional[str]] = mapped_column(
        String(10),
        nullable=True,
    )

    gender: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )

    height_cm: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    weight_kg: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    # ── Medical History ──────────────────────────────────────────

    allergies: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    medical_history: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    current_medications: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    chronic_conditions: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # ── Emergency Contact ────────────────────────────────────────

    emergency_contact_name: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
    )

    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )

    emergency_contact_relation: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )

    # ── Insurance ────────────────────────────────────────────────

    insurance_provider: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
    )

    insurance_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    # ── Location ─────────────────────────────────────────────────

    address: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    city: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    state: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    pincode: Mapped[Optional[str]] = mapped_column(
        String(10),
        nullable=True,
    )

    location_lat: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    location_lng: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    # ── Relationships ────────────────────────────────────────────

    user = relationship(
        "User",
        back_populates="patient_profile",
    )

    emergency_requests = relationship(
        "EmergencyRequest",
        back_populates="patient",
        lazy="dynamic",
    )

    medical_reports = relationship(
        "MedicalReport",
        back_populates="patient",
        lazy="dynamic",
    )

    predictions = relationship(
        "Prediction",
        back_populates="patient",
        lazy="dynamic",
    )

    # ── Representation ───────────────────────────────────────────

    def __repr__(self) -> str:
        return f"<Patient user_id={self.user_id}>"