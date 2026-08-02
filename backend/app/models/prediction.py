"""
Aegis AI – Prediction Model

Stores AI/ML prediction results for audit and display.
"""

import enum
from typing import Optional, Any

from sqlalchemy import Enum, Float, ForeignKey, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PredictionType(str, enum.Enum):
    """Type of AI prediction."""
    DISEASE = "disease"
    SEVERITY = "severity"
    HOSPITAL_RECOMMENDATION = "hospital_recommendation"
    WAITING_TIME = "waiting_time"
    BED_OCCUPANCY = "bed_occupancy"


class Prediction(Base):
    """
    AI Prediction model.

    Stores the input, output, and metadata for each AI prediction
    made by the ML services.
    """

    __tablename__ = "predictions"

    # ── Foreign Keys ─────────────────────────────────────────────
    patient_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="SET NULL"),
        nullable=True, index=True
    )

    # ── Prediction Information ───────────────────────────────────
    prediction_type: Mapped[PredictionType] = mapped_column(
        Enum(PredictionType), nullable=False
    )
    input_data: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    result: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    result_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Confidence & Model Info ──────────────────────────────────
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    model_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    model_version: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # ── Feedback ─────────────────────────────────────────────────
    is_accurate: Mapped[Optional[bool]] = mapped_column(nullable=True)
    feedback_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Relationships ────────────────────────────────────────────
    patient = relationship("Patient", back_populates="predictions")

    def __repr__(self) -> str:
        return f"<Prediction {self.prediction_type.value} confidence={self.confidence}>"
