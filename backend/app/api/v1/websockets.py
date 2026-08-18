"""
Aegis AI – WebSockets & Notifications API
"""

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, get_current_user
from app.core.websockets import manager
from app.models.user import User
from app.models.notification import Notification
from app.schemas.common import SuccessResponse
from jose import jwt
from app.core.config import settings

router = APIRouter(tags=["Realtime & Notifications"])


from app.core.security import verify_access_token


async def get_user_from_token(token: str, db: AsyncSession) -> User | None:
    """Helper to authenticate websocket connections via token query param."""
    try:
        payload = verify_access_token(token)
        if not payload:
            return None

        # Check if token is blacklisted/revoked in Redis
        try:
            from app.core.redis import cache_get
            is_revoked = await cache_get(f"revoked_token:{token}")
            if is_revoked:
                return None
        except Exception:
            pass

        user_id = payload.get("sub")
        if user_id is None:
            return None
            
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user and user.is_active:
            return user
        return None
    except Exception:
        return None


from app.models.patient import Patient
from app.models.emergency import EmergencyRequest


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
) -> None:
    """
    Main WebSocket endpoint for real-time app events.
    Clients connect with ?token=<jwt_token>
    """
    user = await get_user_from_token(token, db)
    if user is None:
        await websocket.close(code=1008, reason="Invalid token")
        return

    await manager.connect(websocket, str(user.id))
    try:
        while True:
            data = await websocket.receive_json()
            
            # Handle specific client actions
            action = data.get("action")
            
            if action == "subscribe_emergency":
                emergency_id = data.get("emergency_id")
                if emergency_id is not None:
                    # Security check: verify user has permission to subscribe to this emergency
                    is_authorized = True
                    if user.role.value == "patient":
                        patient_res = await db.execute(
                            select(Patient).where(Patient.user_id == user.id)
                        )
                        patient = patient_res.scalar_one_or_none()
                        if not patient:
                            is_authorized = False
                        else:
                            em_res = await db.execute(
                                select(EmergencyRequest).where(EmergencyRequest.id == str(emergency_id))
                            )
                            emergency = em_res.scalar_one_or_none()
                            if not emergency or emergency.patient_id != patient.id:
                                is_authorized = False

                    if is_authorized:
                        await manager.join_channel(websocket, f"emergency_{emergency_id}")
                        await websocket.send_json({
                            "type": "subscribed",
                            "channel": f"emergency_{emergency_id}",
                            "status": "success",
                        })
                    else:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Unauthorized to subscribe to this emergency channel",
                        })

            elif action == "unsubscribe_emergency":
                emergency_id = data.get("emergency_id")
                if emergency_id is not None:
                    manager.leave_channel(websocket, f"emergency_{emergency_id}")
                    await websocket.send_json({
                        "type": "unsubscribed",
                        "channel": f"emergency_{emergency_id}",
                        "status": "success",
                    })

            elif action == "update_location":
                # For ambulance drivers and authorized responders
                if user.role.value in ("ambulance_driver", "doctor", "hospital_admin", "government_admin"):
                    emergency_id = data.get("emergency_id")
                    lat = data.get("lat")
                    lng = data.get("lng")
                    if emergency_id is not None and lat is not None and lng is not None:
                        # Broadcast to everyone watching this emergency
                        await manager.broadcast_to_channel(
                            {
                                "type": "location_update",
                                "data": {"lat": lat, "lng": lng}
                            },
                            f"emergency_{emergency_id}"
                        )
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Unauthorized to broadcast location updates",
                    })

            elif action == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(websocket, str(user.id))



@router.get(
    "/api/v1/notifications",
    response_model=SuccessResponse,
    summary="Get user notifications",
)
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SuccessResponse:
    """Get all notifications for the current user."""
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    notifications = result.scalars().all()
    
    return SuccessResponse(
        message="Notifications retrieved",
        data=[
            {
                "id": str(n.id) if n.id is not None else "",
                "title": n.title,
                "message": n.message,
                "type": n.notification_type.value if hasattr(n.notification_type, 'value') else n.notification_type,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at is not None else None
            } for n in notifications
        ]
    )

@router.put(
    "/api/v1/notifications/{notification_id}/read",
    response_model=SuccessResponse,
)
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SuccessResponse:
    """Mark a notification as read."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    notification = result.scalar_one_or_none()
    
    if notification is not None:
        notification.is_read = True
        await db.commit()
        
    return SuccessResponse(message="Notification marked as read")
