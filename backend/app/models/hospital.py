"""
Aegis AI – Hospital Model

Hospital entity with location, capacity, and facility information.
"""

import enum
from typing import Optional

from sqlalchemy import Boolean, Enum, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class HospitalType(str, enum.Enum):
    """Type of hospital."""
    GOVERNMENT = "government"
    PRIVATE = "private"
    MILITARY = "military"
    NGO = "ngo"


class Hospital(Base):
    """
    Hospital model.

    Stores hospital information including location,
    capacity, bed availability, and facility details.
    """

    __tablename__ = "hospitals"

    # ── Basic Information ────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    registration_number: Mapped[Optional[str]] = mapped_column(
        String(50), unique=True, nullable=True
    )
    hospital_type: Mapped[HospitalType] = mapped_column(
        Enum(HospitalType), default=HospitalType.PRIVATE, nullable=False
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    established_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # ── Contact ──────────────────────────────────────────────────
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # ── Location ─────────────────────────────────────────────────
    address: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    pincode: Mapped[str] = mapped_column(String(10), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # ── Bed Capacity ─────────────────────────────────────────────
    total_beds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    available_beds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    icu_beds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    icu_available: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ventilators: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ventilators_available: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )

    # ── Facilities ───────────────────────────────────────────────
    has_emergency: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    has_ambulance: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_pharmacy: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_lab: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_blood_bank: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # ── Ratings & Status ─────────────────────────────────────────
    rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ── Image ────────────────────────────────────────────────────
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # ── Relationships ────────────────────────────────────────────
    departments = relationship(
        "Department", back_populates="hospital", lazy="selectin"
    )
    doctors = relationship("Doctor", back_populates="hospital", lazy="dynamic")
    ambulances = relationship("Ambulance", back_populates="hospital", lazy="dynamic")
    emergency_requests = relationship(
        "EmergencyRequest", back_populates="hospital", lazy="dynamic"
    )

    def __repr__(self) -> str:
        return f"<Hospital {self.name} ({self.city})>"
