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


class EmergencyUpdate(BaseModel):
    """Update emergency request status."""
    status: Optional[str] = None
    ambulance_id: Optional[str] = None
    hospital_id: Optional[str] = None
    responder_notes: Optional[str] = None
    hospital_notes: Optional[str] = None


class EmergencyResponse(BaseModel):
    """Emergency request response."""
    id: str
    patient_id: str
    ambulance_id: Optional[str] = None
    hospital_id: Optional[str] = None
    emergency_type: str
    severity: int
    description: Optional[str] = None
    symptoms: Optional[str] = None
    status: str
    location_lat: float
    location_lng: float
    location_address: Optional[str] = None
    requested_at: datetime
    dispatched_at: Optional[datetime] = None
    arrived_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    ai_severity_score: Optional[float] = None
    ai_recommended_hospital_id: Optional[str] = None
    estimated_arrival_minutes: Optional[int] = None
    responder_notes: Optional[str] = None
    hospital_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmergencyListResponse(BaseModel):
    """Minimal emergency info for lists."""
    id: str
    patient_id: str
    emergency_type: str
    severity: int
    status: str
    location_address: Optional[str] = None
    requested_at: datetime
    estimated_arrival_minutes: Optional[int] = None

    model_config = {"from_attributes": True}
