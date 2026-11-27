"""Health checks, browser telemetry and scheduled maintenance."""

import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import delete, func, select, text
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db
from ..models import AuthEvent, Play, RequestMetric, UserSession, WebVital
from ..schemas import VitalIn
from ..security.ratelimit import rate_limit
from ..services.alerts import send_alert

router = APIRouter(tags=["ops"])


@router.get("/health")
def health() -> dict[str, str]:
    """Liveness: the process is up."""
    return {"status": "ok", "release": get_settings().release}


@router.get("/ready")
def ready(db: Session = Depends(get_db)) -> dict[str, str]:
    """Readiness: the database answers."""
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(503, "Database unavailable") from exc
    return {"status": "ready"}


@router.post("/telemetry/vitals", status_code=204, dependencies=[Depends(rate_limit("vitals", 300, 3600))])
def vitals(body: VitalIn, db: Session = Depends(get_db)) -> None:
    db.add(WebVital(name=body.name, value=body.value, page=body.page[:120]))
    db.commit()


@router.api_route("/internal/cron/cleanup", methods=["GET", "POST"], include_in_schema=False)
def cleanup(authorization: str = Header(""), db: Session = Depends(get_db)) -> dict[str, Any]:
    """Daily job (Vercel Cron sends GET, GitHub Actions can POST): data retention plus a sign-in anomaly check."""
    secret = get_settings().cron_secret
    if not secret or not secrets.compare_digest(authorization, f"Bearer {secret}"):
        raise HTTPException(401, "Unauthorised")
    now = datetime.now(UTC)
    deleted = {
        "plays": db.execute(delete(Play).where(Play.created_at < now - timedelta(days=90), Play.is_demo.is_(False))).rowcount,
        "metrics": db.execute(delete(RequestMetric).where(RequestMetric.created_at < now - timedelta(days=14))).rowcount,
        "vitals": db.execute(delete(WebVital).where(WebVital.created_at < now - timedelta(days=30))).rowcount,
        "sessions": db.execute(delete(UserSession).where(UserSession.expires_at < now - timedelta(days=1))).rowcount,
        "auth_events": db.execute(delete(AuthEvent).where(AuthEvent.created_at < now - timedelta(days=90))).rowcount,
    }
    db.commit()
    failed = db.scalar(select(func.count()).where(AuthEvent.kind == "login_failed", AuthEvent.created_at > now - timedelta(days=1))) or 0
    if failed > 50:
        send_alert("Unusual sign-in failures", f"{failed} failed sign-ins in the last 24 hours")
    return {"deleted": deleted, "failed_logins_24h": failed}
