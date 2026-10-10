
"""
Aegis AI - Department Model

Hospital departments with capacity and staffing information.
"""

from typing import Optional

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Department(Base):
    __tablename__ = "departments"

    # Foreign Keys
    hospital_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("hospitals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Department Information
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

    # Head Doctor
    # use_alter=True resolves circular FK dependency:
    # departments -> doctors -> departments
    head_doctor_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey(
            "doctors.id",
            name="fk_departments_head_doctor_id_doctors",
            ondelete="SET NULL",
            use_alter=True,
        ),
        nullable=True,
    )

    # Relationships
    hospital = relationship(
        "Hospital",
        back_populates="departments",
    )

    doctors = relationship(
        "Doctor",
        primaryjoin="Department.id == Doctor.department_id",
        foreign_keys="[Doctor.department_id]",
        back_populates="department",
        lazy="selectin",
    )

    head_doctor = relationship(
        "Doctor",
        primaryjoin="Department.head_doctor_id == Doctor.id",
        foreign_keys="[Department.head_doctor_id]",
        back_populates="headed_departments",
        uselist=False,
    )

    def __repr__(self) -> str:
        return f"<Department {self.name}>"
