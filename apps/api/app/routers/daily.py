"""Daily challenge, checked on the server so the answer stays hidden."""

from datetime import UTC, date, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..phonemes import evaluate_guess, normalise_symbol
from ..schemas import DailyGuessIn
from ..security.ratelimit import rate_limit
from ..services import site_settings
from ..services.daily import MAX_GUESSES, daily_word, keyboard_for

router = APIRouter(prefix="/daily", tags=["daily"])


def _parse_day(raw: str) -> date:
    day = date.fromisoformat(raw)
    today = datetime.now(UTC).date()
    # Allow one day either side for time zones; never future puzzles.
    if not today - timedelta(days=1) <= day <= today + timedelta(days=1):
        raise HTTPException(422, "That day's challenge isn't available.")
    return day


def _enabled(db: Session) -> None:
    if not site_settings.get_all(db)["daily_enabled"]:
        raise HTTPException(404, "The daily challenge is turned off.")


@router.get("")
def today(day: str | None = None, db: Session = Depends(get_db)) -> dict[str, Any]:
    _enabled(db)
    d = _parse_day(day) if day else datetime.now(UTC).date()
    word = daily_word(db, d)
    return {"date": d.isoformat(), "length": word.phoneme_count, "max_guesses": MAX_GUESSES, "keys": keyboard_for(word, d)}


@router.post("/guess", dependencies=[Depends(rate_limit("daily", 120, 3600))])
def guess(body: DailyGuessIn, db: Session = Depends(get_db)) -> dict[str, Any]:
    _enabled(db)
    d = _parse_day(body.date)
    word = daily_word(db, d)
    attempt = [normalise_symbol(x) for x in body.guess]
    if len(attempt) != word.phoneme_count:
        raise HTTPException(422, f"Today's word has {word.phoneme_count} sounds.")
    states = evaluate_guess(attempt, word.phonemes)
    solved = all(s == "correct" for s in states)
    reveal = solved or body.attempt >= MAX_GUESSES
    return {
        "states": states,
        "solved": solved,
        "answer": {"english": word.english, "phonemes": word.phonemes} if reveal else None,
    }
