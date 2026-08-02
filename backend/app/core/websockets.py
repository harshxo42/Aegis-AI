"""
Aegis AI – Enterprise WebSocket Manager

Uses Redis Pub/Sub to synchronize WebSocket messages across multiple Uvicorn instances.
"""

import json
import asyncio
from typing import Dict, List, Any
from fastapi import WebSocket
from app.core.redis import get_redis

class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.channels: Dict[str, List[WebSocket]] = {}
        self.pubsub_task = None
        
    async def _pubsub_listener(self):
        """Listen to Redis Pub/Sub for broadcast messages."""
        redis = get_redis()
        pubsub = redis.pubsub()
        await pubsub.subscribe("aegis_ws_broadcast")
        
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

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        
        # Start pubsub listener if not already running
        if self.pubsub_task is None:
            self.pubsub_task = asyncio.create_task(self._pubsub_listener())

    def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: Dict[str, Any], user_id: str) -> None:
        """Publish message to Redis for a specific user."""
        redis = get_redis()
        await redis.publish("aegis_ws_broadcast", json.dumps({
            "user_id": user_id,
            "payload": message
        }))

    async def _local_send_personal(self, message: Dict[str, Any], user_id: str) -> None:
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def broadcast(self, message: Dict[str, Any]) -> None:
        redis = get_redis()
        await redis.publish("aegis_ws_broadcast", json.dumps({
            "payload": message
        }))

    async def _local_broadcast(self, message: Dict[str, Any]) -> None:
        for user_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def join_channel(self, websocket: WebSocket, channel_id: str) -> None:
        if channel_id not in self.channels:
            self.channels[channel_id] = []
        self.channels[channel_id].append(websocket)

    def leave_channel(self, websocket: WebSocket, channel_id: str) -> None:
        if channel_id in self.channels:
            if websocket in self.channels[channel_id]:
                self.channels[channel_id].remove(websocket)
            if not self.channels[channel_id]:
                del self.channels[channel_id]

    async def broadcast_to_channel(self, message: Dict[str, Any], channel_id: str) -> None:
        redis = get_redis()
        await redis.publish("aegis_ws_broadcast", json.dumps({
            "channel": channel_id,
            "payload": message
        }))

    async def _local_broadcast_to_channel(self, message: Dict[str, Any], channel_id: str) -> None:
        if channel_id in self.channels:
            for connection in self.channels[channel_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()
