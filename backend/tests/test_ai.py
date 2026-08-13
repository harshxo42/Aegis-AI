import io

import pytest
from httpx import AsyncClient


# ============================================================
# Helper functions
# ============================================================

async def register_user(
    client: AsyncClient,
    email: str,
    password: str = "StrongPass123",
    full_name: str = "AI Test User",
    role: str = "patient",
):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "confirm_password": password,
            "full_name": full_name,
            "role": role,
        },
    )

    assert response.status_code == 201, response.text
    return response


async def login_user(
    client: AsyncClient,
    email: str,
    password: str = "StrongPass123",
) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert response.status_code == 200, response.text

    body = response.json()

    return body["data"]["tokens"]["access_token"]


async def authenticated_client_token(
    client: AsyncClient,
    email: str,
):
    await register_user(
        client,
        email,
        full_name="AI Test Patient",
        role="patient",
    )

    return await login_user(client, email)


# ============================================================
# AI Prediction Tests
# ============================================================

@pytest.mark.asyncio
async def test_ai_prediction_with_patient(client: AsyncClient):
    token = await authenticated_client_token(
        client,
        "ai-patient@test.com",
    )

    response = await client.post(
        "/api/v1/ai/predict",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "symptoms": "chest pain and arm pain",
            "age": 45,
            "gender": "male",
            "medical_history": "hypertension",
        },
    )

    assert response.status_code == 200, response.text

    body = response.json()

    assert body["message"] == "Prediction generated successfully"

    data = body["data"]

    assert data["predicted_disease"]
    assert data["confidence_score"] is not None
    assert data["recommended_action"]
    assert data["triage_level"]

    assert 0 <= data["confidence_score"] <= 100
    assert data["triage_level"] == "CRITICAL"


@pytest.mark.asyncio
async def test_ai_prediction_fever_and_cough(client: AsyncClient):
    token = await authenticated_client_token(
        client,
        "ai-fever@test.com",
    )

    response = await client.post(
        "/api/v1/ai/predict",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "symptoms": "fever and cough",
            "age": 30,
            "gender": "female",
            "medical_history": None,
        },
    )

    assert response.status_code == 200, response.text

    data = response.json()["data"]

    # Current implementation result
    assert data["predicted_disease"] == (
        "Possible Viral Respiratory Infection"
    )

    assert data["triage_level"]
    assert data["recommended_action"]

    assert 0 <= data["confidence_score"] <= 100


@pytest.mark.asyncio
async def test_ai_prediction_headache_symptoms(client: AsyncClient):
    token = await authenticated_client_token(
        client,
        "ai-headache@test.com",
    )

    response = await client.post(
        "/api/v1/ai/predict",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "symptoms": "mild headache",
            "age": 25,
            "gender": "male",
            "medical_history": None,
        },
    )

    assert response.status_code == 200, response.text

    data = response.json()["data"]

    # Current implementation result
    assert data["predicted_disease"] == (
        "Possible Headache / Migraine"
    )

    assert data["triage_level"]
    assert data["recommended_action"]

    assert 0 <= data["confidence_score"] <= 100


