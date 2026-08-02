"""
Aegis AI – Redis Configuration

Enterprise-grade Redis connection management and caching utilities using redis.asyncio.
"""

import json
from typing import Any, Optional
from redis.asyncio import Redis, ConnectionPool
from app.core.config import settings

# Create a connection pool for Redis
redis_pool: Optional[ConnectionPool] = None

async def init_redis() -> None:
    """Initialize the Redis connection pool."""
    global redis_pool
    redis_pool = ConnectionPool.from_url(
        settings.REDIS_URL, 
        decode_responses=True, 
        max_connections=10
    )

async def close_redis() -> None:
    """Close the Redis connection pool."""
    global redis_pool
    if redis_pool is not None:
        await redis_pool.disconnect()

def get_redis() -> Redis:
    """Get a Redis client from the connection pool."""
    if redis_pool is None:
        raise RuntimeError("Redis pool is not initialized")
    return Redis(connection_pool=redis_pool)

async def cache_get(key: str) -> Optional[Any]:
    """Get a value from cache and deserialize it."""
    client = get_redis()
    val = await client.get(key)
    if val:
        return json.loads(val)
    return None

async def cache_set(key: str, value: Any, expire: int = 3600) -> None:
    """Serialize a value and store it in cache with expiration."""
    client = get_redis()
    await client.set(key, json.dumps(value), ex=expire)

async def cache_delete(key: str) -> None:
    """Delete a value from cache."""
    client = get_redis()
    await client.delete(key)
