"""
Aegis AI – Security Module

JWT token management, password hashing, and role-based access control.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Dict

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Password Utilities ───────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT Token Utilities ──────────────────────────────────────────

def create_access_token(
    subject: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT access token.

    Args:
        subject: User ID to encode in the token
        role: User role for RBAC
        expires_delta: Custom expiration time
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )

    payload = {
        "sub": str(subject),
        "role": role,
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT refresh token with longer expiration.

    Args:
        subject: User ID to encode in the token
        expires_delta: Custom expiration time
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
        )

    payload = {
        "sub": str(subject),
        "type": "refresh",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT token.

    Returns:
        Decoded payload dict or None if invalid/expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None


def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify an access token and return payload if valid."""
    payload = decode_token(token)
    if payload and payload.get("type") == "access":
        return payload
    return None


def verify_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify a refresh token and return payload if valid."""
    payload = decode_token(token)
    if payload and payload.get("type") == "refresh":
        return payload
    return None


# ── Role-Based Access Control ────────────────────────────────────

class UserRole:
    """Constants for user roles."""
    PATIENT = "patient"
    DOCTOR = "doctor"
    AMBULANCE_DRIVER = "ambulance_driver"
    HOSPITAL_ADMIN = "hospital_admin"
    GOVERNMENT_ADMIN = "government_admin"

    ALL_ROLES = [PATIENT, DOCTOR, AMBULANCE_DRIVER, HOSPITAL_ADMIN, GOVERNMENT_ADMIN]
    ADMIN_ROLES = [HOSPITAL_ADMIN, GOVERNMENT_ADMIN]
    MEDICAL_ROLES = [DOCTOR, HOSPITAL_ADMIN]


def check_permission(user_role: str, allowed_roles: list[str]) -> bool:
    """Check if a user's role is in the list of allowed roles."""
    return user_role in allowed_roles