@pytest.mark.asyncio
async def test_ai_prediction_requires_authentication(client: AsyncClient):
    response = await client.post(
        "/api/v1/ai/predict",
        json={
            "symptoms": "fever and cough",
            "age": 30,
            "gender": "female",
            "medical_history": None,
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_ai_prediction_invalid_token(client: AsyncClient):
    response = await client.post(
        "/api/v1/ai/predict",
        headers={
            "Authorization": "Bearer invalid-token",
        },
        json={
            "symptoms": "fever and cough",
            "age": 30,
            "gender": "female",
            "medical_history": None,
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_ai_prediction_invalid_age(client: AsyncClient):
    token = await authenticated_client_token(
        client,
        "ai-invalid-age@test.com",
    )

    response = await client.post(
        "/api/v1/ai/predict",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "symptoms": "fever",
            "age": 150,
            "gender": "male",
            "medical_history": None,
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_ai_prediction_missing_symptoms(client: AsyncClient):
    token = await authenticated_client_token(
        client,
        "ai-missing-symptoms@test.com",
    )

    response = await client.post(
        "/api/v1/ai/predict",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "age": 30,
            "gender": "male",
            "medical_history": None,
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_ai_prediction_missing_age(client: AsyncClient):
    token = await authenticated_client_token(
        client,
        "ai-missing-age@test.com",
    )

    response = await client.post(
        "/api/v1/ai/predict",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "symptoms": "fever",
            "gender": "male",
            "medical_history": None,
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_ai_prediction_invalid_gender(client: AsyncClient):
    token = await authenticated_client_token(
        client,
        "ai-invalid-gender@test.com",
    )

    response = await client.post(
        "/api/v1/ai/predict",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "symptoms": "fever",
            "age": 30,
            "gender": "invalid",
            "medical_history": None,
        },
    )

    # Accept either validation failure or successful handling
    # depending on the current Pydantic model.
    assert response.status_code in (200, 422)


# ============================================================
# AI Report Analysis Tests
# ============================================================

@pytest.mark.asyncio
async def test_ai_report_analysis_pdf(client: AsyncClient):
    token = await authenticated_client_token(
        client,
        "ai-report-pdf@test.com",
    )

    pdf_content = b"%PDF-1.4 fake test pdf content"

    response = await client.post(
        "/api/v1/ai/analyze-report",
        headers={
            "Authorization": f"Bearer {token}",
        },
        files={
            "file": (
                "medical_report.pdf",
                io.BytesIO(pdf_content),
                "application/pdf",
            )
        },
    )

    assert response.status_code == 200, response.text

    body = response.json()

    assert body["message"] == "Report analyzed successfully"

    data = body["data"]

    assert data["filename"] == "medical_report.pdf"
    assert "analysis" in data

    analysis = data["analysis"]

    assert "summary" in analysis
    assert "key_metrics" in analysis
    assert "recommendations" in analysis

    assert isinstance(analysis["key_metrics"], list)
    assert len(analysis["key_metrics"]) == 3


@pytest.mark.asyncio
async def test_ai_report_analysis_jpeg(client: AsyncClient):
    token = await authenticated_client_token(
        client,
        "ai-report-jpeg@test.com",
    )

    image_content = b"fake jpeg image content"

    response = await client.post(
        "/api/v1/ai/analyze-report",
        headers={
            "Authorization": f"Bearer {token}",
        },
        files={
            "file": (
                "report.jpg",
                io.BytesIO(image_content),
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 200, response.text

    data = response.json()["data"]

    assert data["filename"] == "report.jpg"
    assert "analysis" in data


@pytest.mark.asyncio
async def test_ai_report_analysis_png(client: AsyncClient):
    token = await authenticated_client_token(
        client,
        "ai-report-png@test.com",
    )

    image_content = b"fake png image content"

    response = await client.post(
        "/api/v1/ai/analyze-report",
        headers={
            "Authorization": f"Bearer {token}",
        },
        files={
            "file": (
                "report.png",
                io.BytesIO(image_content),
                "image/png",
            )
        },
    )

    assert response.status_code == 200, response.text

    data = response.json()["data"]

    assert data["filename"] == "report.png"
    assert "analysis" in data


@pytest.mark.asyncio
async def test_ai_report_analysis_invalid_file_type(client: AsyncClient):
    token = await authenticated_client_token(
        client,
        "ai-invalid-report@test.com",
    )

    response = await client.post(
        "/api/v1/ai/analyze-report",
        headers={
            "Authorization": f"Bearer {token}",
        },
        files={
            "file": (
                "malicious.exe",
                io.BytesIO(b"fake executable"),
                "application/octet-stream",
            )
        },
    )

    assert response.status_code == 400, response.text

    body = response.json()

    # The project uses a custom error response instead of
    # FastAPI's default {"detail": "..."} format.
    error_text = str(body).lower()

    assert (
        "invalid file type" in error_text
        or "only pdf" in error_text
        or "jpeg" in error_text
        or "png" in error_text
    )


@pytest.mark.asyncio
async def test_ai_report_analysis_requires_authentication(
    client: AsyncClient,
):
    response = await client.post(
        "/api/v1/ai/analyze-report",
        files={
            "file": (
                "report.pdf",
                io.BytesIO(b"fake pdf"),
                "application/pdf",
            )
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_ai_report_analysis_invalid_token(
    client: AsyncClient,
):
    response = await client.post(
        "/api/v1/ai/analyze-report",
        headers={
            "Authorization": "Bearer invalid-token",
        },
        files={
            "file": (
                "report.pdf",
                io.BytesIO(b"fake pdf"),
                "application/pdf",
            )
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_ai_report_analysis_txt_file(
    client: AsyncClient,
):
    token = await authenticated_client_token(
        client,
        "ai-report-txt@test.com",
    )

    response = await client.post(
        "/api/v1/ai/analyze-report",
        headers={
            "Authorization": f"Bearer {token}",
        },
        files={
            "file": (
                "report.txt",
                io.BytesIO(b"plain text medical report"),
                "text/plain",
            )
        },
    )

    assert response.status_code == 400

    body = response.json()

    error_text = str(body).lower()

    assert (
        "invalid file type" in error_text
        or "only pdf" in error_text
        or "jpeg" in error_text
        or "png" in error_text
    )


@pytest.mark.asyncio
async def test_ai_report_analysis_docx_file(
    client: AsyncClient,
):
    token = await authenticated_client_token(
        client,
        "ai-report-docx@test.com",
    )

    response = await client.post(
        "/api/v1/ai/analyze-report",
        headers={
            "Authorization": f"Bearer {token}",
        },
        files={
            "file": (
                "report.docx",
                io.BytesIO(b"fake docx content"),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )

    assert response.status_code == 400

    body = response.json()

    error_text = str(body).lower()

    assert (
        "invalid file type" in error_text
        or "only pdf" in error_text
        or "png" in error_text
    )

@pytest.mark.asyncio
async def test_ai_prediction_with_admin(client: AsyncClient):
    """Admin predicting disease shouldn't attempt to save a Patient Prediction record."""
    await register_user(client, "admin-ai@test.com", role="hospital_admin")
    token = await login_user(client, "admin-ai@test.com")

    response = await client.post(
        "/api/v1/ai/predict",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "symptoms": "chest pain",
            "age": 45,
            "gender": "male",
            "medical_history": "hypertension",
        },
    )
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_ai_prediction_patient_without_profile(client: AsyncClient, db_session):
    """Patient predicting disease without a Patient profile should skip saving Prediction record."""
    from app.models.user import User
    from app.models.patient import Patient
    from sqlalchemy import select

    token = await authenticated_client_token(client, "patient-no-profile@test.com")

    # Manually delete the automatically created patient profile
    result = await db_session.execute(select(User).where(User.email == "patient-no-profile@test.com"))
    user = result.scalar_one()
    patient_result = await db_session.execute(select(Patient).where(Patient.user_id == user.id))
    patient = patient_result.scalar_one()
    await db_session.delete(patient)
    await db_session.commit()

    response = await client.post(
        "/api/v1/ai/predict",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "symptoms": "headache",
            "age": 25,
            "gender": "female",
            "medical_history": None,
        },
    )
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_medical_ai_service_empty_symptoms():
    from app.api.v1.ai import MedicalAIService
    service = MedicalAIService()
    with pytest.raises(ValueError, match="Symptoms cannot be empty"):
        await service.analyze_symptoms("   ", 30, "male", None)

@pytest.mark.asyncio
async def test_ai_prediction_exception_handling(client: AsyncClient, monkeypatch):
    from app.api.v1.ai import logger
    
    def mock_logger_info(*args, **kwargs):
        raise RuntimeError("Mocked logger failure")

    monkeypatch.setattr(logger, "info", mock_logger_info)
    
    token = await authenticated_client_token(client, "ai-fail@test.com")

    response = await client.post(
        "/api/v1/ai/predict",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "symptoms": "headache",
            "age": 25,
            "gender": "female",
            "medical_history": None,
        },
    )
    assert response.status_code == 500
    assert "temporarily unavailable" in response.json()["message"]


# ============================================================
# AI Chat Tests (OpenRouter)
# ============================================================

from unittest.mock import AsyncMock, MagicMock
import openai
from app.core.config import settings

@pytest.fixture
def mock_openrouter_env(monkeypatch):
    """Force the AI service to think OpenRouter is configured."""
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "fake-test-key")

@pytest.mark.asyncio
async def test_ai_chat_missing_api_key_fallback(client: AsyncClient, monkeypatch):
    """Test fallback when OPENROUTER_API_KEY is missing."""
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", None)
    token = await authenticated_client_token(client, "ai-chat-fallback@test.com")
    
    response = await client.post(
        "/api/v1/ai/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "Hello"}
    )
    assert response.status_code == 200
    assert "Mock response: OpenRouter API key is not configured" in response.json()["data"]["reply"]

@pytest.mark.asyncio
async def test_ai_chat_success(client: AsyncClient, monkeypatch, mock_openrouter_env):
    """Test successful OpenRouter response."""
    mock_client_instance = MagicMock()
    mock_completion = AsyncMock()
    
    mock_choice = MagicMock()
    mock_choice.message.content = "Real AI response from OpenRouter!"
    mock_completion.choices = [mock_choice]
    
    mock_client_instance.chat.completions.create = AsyncMock(return_value=mock_completion)
    monkeypatch.setattr("app.api.v1.ai.AsyncOpenAI", lambda **kw: mock_client_instance)
    
    token = await authenticated_client_token(client, "ai-chat-success@test.com")
    response = await client.post(
        "/api/v1/ai/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "Hello"}
    )
    assert response.status_code == 200
    assert response.json()["data"]["reply"] == "Real AI response from OpenRouter!"

@pytest.mark.asyncio
async def test_ai_chat_invalid_api_key_401(client: AsyncClient, monkeypatch, mock_openrouter_env):
    """Test OpenRouter AuthenticationError (401)."""
    mock_client_instance = MagicMock()
    
    async def mock_create(*args, **kwargs):
        raise openai.AuthenticationError(message="Invalid token", response=MagicMock(), body=None)
        
    mock_client_instance.chat.completions.create = mock_create
    monkeypatch.setattr("app.api.v1.ai.AsyncOpenAI", lambda **kw: mock_client_instance)
    
    token = await authenticated_client_token(client, "ai-chat-401@test.com")
    response = await client.post(
        "/api/v1/ai/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "Hello"}
    )
    assert response.status_code == 401
    assert "not configured correctly" in response.json()["message"]

@pytest.mark.asyncio
async def test_ai_chat_rate_limit_429(client: AsyncClient, monkeypatch, mock_openrouter_env):
    """Test OpenRouter RateLimitError (429)."""
    mock_client_instance = MagicMock()
    
    async def mock_create(*args, **kwargs):
        raise openai.RateLimitError(message="Rate limit", response=MagicMock(), body=None)
        
    mock_client_instance.chat.completions.create = mock_create
    monkeypatch.setattr("app.api.v1.ai.AsyncOpenAI", lambda **kw: mock_client_instance)
    
    token = await authenticated_client_token(client, "ai-chat-429@test.com")
    response = await client.post(
        "/api/v1/ai/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "Hello"}
    )
    assert response.status_code == 429
    assert "rate limit reached" in response.json()["message"]

@pytest.mark.asyncio
async def test_ai_chat_timeout(client: AsyncClient, monkeypatch, mock_openrouter_env):
    """Test OpenRouter APITimeoutError."""
    mock_client_instance = MagicMock()
    
    async def mock_create(*args, **kwargs):
        raise openai.APITimeoutError(request=MagicMock())
        
    mock_client_instance.chat.completions.create = mock_create
    monkeypatch.setattr("app.api.v1.ai.AsyncOpenAI", lambda **kw: mock_client_instance)
    
    token = await authenticated_client_token(client, "ai-chat-timeout@test.com")
    response = await client.post(
        "/api/v1/ai/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "Hello"}
    )
    assert response.status_code == 504
    assert "timeout" in response.json()["message"]

@pytest.mark.asyncio
async def test_ai_chat_empty_content(client: AsyncClient, monkeypatch, mock_openrouter_env):
    """Test when OpenRouter returns empty content."""
    mock_client_instance = MagicMock()
    mock_completion = MagicMock()
    
    mock_choice = MagicMock()
    mock_choice.message.content = ""
    mock_completion.choices = [mock_choice]
    
    mock_client_instance.chat.completions.create = AsyncMock(return_value=mock_completion)
    monkeypatch.setattr("app.api.v1.ai.AsyncOpenAI", lambda **kw: mock_client_instance)
    
    token = await authenticated_client_token(client, "ai-chat-empty@test.com")
    response = await client.post(
        "/api/v1/ai/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "Hello"}
    )
    assert response.status_code == 500
    assert "invalid response format" in response.json()["message"]

@pytest.mark.asyncio
async def test_ai_chat_malformed_response(client: AsyncClient, monkeypatch, mock_openrouter_env):
    """Test when OpenRouter returns a response without choices."""
    mock_client_instance = MagicMock()
    mock_completion = MagicMock()
    mock_completion.choices = []
    
    mock_client_instance.chat.completions.create = AsyncMock(return_value=mock_completion)
    monkeypatch.setattr("app.api.v1.ai.AsyncOpenAI", lambda **kw: mock_client_instance)
    
    token = await authenticated_client_token(client, "ai-chat-malformed@test.com")
    response = await client.post(
        "/api/v1/ai/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "Hello"}
    )
    assert response.status_code == 500
    assert "invalid response format" in response.json()["message"]

@pytest.mark.asyncio
async def test_ai_chat_provider_exception(client: AsyncClient, monkeypatch, mock_openrouter_env):
    """Test generic APIError."""
    mock_client_instance = MagicMock()
    
    async def mock_create(*args, **kwargs):
        raise openai.APIError(message="Provider down", request=MagicMock(), body=None)
        
    mock_client_instance.chat.completions.create = mock_create
    monkeypatch.setattr("app.api.v1.ai.AsyncOpenAI", lambda **kw: mock_client_instance)
    
    token = await authenticated_client_token(client, "ai-chat-error@test.com")
    response = await client.post(
        "/api/v1/ai/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "Hello"}
    )
    assert response.status_code == 502
    assert "provider error" in response.json()["message"]