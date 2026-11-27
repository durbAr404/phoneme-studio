"""Public, read-only endpoints. No sign-in needed."""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from ..config import get_settings
from ..db import get_db
from ..features import showcase_available
from ..models import Activity, Play, Word, WordList
from ..phonemes import PHONEMES, normalise_symbol
from ..serializers import activity_out, word_out
from ..services import site_settings

router = APIRouter(tags=["public"])


@router.get("/public/config")
def public_config(db: Session = Depends(get_db)) -> dict[str, Any]:
    s = get_settings()
    return {
        "google_client_id": s.google_client_id if s.auth_enabled else "",
        "auth_enabled": s.auth_enabled and showcase_available(),
        "demo_enabled": s.demo_enabled and showcase_available(),
        "dev_login": s.dev_login_allowed,
        "release": s.release,
        **site_settings.get_all(db),
    }


@router.get("/sounds")
def sounds() -> list[dict[str, str]]:
    return [{"symbol": p.symbol, "spelling": p.spelling, "example": p.example, "class": p.sound_class} for p in PHONEMES]


@router.get("/lists")
def lists(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    rows = db.execute(
        select(WordList, func.count(Word.id)).outerjoin(WordList.words).group_by(WordList.id).order_by(WordList.sort_order)
    ).all()
    return [{"id": lst.id, "slug": lst.slug, "name": lst.name, "description": lst.description, "count": n} for lst, n in rows]


@router.get("/words")
def words(
    q: str = Query("", max_length=40),
    list_slug: str = Query("", alias="list", max_length=60),
    sound: str = Query("", max_length=4),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    stmt = select(Word).where(Word.is_official.is_(True)).options(selectinload(Word.lists))
    if q:
        stmt = stmt.where(Word.english.ilike(f"%{q.lower()}%"))
    if sound:
        stmt = stmt.where(Word.phonemes.contains([normalise_symbol(sound)]))
    if list_slug:
        stmt = stmt.where(Word.lists.any(WordList.slug == list_slug))
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(stmt.order_by(Word.phoneme_count, Word.english).limit(limit).offset(offset)).all()
    return {"total": total, "items": [word_out(w) for w in rows]}


def _gallery_query() -> Any:
    return select(Activity).where(
        Activity.is_official.is_(True),
        Activity.is_published.is_(True),
        Activity.is_demo.is_(False),
        Activity.deleted_at.is_(None),
    )


@router.get("/gallery")
def gallery(
    kind: str = Query("", pattern=r"^(|wordle|wordsearch)$"),
    sound: str = Query("", max_length=4),
    sort: str = Query("featured", pattern=r"^(featured|newest|popular)$"),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    stmt = _gallery_query()
    if kind:
        stmt = stmt.where(Activity.kind == kind)
    rows = list(db.scalars(stmt).all())
    if sound:
        s = normalise_symbol(sound)
        rows = [a for a in rows if any(s in w["phonemes"] for w in a.words)]
    plays = dict(db.execute(select(Play.activity_id, func.count()).where(Play.is_demo.is_(False)).group_by(Play.activity_id)).all())
    if sort == "newest":
        rows.sort(key=lambda a: a.created_at, reverse=True)
    elif sort == "popular":
        rows.sort(key=lambda a: plays.get(a.id, 0), reverse=True)
    else:
        rows.sort(key=lambda a: (not a.is_featured, a.title))
    return [{**activity_out(a, detail=False), "plays": plays.get(a.id, 0)} for a in rows]


@router.get("/activities/{activity_id}")
def published_activity(activity_id: uuid.UUID, db: Session = Depends(get_db)) -> dict[str, Any]:
    # Sample games from the teacher demo can be opened and played too; they never appear in the gallery.
    a = db.scalar(
        select(Activity).where(
            Activity.id == activity_id,
            Activity.is_official.is_(True),
            Activity.is_published.is_(True),
            Activity.deleted_at.is_(None),
        )
    )
    if not a:
        raise HTTPException(404, "That activity isn't available.")
    return activity_out(a)


@router.get("/search")
def search(q: str = Query(min_length=1, max_length=40), db: Session = Depends(get_db)) -> dict[str, Any]:
    term = q.strip().lower()
    sym = normalise_symbol(term)
    sounds_found = [
        {"symbol": p.symbol, "example": p.example, "spelling": p.spelling}
        for p in PHONEMES
        if p.symbol == sym or p.spelling == term or p.example.startswith(term)
    ][:5]
    acts = db.scalars(_gallery_query().where(Activity.title.ilike(f"%{term}%")).limit(5)).all()
    words_found = db.scalars(
        select(Word)
        .where(Word.is_official.is_(True), or_(Word.english.ilike(f"{term}%"), Word.phonemes.contains([sym])))
        .order_by(Word.english)
        .limit(6)
    ).all()
    return {
        "sounds": sounds_found,
        "activities": [{"id": str(a.id), "title": a.title, "kind": a.kind, "word_count": len(a.words)} for a in acts],
        "words": [{"english": w.english, "phonemes": w.phonemes} for w in words_found],
    }
