"""Request observability: request IDs, access logs, timing metrics and error capture."""

import hashlib
import re
import time
import uuid
from datetime import UTC, datetime

import structlog
from sqlalchemy.dialects.postgresql import insert
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from ..db import SessionLocal
from ..models import ErrorEvent, RequestMetric
from .logging import log

REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9-]{8,64}$")
SKIP_METRICS = {"/health", "/ready"}


def _route_template(request: Request) -> str:
    route = request.scope.get("route")
    return getattr(route, "path", None) or "unmatched"


def record_metric(route: str, method: str, status: int, duration_ms: float) -> None:
    try:
        with SessionLocal() as db:
            db.add(RequestMetric(route=route[:120], method=method, status=status, duration_ms=duration_ms))
            db.commit()
    except Exception:  # metrics must never break a request
        log.warning("metric_write_failed")


def record_error(exc: BaseException, route: str, request_id: str) -> None:
    message = f"{type(exc).__name__}: {exc}"[:500]
    fingerprint = hashlib.sha256(f"{type(exc).__name__}:{route}".encode()).hexdigest()
    try:
        with SessionLocal() as db:
            stmt = insert(ErrorEvent).values(fingerprint=fingerprint, message=message, route=route[:120], last_request_id=request_id)
            stmt = stmt.on_conflict_do_update(
                index_elements=[ErrorEvent.fingerprint],
                set_={
                    "count": ErrorEvent.count + 1,
                    "last_seen": datetime.now(UTC),
                    "message": message,
                    "last_request_id": request_id,
                },
            )
            db.execute(stmt)
            db.commit()
    except Exception:
        log.warning("error_event_write_failed")


class ObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        incoming = request.headers.get("x-request-id", "")
        request_id = incoming if REQUEST_ID_RE.match(incoming) else uuid.uuid4().hex
        request.state.request_id = request_id
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id, method=request.method, path=request.url.path)
        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception as exc:
            duration = (time.perf_counter() - start) * 1000
            route = _route_template(request)
            log.exception("unhandled_error", route=route, duration_ms=round(duration, 1))
            record_error(exc, route, request_id)
            record_metric(route, request.method, 500, duration)
            return JSONResponse(
                {"detail": "Something went wrong on our side.", "request_id": request_id},
                status_code=500,
                headers={"X-Request-ID": request_id},
            )
        duration = (time.perf_counter() - start) * 1000
        route = _route_template(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["Server-Timing"] = f"app;dur={duration:.1f}"
        if request.url.path not in SKIP_METRICS:
            principal = getattr(request.state, "principal", None)
            log.info(
                "request",
                route=route,
                status=response.status_code,
                duration_ms=round(duration, 1),
                role=getattr(principal, "role", "visitor"),
            )
            record_metric(route, request.method, response.status_code, duration)
        return response
