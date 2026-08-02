"""
Aegis AI – Doctor Model

Doctor profile linked to User, Hospital, and Department.
"""

from typing import Optional

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Doctor(Base):

    __tablename__ = "doctors"

    # ── Foreign Keys ─────────────────────────────────────────────

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    hospital_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("hospitals.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    department_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )


    # ── Professional Information ─────────────────────────────────

    specialization: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    license_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    qualification: Mapped[Optional[str]] = mapped_column(
        String(300),
        nullable=True,
    )

    experience_years: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )


    # ── Availability ─────────────────────────────────────────────

    is_available: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    consultation_fee: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    rating: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    total_patients: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )


    about: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )


    # ── Relationships ────────────────────────────────────────────


    user = relationship(
        "User",
        back_populates="doctor_profile",
    )


    hospital = relationship(
        "Hospital",
        back_populates="doctors",
    )


    # Doctor belongs to one department
    department = relationship(
        "Department",
        primaryjoin="Doctor.department_id == Department.id",
        foreign_keys="[Doctor.department_id]",
        back_populates="doctors",
    )


    # Doctor can be head of departments
    headed_departments = relationship(
        "Department",
        primaryjoin="Doctor.id == Department.head_doctor_id",
        foreign_keys="[Department.head_doctor_id]",
        back_populates="head_doctor",
    )


    medical_reports = relationship(
        "MedicalReport",
        back_populates="doctor",
        lazy="dynamic",
    )


    def __repr__(self):
        return f"<Doctor {self.specialization}>"