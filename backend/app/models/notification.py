"""
Aegis AI – Notification Model

In-app notification system for alerts, updates, and emergency communications.
"""

import enum
from typing import Optional

from sqlalchemy import Boolean, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class NotificationType(str, enum.Enum):
    """Category of notification."""
    EMERGENCY = "emergency"
    INFO = "info"
    WARNING = "warning"
    SUCCESS = "success"
    SYSTEM = "system"


class Notification(Base):
    """
    Notification model.

    Stores in-app notifications for users, including
    emergency alerts and system messages.
    """

    __tablename__ = "notifications"

    # ── Foreign Keys ─────────────────────────────────────────────
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    # ── Notification Content ─────────────────────────────────────
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType), default=NotificationType.INFO, nullable=False
    )

    # ── Status ───────────────────────────────────────────────────
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Action ───────────────────────────────────────────────────
    action_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    action_label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # ── Metadata ─────────────────────────────────────────────────
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    priority: Mapped[int] = mapped_column(default=0)  # Higher = more important

    # ── Relationships ────────────────────────────────────────────
    user = relationship("User", back_populates="notifications")

    def __repr__(self) -> str:
        return f"<Notification {self.title} to user_id={self.user_id}>"
