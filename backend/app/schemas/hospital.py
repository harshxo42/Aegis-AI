"""
Aegis AI – Hospital Schemas

Request/response models for hospital operations.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class HospitalCreate(BaseModel):
    """Create hospital."""
    name: str = Field(..., min_length=2, max_length=300)
    registration_number: Optional[str] = None
    hospital_type: str = "private"
    description: Optional[str] = None
    established_year: Optional[int] = None
    phone: str = Field(..., min_length=5, max_length=20)
    email: Optional[str] = None
    website: Optional[str] = None
    address: str = Field(..., min_length=5)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., min_length=4, max_length=10)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_beds: int = Field(default=0, ge=0)
    icu_beds: int = Field(default=0, ge=0)
    has_emergency: bool = True
    has_ambulance: bool = False
    has_pharmacy: bool = False
    has_lab: bool = False
    has_blood_bank: bool = False


class HospitalUpdate(BaseModel):
    """Update hospital."""
    name: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_beds: Optional[int] = None
    available_beds: Optional[int] = None
    icu_beds: Optional[int] = None
    icu_available: Optional[int] = None
    ventilators: Optional[int] = None
    ventilators_available: Optional[int] = None
    has_emergency: Optional[bool] = None
    has_ambulance: Optional[bool] = None
    has_pharmacy: Optional[bool] = None
    has_lab: Optional[bool] = None
    has_blood_bank: Optional[bool] = None
    is_active: Optional[bool] = None
    image_url: Optional[str] = None


class HospitalResponse(BaseModel):
    """Hospital response schema."""
    id: str
    name: str
    registration_number: Optional[str] = None
    hospital_type: str
    description: Optional[str] = None
    established_year: Optional[int] = None
    phone: str
    email: Optional[str] = None
    website: Optional[str] = None
    address: str
    city: str
    state: str
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_beds: int = 0
    available_beds: int = 0
    icu_beds: int = 0
    icu_available: int = 0
    ventilators: int = 0
    ventilators_available: int = 0
    has_emergency: bool = True
    has_ambulance: bool = False
    has_pharmacy: bool = False
    has_lab: bool = False
    has_blood_bank: bool = False
    rating: float = 0.0
    total_reviews: int = 0
    is_verified: bool = False
    is_active: bool = True
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class HospitalListResponse(BaseModel):
    """Minimal hospital info for lists."""
    id: str
    name: str
    hospital_type: str
    city: str
    state: str
    available_beds: int = 0
    icu_available: int = 0
    has_emergency: bool = True
    rating: float = 0.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    distance_km: Optional[float] = None  # Calculated field

    model_config = {"from_attributes": True}


class HospitalSearchParams(BaseModel):
    """Hospital search query parameters."""
    query: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    hospital_type: Optional[str] = None
    has_emergency: Optional[bool] = None
    has_beds: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[float] = Field(default=50.0, ge=1, le=500)
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)


class BedAvailabilityUpdate(BaseModel):
    """Update bed availability."""
    available_beds: Optional[int] = Field(None, ge=0)
    icu_available: Optional[int] = Field(None, ge=0)
    ventilators_available: Optional[int] = Field(None, ge=0)
