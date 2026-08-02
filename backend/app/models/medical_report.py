"""
Aegis AI – Medical Report Model

Medical report uploads with OCR extraction and AI analysis.
"""

from typing import Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MedicalReport(Base):
    """
    Medical Report model.

    Stores uploaded medical documents with OCR-extracted text
    and AI-generated summaries.
    """

    __tablename__ = "medical_reports"

    # ── Foreign Keys ─────────────────────────────────────────────
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    doctor_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("doctors.id", ondelete="SET NULL"),
        nullable=True
    )

    # ── File Information ─────────────────────────────────────────
    file_name: Mapped[str] = mapped_column(String(300), nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)  # pdf, image, etc.
    file_size_bytes: Mapped[Optional[int]] = mapped_column(nullable=True)

    # ── Report Details ───────────────────────────────────────────
    report_type: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )  # blood_test, xray, mri, prescription, etc.
    title: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── AI Processing ────────────────────────────────────────────
    ocr_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    diagnosis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    key_findings: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_processed: Mapped[bool] = mapped_column(default=False)

    # ── Relationships ────────────────────────────────────────────
    patient = relationship("Patient", back_populates="medical_reports")
    doctor = relationship("Doctor", back_populates="medical_reports")

    def __repr__(self) -> str:
        return f"<MedicalReport {self.file_name} patient_id={self.patient_id}>"
