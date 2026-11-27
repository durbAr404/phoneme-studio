"""Fixed-window rate limiting.

Uses Redis when REDIS_URL is set (needed when the API runs as several instances),
otherwise an in-process store that is fine for a single instance and for tests.
"""

import threading
import time
from collections.abc import Callable

from fastapi import HTTPException, Request

from ..config import get_settings
from .net import ip_hash


class MemoryStore:
    def __init__(self) -> None:
        self._data: dict[str, tuple[int, float]] = {}
        self._lock = threading.Lock()

    def hit(self, key: str, window: int) -> int:
        now = time.time()
        with self._lock:
            count, reset = self._data.get(key, (0, now + window))
            if now > reset:
                count, reset = 0, now + window
            count += 1
            self._data[key] = (count, reset)
            if len(self._data) > 50_000:  # keep memory bounded
                self._data = {k: v for k, v in self._data.items() if v[1] > now}
            return count

    def reset(self) -> None:
        with self._lock:
            self._data.clear()


class RedisStore:
    def __init__(self, url: str) -> None:
        import redis

        self._r = redis.Redis.from_url(url)

    def hit(self, key: str, window: int) -> int:
        pipe = self._r.pipeline()
        pipe.incr(key)
        pipe.expire(key, window, nx=True)
        count, _ = pipe.execute()
        return int(count)

    def reset(self) -> None:  # pragma: no cover - test helper only
        pass


_store: MemoryStore | RedisStore | None = None


def store() -> MemoryStore | RedisStore:
    global _store
    if _store is None:
        url = get_settings().redis_url
        _store = RedisStore(url) if url else MemoryStore()
    return _store


def rate_limit(bucket: str, limit: int, window_seconds: int) -> Callable[[Request], None]:
    """FastAPI dependency: allow `limit` requests per IP per window for this bucket."""

    def dependency(request: Request) -> None:
        key = f"rl:{bucket}:{ip_hash(request)}:{int(time.time() // window_seconds)}"
        count = store().hit(key, window_seconds)
        if count > limit:
            request.state.rate_limited = True
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Wait a little and try again.",
                headers={"Retry-After": str(window_seconds)},
            )

    return dependency
