"""
Aegis AI - Production Smoke Tests

Safe, read-only-ish smoke checks against the LIVE FastAPI backend.
Authentication uses an existing test account; the suite does NOT create
or delete production users/data.

Required environment variables:
    SMOKE_EMAIL       Existing Aegis AI test user's email
    SMOKE_PASSWORD    Existing Aegis AI test user's password

Optional:
    AEGIS_BASE_URL            Default: https://aegis-ai-1-eu4a.onrender.com
    SMOKE_FRONTEND_ORIGIN     Default: https://aegis-kh6m42xjv-harssx.vercel.app
    SMOKE_TIMEOUT             Default: 30 seconds

Run from backend directory:
    pytest -q tests/test_production_smoke.py -v

PowerShell example:
    $env:SMOKE_EMAIL="your-test-email@example.com"
    $env:SMOKE_PASSWORD="your-test-password"
    pytest -q tests/test_production_smoke.py -v

IMPORTANT:
- Do not commit real passwords to Git.
- Use a dedicated non-production/smoke-test account if possible.
- These tests intentionally avoid destructive POST/PUT/DELETE business endpoints.
"""

import os
from typing import Any

import pytest
import httpx


BASE_URL = os.getenv(
    "AEGIS_BASE_URL",
    "https://aegis-ai-1-eu4a.onrender.com",
).rstrip("/")

FRONTEND_ORIGIN = os.getenv(
    "SMOKE_FRONTEND_ORIGIN",
    "https://aegis-kh6m42xjv-harssx.vercel.app",
)

EMAIL = os.getenv("SMOKE_EMAIL")
PASSWORD = os.getenv("SMOKE_PASSWORD")
TIMEOUT = float(os.getenv("SMOKE_TIMEOUT", "30"))

API_PREFIX = "/api/v1"


def _payload(response: httpx.Response) -> Any:
    """Return JSON if available, otherwise None."""
    try:
        return response.json()
    except ValueError:
        return None


def _data(payload: Any) -> Any:
    """Support both direct responses and {data: ...} envelopes."""
    if isinstance(payload, dict) and "data" in payload:
        return payload["data"]
    return payload


def _extract_access_token(payload: Any) -> str | None:
    """
    Support common Aegis response shapes, e.g.
      {"tokens": {"access_token": "..."}}
      {"data": {"tokens": {"access_token": "..."}}}
      {"access_token": "..."}
      {"data": {"access_token": "..."}}
    """
    candidates = [payload, _data(payload)]

    for obj in candidates:
        if not isinstance(obj, dict):
            continue

        token = obj.get("access_token")
        if isinstance(token, str) and token:
            return token

        tokens = obj.get("tokens")
        if isinstance(tokens, dict):
            token = tokens.get("access_token")
            if isinstance(token, str) and token:
                return token

    return None


def _assert_2xx(response: httpx.Response, label: str) -> None:
    """Give a useful failure message instead of only 'assert 200'."""
    assert 200 <= response.status_code < 300, (
        f"{label} failed: HTTP {response.status_code}\n"
        f"URL: {response.request.method} {response.request.url}\n"
        f"Response: {response.text[:2000]}"
    )


@pytest.fixture(scope="module")
def client():
    with httpx.Client(
        base_url=BASE_URL,
        timeout=TIMEOUT,
        follow_redirects=True,
        headers={"Accept": "application/json"},
    ) as c:
        yield c


@pytest.fixture(scope="module")
def access_token(client: httpx.Client) -> str:
    if not EMAIL or not PASSWORD:
        pytest.fail(
            "Missing SMOKE_EMAIL / SMOKE_PASSWORD. "
            "Set them in PowerShell before running production smoke tests."
        )

    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={
            "email": EMAIL,
            "password": PASSWORD,
        },
    )

    _assert_2xx(response, "Authentication login")

    token = _extract_access_token(_payload(response))
    assert token, (
        "Login succeeded but no access_token was found in the response.\n"
        f"Response: {response.text[:2000]}"
    )
    return token


def auth_headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }


# ---------------------------------------------------------------------------
# Infrastructure / deployment
# ---------------------------------------------------------------------------

def test_root_endpoint(client):
    response = client.get("/")
    _assert_2xx(response, "Root endpoint")

    payload = _payload(response)
    assert isinstance(payload, dict)
    assert "name" in payload
    assert "version" in payload


