"""
Aegis AI – Emergency Schemas

Request/response models for emergency operations.
"""

from typing import Optional
from datetime import datetime

from pydantic import BaseModel, Field


class EmergencyCreate(BaseModel):
    """Create emergency request."""

    emergency_type: str = Field(default="other")
    severity: int = Field(default=3, ge=1, le=5)

    description: Optional[str] = None
    symptoms: Optional[str] = None

    location_lat: float
    location_lng: float
    location_address: Optional[str] = None

    # Optional hospital selected during SOS
    hospital_id: Optional[str] = None


class EmergencyUpdate(BaseModel):
    """Update emergency request status and related information."""

    status: Optional[str] = None
    ambulance_id: Optional[str] = None
    hospital_id: Optional[str] = None

    responder_notes: Optional[str] = None
    hospital_notes: Optional[str] = None


class EmergencyResponse(BaseModel):
    """Detailed emergency request response."""

    id: str
    patient_id: str

    # Assignment information
    ambulance_id: Optional[str] = None
    hospital_id: Optional[str] = None

    # Emergency information
    emergency_type: str
    severity: int

    description: Optional[str] = None
    symptoms: Optional[str] = None
    status: str

    # Location
    location_lat: float
    location_lng: float
    location_address: Optional[str] = None

    # Hospital information
    hospital_name: Optional[str] = None
    hospital_address: Optional[str] = None
    hospital_city: Optional[str] = None
    hospital_state: Optional[str] = None

    # Emergency lifecycle
    requested_at: datetime
    dispatched_at: Optional[datetime] = None
    arrived_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    # AI information
    ai_severity_score: Optional[float] = None
    ai_recommended_hospital_id: Optional[str] = None

    # Ambulance information
    estimated_arrival_minutes: Optional[int] = None

    # Notes
    responder_notes: Optional[str] = None
    hospital_notes: Optional[str] = None

    # System timestamps
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmergencyListResponse(BaseModel):
    """Emergency information for list views."""

    id: str
    patient_id: str

    # Hospital assignment
    hospital_id: Optional[str] = None
    hospital_name: Optional[str] = None
    hospital_address: Optional[str] = None

    # Emergency information
    emergency_type: str
    severity: int
    status: str

    # Location
    location_address: Optional[str] = None

    # Timing
    requested_at: datetime
    estimated_arrival_minutes: Optional[int] = None

    model_config = {"from_attributes": True}