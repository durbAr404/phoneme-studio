"""Daily challenge: the same word for everyone on a given day, checked on the server.

The answer never reaches the browser until the player solves it or runs out of guesses.
"""

import random
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import Word
from ..phonemes import SYMBOLS

MAX_GUESSES = 6
EPOCH = date(2026, 1, 1)


def daily_word(db: Session, day: date) -> Word:
    words = db.scalars(select(Word).where(Word.is_official.is_(True), Word.phoneme_count.between(3, 5)).order_by(Word.id)).all()
    if not words:
        raise LookupError("No words available")
    # A fixed shuffle of the pool (seeded by DAILY_SALT), walked one word per day.
    # Everyone gets the same word, it changes at midnight, and no word repeats until all have been used.
    order = list(words)
    random.Random(get_settings().daily_salt).shuffle(order)
    days = (day - EPOCH).days
    cycle, index = divmod(days, len(order))
    if cycle:  # reshuffle each full cycle so the order doesn't repeat either
        random.Random(f"{get_settings().daily_salt}:{cycle}").shuffle(order)
    return order[index]


def keyboard_for(word: Word, day: date) -> list[str]:
    rng = random.Random(f"{day.isoformat()}-keys")
    distractors = sorted(SYMBOLS - set(word.phonemes))
    keys = set(word.phonemes) | set(rng.sample(distractors, 10))
    return sorted(keys, key=lambda s: list(sorted(SYMBOLS)).index(s))
