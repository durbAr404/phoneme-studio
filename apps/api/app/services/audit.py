"""Audit trail for every admin change: who, what, when, and the before and after values."""

from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from ..models import AuditLog
from ..security.net import ip_hash
from ..security.sessions import Principal


def audit(
    db: Session,
    request: Request,
    principal: Principal,
    action: str,
    target_type: str,
    target_id: str,
    summary: str = "",
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_email=principal.email,
            action=action,
            target_type=target_type,
            target_id=str(target_id),
            summary=summary[:300],
            before=before,
            after=after,
            ip_hash=ip_hash(request),
            request_id=getattr(request.state, "request_id", ""),
            is_demo=principal.is_demo,
        )
    )