def test_health_endpoint(client):
    response = client.get("/health")
    _assert_2xx(response, "Health endpoint")

    payload = _payload(response)
    assert isinstance(payload, dict)
    assert payload.get("status") == "healthy"


def test_api_health_endpoint(client):
    response = client.get(f"{API_PREFIX}/health")
    _assert_2xx(response, "API health endpoint")

    payload = _payload(response)
    assert isinstance(payload, dict)
    assert payload.get("status") == "healthy"


def test_openapi_is_available(client):
    response = client.get("/api/openapi.json")
    _assert_2xx(response, "OpenAPI endpoint")

    payload = _payload(response)
    assert isinstance(payload, dict)
    assert "paths" in payload
    assert isinstance(payload["paths"], dict)
    assert len(payload["paths"]) > 0


def test_docs_is_available(client):
    response = client.get("/api/docs")
    _assert_2xx(response, "Swagger docs")


# ---------------------------------------------------------------------------
# CORS - directly checks the production problem you just fixed
# ---------------------------------------------------------------------------

def test_production_cors_preflight(client):
    response = client.options(
        f"{API_PREFIX}/auth/register",
        headers={
            "Origin": FRONTEND_ORIGIN,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,authorization",
        },
    )

    assert response.status_code in (200, 204), (
        f"CORS preflight failed: HTTP {response.status_code}\n"
        f"Response: {response.text[:2000]}"
    )

    allow_origin = response.headers.get("access-control-allow-origin")
    assert allow_origin == FRONTEND_ORIGIN, (
        "Production CORS is not allowing the configured Vercel origin.\n"
        f"Expected: {FRONTEND_ORIGIN}\n"
        f"Actual: {allow_origin}\n"
        f"Headers: {dict(response.headers)}"
    )


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

def test_login_and_token_generation(access_token):
    assert isinstance(access_token, str)
    assert len(access_token) > 20


def test_authenticated_me_endpoint(client, access_token):
    response = client.get(
        f"{API_PREFIX}/auth/me",
        headers=auth_headers(access_token),
    )
    _assert_2xx(response, "Authenticated /auth/me")

    payload = _payload(response)
    assert payload is not None


def test_unauthenticated_me_is_rejected(client):
    response = client.get(f"{API_PREFIX}/auth/me")
    assert response.status_code in (401, 403), (
        f"/auth/me should reject requests without a token, "
        f"got HTTP {response.status_code}: {response.text[:1000]}"
    )


# ---------------------------------------------------------------------------
# Public hospital API
# ---------------------------------------------------------------------------

def test_hospitals_list_endpoint(client):
    response = client.get(
        f"{API_PREFIX}/hospitals/",
        params={"page": 1, "per_page": 5},
    )
    _assert_2xx(response, "Hospitals list")

    payload = _payload(response)
    assert isinstance(payload, dict)


# ---------------------------------------------------------------------------
# Patient API
# ---------------------------------------------------------------------------

def test_authenticated_patient_profile(client, access_token):
    response = client.get(
        f"{API_PREFIX}/patients/me",
        headers=auth_headers(access_token),
    )

    # A patient account should return 2xx. If the smoke account has another
    # role, 403 is useful information rather than a server failure.
    assert response.status_code in (200, 403), (
        f"Patient profile endpoint failed: HTTP {response.status_code}\n"
        f"Response: {response.text[:2000]}"
    )

    if response.status_code == 200:
        assert _payload(response) is not None


# ---------------------------------------------------------------------------
# API inventory - catches accidental missing routes after deployment
# ---------------------------------------------------------------------------

def test_expected_core_routes_are_registered(client):
    response = client.get("/api/openapi.json")
    _assert_2xx(response, "OpenAPI endpoint")

    paths = _payload(response)["paths"]

    expected = {
        "/": "GET",
        "/health": "GET",
        "/api/v1/health": "GET",
        "/api/v1/auth/register": "POST",
        "/api/v1/auth/login": "POST",
        "/api/v1/auth/me": "GET",
        "/api/v1/hospitals/": "GET",
        "/api/v1/patients/me": "GET",
    }

    missing = [
        f"{method} {path}"
        for path, method in expected.items()
        if path not in paths or method.lower() not in paths[path]
    ]

    assert not missing, (
        "Expected core routes are missing from production OpenAPI:\n"
        + "\n".join(missing)
    )   
