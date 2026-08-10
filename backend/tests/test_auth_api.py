import pytest


@pytest.mark.asyncio
async def test_register_user(client):
    payload = {
        "email": "integration@test.com",
        "password": "StrongPass123",
        "confirm_password": "StrongPass123",
        "full_name": "Integration Test User",
        "role": "patient",
    }

    response = await client.post(
        "/api/v1/auth/register",
        json=payload,
    )

    assert response.status_code == 201

    body = response.json()

    assert body["message"] == "Account created successfully"

    data = body["data"]

    assert data["user"]["email"] == "integration@test.com"
    assert data["user"]["full_name"] == "Integration Test User"
    assert data["user"]["role"] == "patient"

    assert "access_token" in data["tokens"]
    assert "refresh_token" in data["tokens"]
    assert data["tokens"]["access_token"]
    assert data["tokens"]["refresh_token"]
@pytest.mark.asyncio
async def test_login_user(client):
    register_payload = {
        "email": "login@test.com",
        "password": "StrongPass123",
        "confirm_password": "StrongPass123",
        "full_name": "Login Test User",
        "role": "patient",
    }

    register_response = await client.post(
        "/api/v1/auth/register",
        json=register_payload,
    )

    assert register_response.status_code == 201

    login_payload = {
        "email": "login@test.com",
        "password": "StrongPass123",
    }

    response = await client.post(
        "/api/v1/auth/login",
        json=login_payload,
    )

    assert response.status_code == 200

    body = response.json()

    assert body["message"] == "Login successful"

    data = body["data"]

    assert data["user"]["email"] == "login@test.com"
    assert data["user"]["role"] == "patient"

    assert "access_token" in data["tokens"]
    assert "refresh_token" in data["tokens"]
    assert data["tokens"]["access_token"]
    assert data["tokens"]["refresh_token"]
@pytest.mark.asyncio
async def test_get_current_user(client):
    register_payload = {
        "email": "me@test.com",
        "password": "StrongPass123",
        "confirm_password": "StrongPass123",
        "full_name": "Me Test User",
        "role": "patient",
    }

    register_response = await client.post(
        "/api/v1/auth/register",
        json=register_payload,
    )

    assert register_response.status_code == 201

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "me@test.com",
            "password": "StrongPass123",
        },
    )

    assert login_response.status_code == 200

    access_token = login_response.json()["data"]["tokens"]["access_token"]

    response = await client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": f"Bearer {access_token}"
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["message"] == "User profile retrieved"

    user = body["data"]

    assert user["email"] == "me@test.com"
    assert user["full_name"] == "Me Test User"
    assert user["role"] == "patient"
@pytest.mark.asyncio
async def test_get_current_user_without_token(client):
    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 401
@pytest.mark.asyncio
async def test_get_current_user_with_invalid_token(client):
    response = await client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": "Bearer this-is-an-invalid-token"
        },
    )

    assert response.status_code == 401
@pytest.mark.asyncio
async def test_login_with_wrong_password(client):
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrong-password@test.com",
            "password": "StrongPass123",
            "confirm_password": "StrongPass123",
            "full_name": "Wrong Password User",
            "role": "patient",
        },
    )

    assert register_response.status_code == 201

    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "wrong-password@test.com",
            "password": "WrongPassword123",
        },
    )

    assert response.status_code == 401
@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    payload = {
        "email": "duplicate@test.com",
        "password": "StrongPass123",
        "confirm_password": "StrongPass123",
        "full_name": "Duplicate Test User",
        "role": "patient",
    }

    first_response = await client.post(
        "/api/v1/auth/register",
        json=payload,
    )

    assert first_response.status_code == 201


    second_response = await client.post(
        "/api/v1/auth/register",
        json=payload,
    )

    assert second_response.status_code == 409

@pytest.mark.asyncio
async def test_refresh_token(client):
    # register and login
    register_response = await client.post("/api/v1/auth/register", json={
        "email": "refresh@test.com", "password": "StrongPass123", "confirm_password": "StrongPass123", "full_name": "Refresh User", "role": "patient"
    })
    login_response = await client.post("/api/v1/auth/login", json={"email": "refresh@test.com", "password": "StrongPass123"})
    refresh_token = login_response.json()["data"]["tokens"]["refresh_token"]

    # refresh
    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    assert "access_token" in response.json()["data"]

@pytest.mark.asyncio
async def test_change_password(client):
    await client.post("/api/v1/auth/register", json={
        "email": "password@test.com", "password": "StrongPass123", "confirm_password": "StrongPass123", "full_name": "Password User", "role": "patient"
    })
    login_response = await client.post("/api/v1/auth/login", json={"email": "password@test.com", "password": "StrongPass123"})
    access_token = login_response.json()["data"]["tokens"]["access_token"]

    response = await client.put("/api/v1/auth/change-password", json={
        "current_password": "StrongPass123", "new_password": "NewStrongPass123", "confirm_password": "NewStrongPass123"
    }, headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200

    # verify new password works
    login2 = await client.post("/api/v1/auth/login", json={"email": "password@test.com", "password": "NewStrongPass123"})
    assert login2.status_code == 200

@pytest.mark.asyncio
async def test_logout(client):
    await client.post("/api/v1/auth/register", json={
        "email": "logout@test.com", "password": "StrongPass123", "confirm_password": "StrongPass123", "full_name": "Logout User", "role": "patient"
    })
    login_response = await client.post("/api/v1/auth/login", json={"email": "logout@test.com", "password": "StrongPass123"})
    access_token = login_response.json()["data"]["tokens"]["access_token"]

    response = await client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200