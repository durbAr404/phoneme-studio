"""Server-side sessions.

The browser gets a random opaque token in an httpOnly cookie; the database keeps only
its SHA-256 hash, so a leaked database cannot be used to log in. Sessions slide forward
on use and can be revoked one by one or all at once.
"""

import hashlib
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from fastapi import Request, Response
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import User, UserSession
from .net import ip_hash

COOKIE_NAME = "ps_session"


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def lifetime(role: str) -> timedelta:
    s = get_settings()
    if role == "admin":
        return timedelta(hours=s.admin_session_hours)
    if role == "demo":
        return timedelta(hours=s.demo_session_hours)
    return timedelta(days=s.teacher_session_days)


def create_session(db: Session, request: Request, response: Response, role: str, user: User | None) -> UserSession:
    token = secrets.token_urlsafe(32)
    sess = UserSession(
        token_hash=_hash(token),
        user_id=user.id if user else None,
        role=role,
        expires_at=datetime.now(UTC) + lifetime(role),
        ip_hash=ip_hash(request),
        user_agent=(request.headers.get("user-agent") or "")[:300],
    )
    db.add(sess)
    db.commit()
    set_cookie(response, token, lifetime(role))
    return sess


def set_cookie(response: Response, token: str, max_age: timedelta) -> None:
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=int(max_age.total_seconds()),
        httponly=True,
        secure=get_settings().cookie_secure,
        samesite="lax",
        path="/",
    )


def clear_cookie(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


@dataclass
class Principal:
    role: str  # visitor | teacher | admin | demo
    session_id: uuid.UUID | None = None
    user: User | None = None

    @property
    def email(self) -> str:
        if self.user:
            return self.user.email
        return "demo@phonemestudio" if self.role == "demo" else ""

    @property
    def is_demo(self) -> bool:
        return self.role == "demo"


VISITOR = Principal(role="visitor")


def load_principal(db: Session, request: Request) -> Principal:
    token = request.cookies.get(COOKIE_NAME)
    if not token or len(token) > 100:
        return VISITOR
    now = datetime.now(UTC)
    sess = db.scalar(select(UserSession).where(UserSession.token_hash == _hash(token)))
    if not sess or sess.revoked_at or sess.expires_at < now:
        return VISITOR
    user = sess.user
    if user and user.disabled:
        return VISITOR
    # Sliding renewal at most every 5 minutes to keep writes low.
    if (now - sess.last_seen_at).total_seconds() > 300:
        db.execute(update(UserSession).where(UserSession.id == sess.id).values(last_seen_at=now, expires_at=now + lifetime(sess.role)))
        db.commit()
    return Principal(role=sess.role, session_id=sess.id, user=user)


def revoke(db: Session, session_id: uuid.UUID) -> None:
    db.execute(update(UserSession).where(UserSession.id == session_id).values(revoked_at=datetime.now(UTC)))
    db.commit()


def revoke_all_for_user(db: Session, user_id: uuid.UUID) -> int:
    res = db.execute(
        update(UserSession).where(UserSession.user_id == user_id, UserSession.revoked_at.is_(None)).values(revoked_at=datetime.now(UTC))
    )
    db.commit()
    return res.rowcount or 0
