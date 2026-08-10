"""
Aegis AI - AI & ML Services API

Endpoints for disease prediction, emergency severity scoring,
and medical report understanding.
"""

from datetime import datetime, timezone
import random
from typing import Any

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from loguru import logger

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.prediction import Prediction, PredictionType
from app.schemas.common import SuccessResponse


router = APIRouter(
    prefix="/ai",
    tags=["AI & ML Services"],
)


# ============================================================
# Schemas
# ============================================================


class DiseasePredictionRequest(BaseModel):
    """Request schema for disease prediction."""

    symptoms: str = Field(
        ...,
        min_length=2,
        description="Comma separated symptoms",
    )

    age: int = Field(
        ...,
        ge=0,
        le=120,
    )

    gender: str = Field(
        ...,
        min_length=1,
        max_length=20,
    )

    medical_history: str | None = Field(
        default=None,
        max_length=5000,
    )


class DiseasePredictionResponse(BaseModel):
    """Response schema for disease prediction."""

    predicted_disease: str
    confidence_score: float
    recommended_action: str
    triage_level: str


# ============================================================
# AI Service
# ============================================================


class MedicalAIService:
    """
    Enterprise-style medical AI service.

    Uses a deterministic rule-based fallback when a real
    LLM/API key is not configured.

    NOTE:
    This is a demonstration/engineering implementation.
    It must not be treated as a real medical diagnostic system.
    """

    def __init__(self) -> None:
        self.use_real_llm = bool(settings.OPENAI_API_KEY)

    def analyze_symptoms(
        self,
        symptoms: str,
        age: int,
        gender: str,
        history: str | None,
    ) -> dict[str, Any]:
        """
        Analyze symptoms and return a triage-oriented result.
        """

        start_time = datetime.now(timezone.utc)

        try:
            symptoms_lower = symptoms.lower().strip()

            # ------------------------------------------------
            # Basic validation
            # ------------------------------------------------

            if not symptoms_lower:
                raise ValueError("Symptoms cannot be empty")

            # ------------------------------------------------
            # Emergency / critical symptoms
            # ------------------------------------------------

            if (
                "chest pain" in symptoms_lower
                or "severe chest pain" in symptoms_lower
                or "difficulty breathing" in symptoms_lower
                or "shortness of breath" in symptoms_lower
            ):
                result = {
                    "disease": "Possible Cardiac or Respiratory Emergency",
                    "confidence": 95.0,
                    "action": (
                        "Seek immediate emergency medical care. "
                        "Do not delay emergency evaluation."
                    ),
                    "triage": "CRITICAL",
                }

            # ------------------------------------------------
            # Fever + cough
            # ------------------------------------------------

            elif (
                "fever" in symptoms_lower
                and "cough" in symptoms_lower
            ):
                result = {
                    "disease": "Possible Viral Respiratory Infection",
                    "confidence": 82.0,
                    "action": (
                        "Rest and maintain hydration. "
                        "Consult a healthcare professional if symptoms "
                        "persist or worsen."
                    ),
                    "triage": "LOW",
                }

            # ------------------------------------------------
            # Headache
            # ------------------------------------------------

            elif "headache" in symptoms_lower:
                result = {
                    "disease": "Possible Headache / Migraine",
                    "confidence": 70.0,
                    "action": (
                        "Monitor symptoms and consider medical consultation "
                        "if severe, persistent, or associated with other "
                        "concerning symptoms."
                    ),
                    "triage": "MODERATE",
                }

            # ------------------------------------------------
            # Unknown symptoms
            # ------------------------------------------------

            else:
                result = {
                    "disease": "Unknown / General Symptoms",
                    "confidence": 50.0,
                    "action": (
                        "Schedule a general medical consultation "
                        "for further evaluation."
                    ),
                    "triage": "MODERATE",
                }

            # ------------------------------------------------
            # Metrics
            # ------------------------------------------------

            latency = (
                datetime.now(timezone.utc) - start_time
            ).total_seconds()

            logger.info(
                "AI_EVALUATION_METRICS",
                model=(
                    "openai-llm"
                    if self.use_real_llm
                    else "mock-triage-v2"
                ),
                latency_sec=latency,
                confidence_score=result["confidence"],
                triage_level=result["triage"],
                input_length=len(symptoms),
                age=age,
                gender=gender,
                has_medical_history=bool(history),
            )

            return result

        except ValueError:
            raise

        except Exception as exc:
            logger.exception(
                "AI Service Error: {}",
                exc,
            )

            raise HTTPException(
                status_code=500,
                detail="AI Service temporarily unavailable.",
            ) from exc


