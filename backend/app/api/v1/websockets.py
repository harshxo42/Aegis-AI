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


async def get_user_from_token(token: str, db: AsyncSession) -> User | None:
    """Helper to authenticate websocket connections via token query param."""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            return None
            
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        return user
    except Exception:
        return None


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
                    await manager.join_channel(websocket, f"emergency_{emergency_id}")
            
            elif action == "update_location":
                # For ambulance drivers
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
            
            elif action == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(websocket, str(user.id))
        # Leave any channels if needed (simplified here)


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
