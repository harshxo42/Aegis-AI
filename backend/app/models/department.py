"""
Aegis AI – Department Model

Hospital departments with capacity and staffing information.
"""

from typing import Optional

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Department(Base):

    __tablename__ = "departments"


    # ── Foreign Keys ─────────────────────────────────────────────

    hospital_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("hospitals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )


    # ── Department Information ───────────────────────────────────

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )


    description: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )


    floor: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )


    capacity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )


    current_patients: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )


    # ── Head Doctor ───────────────────────────────────────────────

    head_doctor_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("doctors.id", ondelete="SET NULL"),
        nullable=True,
    )


    # ── Relationships ────────────────────────────────────────────


    hospital = relationship(
        "Hospital",
        back_populates="departments",
    )


    # All doctors working in this department
    doctors = relationship(
        "Doctor",
        primaryjoin="Department.id == Doctor.department_id",
        foreign_keys="[Doctor.department_id]",
        back_populates="department",
        lazy="selectin",
    )


    # Department head doctor
    head_doctor = relationship(
        "Doctor",
        primaryjoin="Department.head_doctor_id == Doctor.id",
        foreign_keys="[Department.head_doctor_id]",
        back_populates="headed_departments",
        uselist=False,
    )


    def __repr__(self):
        return f"<Department {self.name}>"