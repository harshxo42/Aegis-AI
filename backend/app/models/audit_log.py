"""
Aegis AI – Audit Log Model

Tracks all significant user actions for security and compliance.
"""

from typing import Optional, Any

from sqlalchemy import ForeignKey, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AuditLog(Base):
    """
    Audit Log model.

    Records user actions for security auditing,
    compliance tracking, and debugging.
    """

    __tablename__ = "audit_logs"

    # ── Foreign Keys ─────────────────────────────────────────────
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True, index=True
    )

    # ── Action Details ───────────────────────────────────────────
    action: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )  # e.g., "login", "create_emergency", "update_hospital"
    resource_type: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # e.g., "user", "hospital", "emergency_request"
    resource_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # ── Request Context ──────────────────────────────────────────
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    method: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    endpoint: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # ── Additional Details ───────────────────────────────────────
    details: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Status ───────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        String(20), default="success", nullable=False
    )  # success, failure, error

    # ── Relationships ────────────────────────────────────────────
    user = relationship("User", back_populates="audit_logs")

    def __repr__(self) -> str:
        return f"<AuditLog {self.action} by user_id={self.user_id}>"
