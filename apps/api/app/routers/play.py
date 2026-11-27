"""Sharing, playing and save codes. Open to visitors, with rate limits and strict validation."""

import hashlib
import json
import secrets
import uuid
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Activity, Play, SaveCode, Share
from ..schemas import PlayIn, SaveIn, ShareIn
from ..security.deps import current_principal
from ..security.ratelimit import rate_limit
from ..security.sessions import Principal
from ..services.codes import save_code, share_id

router = APIRouter(tags=["play"])
MAX_SAVE_BYTES = 200_000


@router.post("/shares", status_code=201, dependencies=[Depends(rate_limit("share", 30, 3600))])
def create_share(body: ShareIn, principal: Principal = Depends(current_principal), db: Session = Depends(get_db)) -> dict[str, str]:
    owner = principal.user.id if principal.user and principal.role in ("teacher", "admin") else None
    activity_id = None
    if body.activity_id and owner:
        try:
            act = db.get(Activity, uuid.UUID(body.activity_id))
        except ValueError:
            act = None
        if act and act.owner_id == owner:
            activity_id = act.id
    snap = body.model_dump(exclude={"activity_id"})
    for _ in range(5):
        share = Share(id=share_id(), snapshot=snap, owner_id=owner, activity_id=activity_id)
        db.add(share)
        try:
            db.commit()
            return {"id": share.id}
        except IntegrityError:
            db.rollback()
    raise HTTPException(500, "Couldn't create a link. Try again.")


@router.get("/shares/{sid}")
def get_share(sid: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    if not sid.isalnum() or len(sid) > 16:
        raise HTTPException(404, "That link doesn't work.")
    share = db.get(Share, sid)
    if not share:
        raise HTTPException(404, "That link doesn't work.")
    return {"id": share.id, **share.snapshot}


@router.post("/plays", status_code=201, dependencies=[Depends(rate_limit("play", 120, 3600))])
def record_play(body: PlayIn, db: Session = Depends(get_db)) -> dict[str, bool]:
    if bool(body.share_id) == bool(body.activity_id):
        raise HTTPException(422, "Send either share_id or activity_id.")
    activity_uuid = None
    if body.share_id and not db.get(Share, body.share_id):
        raise HTTPException(404, "Unknown share")
    if body.activity_id:
        try:
            activity_uuid = uuid.UUID(body.activity_id)
        except ValueError as exc:
            raise HTTPException(404, "Unknown activity") from exc
        act = db.get(Activity, activity_uuid)
        if not act or not act.is_published:
            raise HTTPException(404, "Unknown activity")
        if act.is_demo:
            return {"ok": True}  # plays of demo games are never stored, so the sample results stay fixed
    if body.solved > body.total:
        raise HTTPException(422, "Solved can't be more than total.")
    per_word = [
        {"english": str(w.get("english", ""))[:60], "solved": bool(w.get("solved")), "guesses": int(w.get("guesses", 0))}
        for w in body.per_word
    ]
    db.add(
        Play(
            share_id=body.share_id,
            activity_id=activity_uuid,
            player_id=body.player_id,
            nickname=body.nickname,
            solved=body.solved,
            total=body.total,
            duration_ms=body.duration_ms,
            per_word=per_word,
        )
    )
    db.commit()
    return {"ok": True}


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _check_size(data: dict[str, Any]) -> None:
    if len(json.dumps(data)) > MAX_SAVE_BYTES:
        raise HTTPException(413, "That save is too large.")


@router.post("/saves", status_code=201, dependencies=[Depends(rate_limit("save_create", 20, 3600))])
def create_save(body: SaveIn, db: Session = Depends(get_db)) -> dict[str, str]:
    _check_size(body.data)
    token = secrets.token_urlsafe(24)
    for _ in range(5):
        row = SaveCode(code=save_code(), edit_token_hash=_token_hash(token), data=body.data)
        db.add(row)
        try:
            db.commit()
            return {"code": row.code, "edit_token": token}
        except IntegrityError:
            db.rollback()
    raise HTTPException(500, "Couldn't create a save code. Try again.")


@router.get("/saves/{code}", dependencies=[Depends(rate_limit("save_restore", 15, 900))])
def restore_save(code: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    row = db.scalar(select(SaveCode).where(SaveCode.code == code.strip().lower()[:40]))
    if not row:
        raise HTTPException(404, "We couldn't find that code. Check the spelling.")
    return {"code": row.code, "data": row.data, "updated_at": row.updated_at.isoformat()}


@router.put("/saves/{code}", dependencies=[Depends(rate_limit("save_update", 120, 3600))])
def update_save(
    code: str, body: SaveIn, request: Request, x_edit_token: str = Header(""), db: Session = Depends(get_db)
) -> dict[str, bool]:
    _check_size(body.data)
    row = db.scalar(select(SaveCode).where(SaveCode.code == code.strip().lower()[:40]))
    if not row or not secrets.compare_digest(row.edit_token_hash, _token_hash(x_edit_token)):
        raise HTTPException(403, "This device can't update that save code.")
    row.data = body.data
    db.commit()
    return {"ok": True}
