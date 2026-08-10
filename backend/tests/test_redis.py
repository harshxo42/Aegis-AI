import json

import pytest

import app.core.redis as redis_module


class FakePool:
    def __init__(self):
        self.disconnect_called = False

    async def disconnect(self):
        self.disconnect_called = True


class FakeRedisClient:
    def __init__(self):
        self.get_values = {}
        self.set_calls = []
        self.delete_calls = []

    async def get(self, key):
        return self.get_values.get(key)

    async def set(self, key, value, ex=None):
        self.set_calls.append((key, value, ex))

    async def delete(self, key):
        self.delete_calls.append(key)


@pytest.mark.asyncio
async def test_init_redis(monkeypatch):
    fake_pool = FakePool()

    def fake_from_url(url, decode_responses, max_connections):
        assert url == redis_module.settings.REDIS_URL
        assert decode_responses is True
        assert max_connections == 10
        return fake_pool

    monkeypatch.setattr(
        redis_module.ConnectionPool,
        "from_url",
        fake_from_url,
    )

    redis_module.redis_pool = None

    await redis_module.init_redis()

    assert redis_module.redis_pool is fake_pool


@pytest.mark.asyncio
async def test_close_redis_when_pool_exists():
    fake_pool = FakePool()

    redis_module.redis_pool = fake_pool

    await redis_module.close_redis()

    assert fake_pool.disconnect_called is True
    assert redis_module.redis_pool is fake_pool


@pytest.mark.asyncio
async def test_close_redis_when_pool_is_none():
    redis_module.redis_pool = None

    await redis_module.close_redis()

    assert redis_module.redis_pool is None


def test_get_redis_without_initialized_pool():
    redis_module.redis_pool = None

    with pytest.raises(
        RuntimeError,
        match="Redis pool is not initialized",
    ):
        redis_module.get_redis()


def test_get_redis_with_initialized_pool(monkeypatch):
    fake_pool = FakePool()

    redis_module.redis_pool = fake_pool

    fake_client = object()

    def fake_redis_constructor(connection_pool):
        assert connection_pool is fake_pool
        return fake_client

    monkeypatch.setattr(
        redis_module,
        "Redis",
        fake_redis_constructor,
    )

    result = redis_module.get_redis()

    assert result is fake_client


@pytest.mark.asyncio
async def test_cache_get_existing_value(monkeypatch):
    fake_client = FakeRedisClient()

    payload = {
        "name": "Aegis AI",
        "status": "active",
        "count": 10,
    }

    fake_client.get_values["test-key"] = json.dumps(payload)

    monkeypatch.setattr(
        redis_module,
        "get_redis",
        lambda: fake_client,
    )

    result = await redis_module.cache_get("test-key")

    assert result == payload


@pytest.mark.asyncio
async def test_cache_get_missing_value(monkeypatch):
    fake_client = FakeRedisClient()

    monkeypatch.setattr(
        redis_module,
        "get_redis",
        lambda: fake_client,
    )

    result = await redis_module.cache_get("missing-key")

    assert result is None


@pytest.mark.asyncio
async def test_cache_set_default_expiration(monkeypatch):
    fake_client = FakeRedisClient()

    monkeypatch.setattr(
        redis_module,
        "get_redis",
        lambda: fake_client,
    )

    value = {
        "user_id": 123,
        "role": "patient",
    }

    await redis_module.cache_set(
        "user-key",
        value,
    )

    assert len(fake_client.set_calls) == 1

    key, serialized_value, expire = fake_client.set_calls[0]

    assert key == "user-key"
    assert json.loads(serialized_value) == value
    assert expire == 3600


@pytest.mark.asyncio
async def test_cache_set_custom_expiration(monkeypatch):
    fake_client = FakeRedisClient()

    monkeypatch.setattr(
        redis_module,
        "get_redis",
        lambda: fake_client,
    )

    value = {
        "message": "cached data",
    }

    await redis_module.cache_set(
        "custom-key",
        value,
        expire=120,
    )

    assert len(fake_client.set_calls) == 1

    key, serialized_value, expire = fake_client.set_calls[0]

    assert key == "custom-key"
    assert json.loads(serialized_value) == value
    assert expire == 120


@pytest.mark.asyncio
async def test_cache_delete(monkeypatch):
    fake_client = FakeRedisClient()

    monkeypatch.setattr(
        redis_module,
        "get_redis",
        lambda: fake_client,
    )

    await redis_module.cache_delete("delete-key")

    assert fake_client.delete_calls == ["delete-key"]


@pytest.mark.asyncio
async def test_cache_get_uses_get_redis(monkeypatch):
    fake_client = FakeRedisClient()

    fake_client.get_values["number"] = json.dumps(12345)

    calls = []

    def fake_get_redis():
        calls.append(True)
        return fake_client

    monkeypatch.setattr(
        redis_module,
        "get_redis",
        fake_get_redis,
    )

    result = await redis_module.cache_get("number")

    assert result == 12345
    assert calls == [True]


@pytest.mark.asyncio
async def test_cache_set_serializes_list(monkeypatch):
    fake_client = FakeRedisClient()

    monkeypatch.setattr(
        redis_module,
        "get_redis",
        lambda: fake_client,
    )

    value = [
        "emergency",
        "hospital",
        "ambulance",
    ]

    await redis_module.cache_set(
        "list-key",
        value,
        expire=60,
    )

    assert len(fake_client.set_calls) == 1

    key, serialized_value, expire = fake_client.set_calls[0]

    assert key == "list-key"
    assert json.loads(serialized_value) == value
    assert expire == 60