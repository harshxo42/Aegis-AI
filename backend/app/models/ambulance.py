"""
Aegis AI – Ambulance Model

Ambulance entity with real-time location tracking and status management.
"""

import enum
from typing import Optional
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AmbulanceType(str, enum.Enum):
    """Type of ambulance based on equipment level."""
    BASIC = "basic"
    ADVANCED = "advanced"
    ICU = "icu"
    NEONATAL = "neonatal"


class AmbulanceStatus(str, enum.Enum):
    """Current operational status of the ambulance."""
    AVAILABLE = "available"
    DISPATCHED = "dispatched"
    EN_ROUTE = "en_route"
    AT_SCENE = "at_scene"
    TRANSPORTING = "transporting"
    AT_HOSPITAL = "at_hospital"
    RETURNING = "returning"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"


class Ambulance(Base):
    """
    Ambulance model.

    Tracks ambulance vehicles, their current status,
    real-time location, and assignments.
    """

    __tablename__ = "ambulances"

    # ── Vehicle Information ──────────────────────────────────────
    vehicle_number: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    ambulance_type: Mapped[AmbulanceType] = mapped_column(
        Enum(AmbulanceType), default=AmbulanceType.BASIC, nullable=False
    )
    status: Mapped[AmbulanceStatus] = mapped_column(
        Enum(AmbulanceStatus), default=AmbulanceStatus.AVAILABLE, nullable=False
    )

    # ── Foreign Keys ─────────────────────────────────────────────
    hospital_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("hospitals.id", ondelete="SET NULL"),
        nullable=True, index=True
    )
    driver_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # ── Real-time Location ───────────────────────────────────────
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    last_location_update: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Equipment ────────────────────────────────────────────────
    has_oxygen: Mapped[bool] = mapped_column(default=True)
    has_defibrillator: Mapped[bool] = mapped_column(default=False)
    has_ventilator: Mapped[bool] = mapped_column(default=False)

    # ── Relationships ────────────────────────────────────────────
    hospital = relationship("Hospital", back_populates="ambulances")
    driver = relationship("User", foreign_keys=[driver_id])
    emergency_requests = relationship(
        "EmergencyRequest", back_populates="ambulance", lazy="dynamic"
    )

    def __repr__(self) -> str:
        return f"<Ambulance {self.vehicle_number} ({self.status.value})>"
