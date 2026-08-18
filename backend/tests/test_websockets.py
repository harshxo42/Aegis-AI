"""
Aegis AI – Real-time WebSocket & Notification Tests
"""

import pytest
from datetime import datetime, timezone
from starlette.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
from sqlalchemy import select

from app.main import app
from app.core.security import create_access_token
from app.core.websockets import manager, create_notification
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.emergency import EmergencyRequest, EmergencyStatus
from app.models.notification import Notification, NotificationType
from app.api.deps import get_db
from app.api.v1.emergencies import create_emergency, update_emergency, cancel_emergency
from app.schemas.emergency import EmergencyCreate, EmergencyUpdate


async def create_user(db_session, email: str, role: UserRole) -> User:
    user = User(
        email=email,
        password_hash="$2b$12$eXampleHashForTestingOnly123456789012345678901234567890",
        full_name="Test User",
        role=role,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


async def create_patient_with_user(db_session, email: str) -> tuple[User, Patient]:
    user = await create_user(db_session, email, UserRole.PATIENT)
    patient = Patient(
        user_id=user.id,
        blood_group="A+",
        gender="Other",
    )
    db_session.add(patient)
    await db_session.flush()
    return user, patient


# ============================================================
# WEBSOCKET AUTHENTICATION TESTS
# ============================================================

def test_websocket_missing_token():
    client = TestClient(app)
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/ws"):
            pass
    # 1008 is Policy Violation / 403 on missing query param or invalid token
    assert exc.value.code in (1008, 403, 1000)


@pytest.mark.asyncio
async def test_websocket_invalid_token(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        client = TestClient(app)
        with pytest.raises(WebSocketDisconnect) as exc:
            with client.websocket_connect("/ws?token=invalid_jwt_token_here"):
                pass
        assert exc.value.code == 1008
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_websocket_connect_and_ping(db_session):
    user = await create_user(db_session, f"ws-ping-{datetime.now().timestamp()}@test.com", UserRole.PATIENT)
    token = create_access_token(str(user.id), user.role.value)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        client = TestClient(app)
        with client.websocket_connect(f"/ws?token={token}") as ws:
            ws.send_json({"action": "ping"})
            resp = ws.receive_json()
            assert resp.get("type") == "pong"
    finally:
        app.dependency_overrides.clear()


# ============================================================
# WEBSOCKET EMERGENCY CHANNEL AUTHORIZATION TESTS
# ============================================================

@pytest.mark.asyncio
async def test_websocket_patient_subscribe_own_emergency(db_session):
    user, patient = await create_patient_with_user(db_session, f"ws-sub-own-{datetime.now().timestamp()}@test.com")
    token = create_access_token(str(user.id), user.role.value)

    emergency = EmergencyRequest(
        patient_id=patient.id,
        emergency_type="cardiac",
        severity=5,
        location_lat=28.6139,
        location_lng=77.2090,
        status=EmergencyStatus.REQUESTED,
        requested_at=datetime.now(timezone.utc),
    )
    db_session.add(emergency)
    await db_session.flush()

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        client = TestClient(app)
        with client.websocket_connect(f"/ws?token={token}") as ws:
            ws.send_json({
                "action": "subscribe_emergency",
                "emergency_id": str(emergency.id),
            })
            resp = ws.receive_json()
            assert resp.get("type") == "subscribed"
            assert resp.get("status") == "success"
            assert resp.get("channel") == f"emergency_{emergency.id}"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_websocket_patient_subscribe_other_emergency_rejected(db_session):
    user_a, patient_a = await create_patient_with_user(db_session, f"ws-a-{datetime.now().timestamp()}@test.com")
    user_b, patient_b = await create_patient_with_user(db_session, f"ws-b-{datetime.now().timestamp()}@test.com")
    token_b = create_access_token(str(user_b.id), user_b.role.value)

    # Emergency belongs to Patient A
    emergency = EmergencyRequest(
        patient_id=patient_a.id,
        emergency_type="cardiac",
        severity=5,
        location_lat=28.6139,
        location_lng=77.2090,
        status=EmergencyStatus.REQUESTED,
        requested_at=datetime.now(timezone.utc),
    )
    db_session.add(emergency)
    await db_session.flush()

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        client = TestClient(app)
        with client.websocket_connect(f"/ws?token={token_b}") as ws:
            # Patient B tries to subscribe to Patient A's emergency
            ws.send_json({
                "action": "subscribe_emergency",
                "emergency_id": str(emergency.id),
            })
            resp = ws.receive_json()
            assert resp.get("type") == "error"
            assert "Unauthorized" in resp.get("message", "")
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_websocket_driver_can_subscribe_any_emergency(db_session):
    driver = await create_user(db_session, f"ws-driver-{datetime.now().timestamp()}@test.com", UserRole.AMBULANCE_DRIVER)
    user_p, patient = await create_patient_with_user(db_session, f"ws-p-{datetime.now().timestamp()}@test.com")
    driver_token = create_access_token(str(driver.id), driver.role.value)

    emergency = EmergencyRequest(
        patient_id=patient.id,
        emergency_type="trauma",
        severity=4,
        location_lat=28.6139,
        location_lng=77.2090,
        status=EmergencyStatus.REQUESTED,
        requested_at=datetime.now(timezone.utc),
    )
    db_session.add(emergency)
    await db_session.flush()

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        client = TestClient(app)
        with client.websocket_connect(f"/ws?token={driver_token}") as ws:
            ws.send_json({
                "action": "subscribe_emergency",
                "emergency_id": str(emergency.id),
            })
            resp = ws.receive_json()
            assert resp.get("type") == "subscribed"
            assert resp.get("status") == "success"
    finally:
        app.dependency_overrides.clear()


# ============================================================
# EVENT BROADCAST & NOTIFICATION PERSISTENCE TESTS
# ============================================================

@pytest.mark.asyncio
async def test_create_emergency_persists_notification(db_session):
    user, patient = await create_patient_with_user(db_session, f"em-create-{datetime.now().timestamp()}@test.com")

    data = EmergencyCreate(
        emergency_type="cardiac",
        severity=5,
        description="Chest pain emergency",
        location_lat=28.6139,
        location_lng=77.2090,
    )

    response = await create_emergency(
        data=data,
        current_user=user,
        db=db_session,
    )

    assert response.data["status"] == "requested"

    # Verify notification row created in DB
    result = await db_session.execute(
        select(Notification).where(Notification.user_id == user.id)
    )
    notifications = result.scalars().all()
    assert len(notifications) >= 1
    emergency_notif = next((n for n in notifications if n.notification_type == NotificationType.EMERGENCY), None)
    assert emergency_notif is not None
    assert "Emergency SOS Registered" in emergency_notif.title


@pytest.mark.asyncio
async def test_update_emergency_persists_notification(db_session):
    driver = await create_user(db_session, f"driver-up-{datetime.now().timestamp()}@test.com", UserRole.AMBULANCE_DRIVER)
    user, patient = await create_patient_with_user(db_session, f"patient-up-{datetime.now().timestamp()}@test.com")

    emergency = EmergencyRequest(
        patient_id=patient.id,
        emergency_type="breathing",
        severity=4,
        location_lat=28.6139,
        location_lng=77.2090,
        status=EmergencyStatus.REQUESTED,
        requested_at=datetime.now(timezone.utc),
    )
    db_session.add(emergency)
    await db_session.flush()

    update_data = EmergencyUpdate(status="dispatched")
    await update_emergency(
        emergency_id=emergency.id,
        data=update_data,
        current_user=driver,
        db=db_session,
    )

    # Verify notification row created for the patient
    result = await db_session.execute(
        select(Notification).where(Notification.user_id == user.id)
    )
    notifications = result.scalars().all()
    status_notif = next((n for n in notifications if "Dispatched" in n.title), None)
    assert status_notif is not None


@pytest.mark.asyncio
async def test_cancel_emergency_persists_notification(db_session):
    user, patient = await create_patient_with_user(db_session, f"patient-cancel-{datetime.now().timestamp()}@test.com")

    emergency = EmergencyRequest(
        patient_id=patient.id,
        emergency_type="other",
        severity=3,
        location_lat=28.6139,
        location_lng=77.2090,
        status=EmergencyStatus.REQUESTED,
        requested_at=datetime.now(timezone.utc),
    )
    db_session.add(emergency)
    await db_session.flush()

    await cancel_emergency(
        emergency_id=emergency.id,
        current_user=user,
        db=db_session,
    )

    # Verify notification row created for cancellation
    result = await db_session.execute(
        select(Notification).where(Notification.user_id == user.id)
    )
    notifications = result.scalars().all()
    cancel_notif = next((n for n in notifications if "Cancelled" in n.title), None)
    assert cancel_notif is not None


# ============================================================
# CONNECTION MANAGER DISCONNECT CLEANUP TESTS
# ============================================================

def test_disconnect_channel_cleanup():
    class MockSocket:
        def __init__(self):
            self.closed = False

    sock = MockSocket()
    user_id = "test-user-cleanup-123"
    channel_id = "emergency_cleanup_test_channel"

    manager.active_connections[user_id] = [sock]
    manager.channels[channel_id] = [sock]

    assert sock in manager.active_connections[user_id]
    assert sock in manager.channels[channel_id]

    manager.disconnect(sock, user_id)

    assert user_id not in manager.active_connections
    assert channel_id not in manager.channels
