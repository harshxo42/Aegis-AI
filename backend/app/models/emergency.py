"""
Aegis AI – Emergency Request Model

Core emergency request entity tracking the full lifecycle
from request to resolution.
"""

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EmergencyType(str, enum.Enum):
    """Type of emergency incident."""
    CARDIAC = "cardiac"
    TRAUMA = "trauma"
    STROKE = "stroke"
    BREATHING = "breathing"
    ACCIDENT = "accident"
    BURN = "burn"
    POISONING = "poisoning"
    PREGNANCY = "pregnancy"
    MENTAL_HEALTH = "mental_health"
    OTHER = "other"


class EmergencyStatus(str, enum.Enum):
    """Status of the emergency request lifecycle."""
    REQUESTED = "requested"
    ACKNOWLEDGED = "acknowledged"
    DISPATCHED = "dispatched"
    EN_ROUTE = "en_route"
    ARRIVED = "arrived"
    IN_TREATMENT = "in_treatment"
    TRANSPORTING = "transporting"
    AT_HOSPITAL = "at_hospital"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"


class EmergencyRequest(Base):
    """
    Emergency Request model.

    Tracks the entire lifecycle of an emergency request
    from initial patient call to resolution.
    """

    __tablename__ = "emergency_requests"

    # ── Foreign Keys ─────────────────────────────────────────────
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    ambulance_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("ambulances.id", ondelete="SET NULL"),
        nullable=True
    )
    hospital_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("hospitals.id", ondelete="SET NULL"),
        nullable=True
    )

    # ── Emergency Details ────────────────────────────────────────
    emergency_type: Mapped[EmergencyType] = mapped_column(
        Enum(EmergencyType), default=EmergencyType.OTHER, nullable=False
    )
    severity: Mapped[int] = mapped_column(
        Integer, default=3, nullable=False
    )  # 1 (low) to 5 (critical)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    symptoms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Status ───────────────────────────────────────────────────
    status: Mapped[EmergencyStatus] = mapped_column(
        Enum(EmergencyStatus), default=EmergencyStatus.REQUESTED, nullable=False
    )

    # ── Location ─────────────────────────────────────────────────
    location_lat: Mapped[float] = mapped_column(Float, nullable=False)
    location_lng: Mapped[float] = mapped_column(Float, nullable=False)
    location_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Timestamps ───────────────────────────────────────────────
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    dispatched_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    arrived_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── AI Analysis ──────────────────────────────────────────────
    ai_severity_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_recommended_hospital_id: Mapped[Optional[str]] = mapped_column(
        String(36), nullable=True
    )
    estimated_arrival_minutes: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )

    # ── Notes ────────────────────────────────────────────────────
    responder_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hospital_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Relationships ────────────────────────────────────────────
    patient = relationship("Patient", back_populates="emergency_requests")
    ambulance = relationship("Ambulance", back_populates="emergency_requests")
    hospital = relationship("Hospital", back_populates="emergency_requests")

    def __repr__(self) -> str:
        return f"<Emergency {self.id} severity={self.severity} status={self.status.value}>"
