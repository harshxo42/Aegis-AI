import pytest
from pydantic import ValidationError

from app.schemas.auth import RegisterRequest


def test_valid_registration():
    user = RegisterRequest(
        email="test@example.com",
        password="StrongPass123",
        confirm_password="StrongPass123",
        full_name="Test User",
        role="patient",
    )

    assert user.email == "test@example.com"
    assert user.full_name == "Test User"
    assert user.role == "patient"


def test_password_requires_uppercase():
    with pytest.raises(ValidationError):
        RegisterRequest(
            email="test@example.com",
            password="weakpass123",
            confirm_password="weakpass123",
            full_name="Test User",
            role="patient",
        )


def test_passwords_must_match():
    with pytest.raises(ValidationError):
        RegisterRequest(
            email="test@example.com",
            password="StrongPass123",
            confirm_password="DifferentPass123",
            full_name="Test User",
            role="patient",
        )


def test_invalid_role_is_rejected():
    with pytest.raises(ValidationError):
        RegisterRequest(
            email="test@example.com",
            password="StrongPass123",
            confirm_password="StrongPass123",
            full_name="Test User",
            role="invalid_role",
        )