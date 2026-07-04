import logging
import json
import time

logger = logging.getLogger(__name__)

# Fallback In-Memory cache mimicking redis keys/expiry
class MockRedis:
    def __init__(self):
        self.store = {}
        self.expiries = {}

    def _is_expired(self, key):
        if key in self.expiries:
            if time.time() > self.expiries[key]:
                del self.store[key]
                del self.expiries[key]
                return True
        return False

    def get(self, key):
        if isinstance(key, bytes):
            key = key.decode("utf-8")
        if self._is_expired(key):
            return None
        val = self.store.get(key)
        if val is not None and not isinstance(val, bytes):
            val = str(val).encode("utf-8")
        return val

    def set(self, key, value, ex=None):
        if isinstance(key, bytes):
            key = key.decode("utf-8")
        self.store[key] = value
        if ex:
            self.expiries[key] = time.time() + ex
        elif key in self.expiries:
            del self.expiries[key]
        return True

    def delete(self, key):
        if isinstance(key, bytes):
            key = key.decode("utf-8")
        if key in self.store:
            del self.store[key]
        if key in self.expiries:
            del self.expiries[key]
        return True

    def exists(self, key):
        if isinstance(key, bytes):
            key = key.decode("utf-8")
        return 1 if (key in self.store and not self._is_expired(key)) else 0

    def incr(self, key):
        if isinstance(key, bytes):
            key = key.decode("utf-8")
        if self._is_expired(key) or key not in self.store:
            self.store[key] = 1
        else:
            try:
                self.store[key] = int(self.store[key]) + 1
            except ValueError:
                self.store[key] = 1
        return self.store[key]

    def expire(self, key, seconds):
        if isinstance(key, bytes):
            key = key.decode("utf-8")
        if key in self.store:
            self.expiries[key] = time.time() + seconds
            return True
        return False

redis_client = None

try:
    import redis
    from backend.app.core.config import settings
    # Setup connection
    redis_client = redis.from_url(settings.REDIS_URL, socket_timeout=2)
    redis_client.ping()
    logger.info("Connected to Redis successfully.")
except Exception as e:
    logger.warning(f"Redis connection failed ({e}). Falling back to in-memory key-value cache.")
    redis_client = MockRedis()
