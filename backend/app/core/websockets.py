"""
Aegis AI – Enterprise WebSocket Manager

Uses Redis Pub/Sub to synchronize WebSocket messages across multiple Uvicorn instances.
"""

import json
import asyncio
from typing import Dict, List, Any, Optional
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import get_redis
from app.models.notification import Notification, NotificationType


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.channels: Dict[str, List[WebSocket]] = {}
        self.pubsub_task: Optional[asyncio.Task] = None

    async def _pubsub_listener(self) -> None:
        """Listen to Redis Pub/Sub for broadcast messages with resilient backoff reconnect."""
        backoff = 1
        max_backoff = 30

        while True:
            try:
                redis = get_redis()
                pubsub = redis.pubsub()
                await pubsub.subscribe("aegis_ws_broadcast")
                backoff = 1  # Reset backoff upon successful subscription

                async for message in pubsub.listen():
                    if message["type"] == "message":
                        try:
                            data = json.loads(message["data"])
                            target_channel = data.get("channel")
                            target_user = data.get("user_id")
                            payload = data.get("payload")

                            if target_channel:
                                await self._local_broadcast_to_channel(payload, target_channel)
                            elif target_user:
                                await self._local_send_personal(payload, target_user)
                            else:
                                await self._local_broadcast(payload)
                        except Exception:
                            pass
            except asyncio.CancelledError:
                break
            except Exception:
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, max_backoff)

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

        # Start pubsub listener if not already running or completed
        if self.pubsub_task is None or self.pubsub_task.done():
            self.pubsub_task = asyncio.create_task(self._pubsub_listener())

    def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        # 1. Remove from active_connections
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

        # 2. Clean up from all channels as well to prevent stale websocket memory leaks
        channels_to_delete = []
        for channel_id, sockets in self.channels.items():
            if websocket in sockets:
                sockets.remove(websocket)
            if not sockets:
                channels_to_delete.append(channel_id)
        for channel_id in channels_to_delete:
            del self.channels[channel_id]

    async def send_personal_message(self, message: Dict[str, Any], user_id: str) -> None:
        """Publish message to Redis for a specific user."""
        try:
            redis = get_redis()
            await redis.publish("aegis_ws_broadcast", json.dumps({
                "user_id": user_id,
                "payload": message
            }))
        except Exception:
            # Fallback to local delivery if Redis fails
            await self._local_send_personal(message, user_id)

    async def _local_send_personal(self, message: Dict[str, Any], user_id: str) -> None:
        if user_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.append(connection)
            for dead in dead_connections:
                if dead in self.active_connections[user_id]:
                    self.active_connections[user_id].remove(dead)

    async def broadcast(self, message: Dict[str, Any]) -> None:
        try:
            redis = get_redis()
            await redis.publish("aegis_ws_broadcast", json.dumps({
                "payload": message
            }))
        except Exception:
            await self._local_broadcast(message)

    async def _local_broadcast(self, message: Dict[str, Any]) -> None:
        for user_id, connections in list(self.active_connections.items()):
            dead_connections = []
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.append(connection)
            for dead in dead_connections:
                if dead in self.active_connections.get(user_id, []):
                    self.active_connections[user_id].remove(dead)

    async def join_channel(self, websocket: WebSocket, channel_id: str) -> None:
        if channel_id not in self.channels:
            self.channels[channel_id] = []
        if websocket not in self.channels[channel_id]:
            self.channels[channel_id].append(websocket)

    def leave_channel(self, websocket: WebSocket, channel_id: str) -> None:
        if channel_id in self.channels:
            if websocket in self.channels[channel_id]:
                self.channels[channel_id].remove(websocket)
            if not self.channels[channel_id]:
                del self.channels[channel_id]

    async def broadcast_to_channel(self, message: Dict[str, Any], channel_id: str) -> None:
        try:
            redis = get_redis()
            await redis.publish("aegis_ws_broadcast", json.dumps({
                "channel": channel_id,
                "payload": message
            }))
        except Exception:
            await self._local_broadcast_to_channel(message, channel_id)

    async def _local_broadcast_to_channel(self, message: Dict[str, Any], channel_id: str) -> None:
        if channel_id in self.channels:
            dead_connections = []
            for connection in self.channels[channel_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.append(connection)
            for dead in dead_connections:
                if dead in self.channels[channel_id]:
                    self.channels[channel_id].remove(dead)
            if not self.channels[channel_id]:
                del self.channels[channel_id]


manager = ConnectionManager()


async def create_notification(
    db: AsyncSession,
    user_id: str,
    title: str,
    message: str,
    notification_type: NotificationType = NotificationType.INFO,
    priority: int = 0,
    action_url: Optional[str] = None,
    action_label: Optional[str] = None,
    icon: Optional[str] = None,
) -> Notification:
    """Helper to create and persist in-app notifications and optionally push via WS."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        priority=priority,
        action_url=action_url,
        action_label=action_label,
        icon=icon,
        is_read=False,
    )
    db.add(notification)
    await db.flush()

    # Real-time WebSocket push to the target user
    try:
        await manager.send_personal_message(
            {
                "type": "notification",
                "data": {
                    "id": str(notification.id),
                    "title": notification.title,
                    "message": notification.message,
                    "notification_type": notification.notification_type.value
                    if hasattr(notification.notification_type, "value")
                    else notification.notification_type,
                    "priority": notification.priority,
                    "action_url": notification.action_url,
                    "action_label": notification.action_label,
                    "created_at": notification.created_at.isoformat()
                    if notification.created_at
                    else None,
                },
            },
            user_id,
        )
    except Exception:
        pass

    return notification
