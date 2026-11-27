"""Database tables.

Conventions:
- `is_demo` rows belong to the read-only admin demo and are never shown to real admins, and vice versa.
- Activities store a snapshot of their words, so editing the library never changes a game someone shared.
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _uuid() -> uuid.UUID:
    return uuid.uuid4()


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class User(TimestampMixin, Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(320), unique=True)
    name: Mapped[str] = mapped_column(String(200), default="")
    avatar_url: Mapped[str] = mapped_column(String(500), default="")
    role: Mapped[str] = mapped_column(String(20), default="teacher")  # teacher | admin
    disabled: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class UserSession(TimestampMixin, Base):
    __tablename__ = "sessions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(20))  # teacher | admin | demo
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ip_hash: Mapped[str] = mapped_column(String(64), default="")
    user_agent: Mapped[str] = mapped_column(String(300), default="")
    user: Mapped[User | None] = relationship()


class AuthEvent(TimestampMixin, Base):
    __tablename__ = "auth_events"
    __table_args__ = (Index("ix_auth_events_ip_created", "ip_hash", "created_at"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kind: Mapped[str] = mapped_column(String(30))  # login_success | login_failed | logout | lockout | demo_login
    email: Mapped[str] = mapped_column(String(320), default="")
    reason: Mapped[str] = mapped_column(String(200), default="")
    ip_hash: Mapped[str] = mapped_column(String(64), default="")


class Word(TimestampMixin, Base):
    __tablename__ = "words"
    __table_args__ = (UniqueConstraint("english", "is_official", name="uq_words_english_official"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    english: Mapped[str] = mapped_column(String(60), index=True)
    phonemes: Mapped[list[str]] = mapped_column(JSONB)
    phoneme_count: Mapped[int] = mapped_column(Integer)
    is_official: Mapped[bool] = mapped_column(Boolean, default=True)
    lists: Mapped[list["WordList"]] = relationship(secondary="word_list_items", back_populates="words")


class WordList(Base):
    __tablename__ = "word_lists"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(60), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    words: Mapped[list[Word]] = relationship(secondary="word_list_items", back_populates="lists")


class WordListItem(Base):
    __tablename__ = "word_list_items"
    list_id: Mapped[int] = mapped_column(ForeignKey("word_lists.id", ondelete="CASCADE"), primary_key=True)
    word_id: Mapped[int] = mapped_column(ForeignKey("words.id", ondelete="CASCADE"), primary_key=True)


class WordSuggestion(TimestampMixin, Base):
    __tablename__ = "word_suggestions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    english: Mapped[str] = mapped_column(String(60))
    phonemes: Mapped[list[str]] = mapped_column(JSONB)
    source: Mapped[str] = mapped_column(String(20))  # teacher (older rows may say "ai")
    provider: Mapped[str] = mapped_column(String(30), default="")
    confidence: Mapped[str] = mapped_column(String(10), default="")
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | approved | rejected
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)


class Activity(TimestampMixin, Base):
    __tablename__ = "activities"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    kind: Mapped[str] = mapped_column(String(20))  # wordle | wordsearch
    title: Mapped[str] = mapped_column(String(120))
    instructions: Mapped[str] = mapped_column(String(300), default="")
    settings: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    words: Mapped[list[dict[str, Any]]] = mapped_column(JSONB)
    owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    is_official: Mapped[bool] = mapped_column(Boolean, default=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ActivityVersion(TimestampMixin, Base):
    __tablename__ = "activity_versions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    activity_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("activities.id", ondelete="CASCADE"), index=True)
    version: Mapped[int] = mapped_column(Integer)
    snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB)
    created_by: Mapped[str] = mapped_column(String(320), default="")


class Share(TimestampMixin, Base):
    __tablename__ = "shares"
    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB)
    owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    activity_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("activities.id", ondelete="SET NULL"))


class Play(Base):
    __tablename__ = "plays"
    __table_args__ = (Index("ix_plays_created", "created_at"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    share_id: Mapped[str | None] = mapped_column(ForeignKey("shares.id", ondelete="CASCADE"), index=True)
    activity_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("activities.id", ondelete="CASCADE"), index=True)
    player_id: Mapped[str] = mapped_column(String(40))
    nickname: Mapped[str] = mapped_column(String(24), default="")
    solved: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)
    duration_ms: Mapped[int] = mapped_column(Integer)
    per_word: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SaveCode(TimestampMixin, Base):
    __tablename__ = "save_codes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True)
    edit_token_hash: Mapped[str] = mapped_column(String(64))
    data: Mapped[dict[str, Any]] = mapped_column(JSONB)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AuditLog(TimestampMixin, Base):
    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor_email: Mapped[str] = mapped_column(String(320))
    action: Mapped[str] = mapped_column(String(60), index=True)
    target_type: Mapped[str] = mapped_column(String(40))
    target_id: Mapped[str] = mapped_column(String(64))
    summary: Mapped[str] = mapped_column(String(300), default="")
    before: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    after: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    ip_hash: Mapped[str] = mapped_column(String(64), default="")
    request_id: Mapped[str] = mapped_column(String(64), default="")
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)


class RequestMetric(Base):
    __tablename__ = "request_metrics"
    __table_args__ = (Index("ix_metrics_created", "created_at"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    route: Mapped[str] = mapped_column(String(120))
    method: Mapped[str] = mapped_column(String(8))
    status: Mapped[int] = mapped_column(Integer)
    duration_ms: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ErrorEvent(Base):
    __tablename__ = "error_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    fingerprint: Mapped[str] = mapped_column(String(64), unique=True)
    message: Mapped[str] = mapped_column(String(500))
    route: Mapped[str] = mapped_column(String(120))
    last_request_id: Mapped[str] = mapped_column(String(64), default="")
    count: Mapped[int] = mapped_column(Integer, default=1)
    first_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WebVital(Base):
    __tablename__ = "web_vitals"
    __table_args__ = (Index("ix_vitals_created", "created_at"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(8))
    value: Mapped[float] = mapped_column(Float)
    page: Mapped[str] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SiteSetting(Base):
    __tablename__ = "site_settings"
    key: Mapped[str] = mapped_column(String(60), primary_key=True)
    value: Mapped[Any] = mapped_column(JSONB)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by: Mapped[str] = mapped_column(String(320), default="")