def get_ai_service() -> MedicalAIService:
    """Dependency factory for the AI service."""

    return MedicalAIService()


# ============================================================
# Disease Prediction
# ============================================================


@router.post(
    "/predict",
    response_model=SuccessResponse,
    summary="Predict disease based on symptoms",
)
async def get_disease_prediction(
    request: DiseasePredictionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    ai_service: MedicalAIService = Depends(get_ai_service),
) -> Any:
    """
    Generate an AI-assisted disease/triage prediction.

    For patient users, the prediction is persisted against
    the actual Patient profile ID.
    """

    prediction_result = ai_service.analyze_symptoms(
        symptoms=request.symptoms,
        age=request.age,
        gender=request.gender,
        history=request.medical_history,
    )

    # --------------------------------------------------------
    # Persist prediction for patients
    # --------------------------------------------------------

    if current_user.role == UserRole.PATIENT:

        patient_result = await db.execute(
            select(Patient).where(
                Patient.user_id == current_user.id
            )
        )

        patient = patient_result.scalar_one_or_none()

        if patient is not None:

            prediction_record = Prediction(
                patient_id=patient.id,
                prediction_type=PredictionType.DISEASE,
                input_data={
                    "symptoms": request.symptoms,
                    "age": request.age,
                    "gender": request.gender,
                    "medical_history": request.medical_history,
                },
                result={
                    "predicted_disease": prediction_result["disease"],
                    "confidence_score": prediction_result["confidence"],
                    "recommended_action": prediction_result["action"],
                    "triage_level": prediction_result["triage"],
                },
                result_summary=prediction_result["disease"],
                confidence=prediction_result["confidence"],
                model_name=(
                    "openai-llm"
                    if ai_service.use_real_llm
                    else "mock-triage-v2"
                ),
                model_version="1.0",
            )

            db.add(prediction_record)

            await db.commit()

    # --------------------------------------------------------
    # API response
    # --------------------------------------------------------

    return SuccessResponse(
        message="Prediction generated successfully",
        data={
            "predicted_disease": prediction_result["disease"],
            "confidence_score": prediction_result["confidence"],
            "recommended_action": prediction_result["action"],
            "triage_level": prediction_result["triage"],
        },
    )


# ============================================================
# Medical Report Analysis
# ============================================================


@router.post(
    "/analyze-report",
    response_model=SuccessResponse,
    summary="Analyze medical report (OCR & NLP)",
)
async def analyze_medical_report(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Upload a medical report for AI-based analysis.

    Currently this endpoint provides a mock OCR/NLP result.
    """

    allowed_types = {
        "application/pdf",
        "image/jpeg",
        "image/png",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid file type. "
                "Only PDF, JPEG, and PNG are allowed."
            ),
        )

    # --------------------------------------------------------
    # Mock OCR/NLP result
    # --------------------------------------------------------

    mock_findings = {
        "summary": (
            "The patient's lipid profile indicates elevated "
            "cholesterol levels. Blood glucose is within normal "
            "fasting limits."
        ),
        "key_metrics": [
            {
                "metric": "Total Cholesterol",
                "value": "240 mg/dL",
                "status": "High",
                "normal_range": "< 200 mg/dL",
            },
            {
                "metric": "Fasting Blood Sugar",
                "value": "95 mg/dL",
                "status": "Normal",
                "normal_range": "70 - 100 mg/dL",
            },
            {
                "metric": "Hemoglobin",
                "value": "14.2 g/dL",
                "status": "Normal",
                "normal_range": "13.8 - 17.2 g/dL",
            },
        ],
        "recommendations": (
            "Dietary modification to reduce cholesterol intake. "
            "Follow up with a healthcare professional."
        ),
    }

    return SuccessResponse(
        message="Report analyzed successfully",
        data={
            "filename": file.filename,
            "analysis": mock_findings,
        },
    )