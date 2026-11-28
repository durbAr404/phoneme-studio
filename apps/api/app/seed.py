"""Seed the word library, official activities and the read-only demo data. Safe to run repeatedly."""

import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import SessionLocal
from .features import showcase_available
from .models import Activity, ActivityVersion, Word, WordList
from .phonemes import validate_phonemes
from .serializers import snapshot

DATA = Path(__file__).parent / "data" / "starter_lists.json"
SLUGS = {
    "Three-sound words": "three-sounds",
    "Four-sound words": "four-sounds",
    "Five-sound words": "five-sounds",
    "Voiced and voiceless th": "th-words",
    "Long vowels and diphthongs": "long-vowels",
}
EXTRA = [  # clusters and longer words for the gallery
    ("splash", "s p l æ ʃ"),
    ("street", "s t ɹ iː t"),
    ("spring", "s p ɹ ɪ ŋ"),
    ("strong", "s t ɹ ɔ ŋ"),
    ("scratch", "s k ɹ æ tʃ"),
    ("splint", "s p l ɪ n t"),
    ("shrink", "ʃ ɹ ɪ ŋ k"),
    ("crisp", "k ɹ ɪ s p"),
    ("butterfly", "b ɐ t ə f l ɑe"),
    ("elephant", "e l ə f ə n t"),
    ("kangaroo", "k æ ŋ g ə ɹ ʉː"),
    ("umbrella", "ɐ m b ɹ e l ə"),
    ("dinosaur", "d ɑe n ə s oː"),
    ("computer", "k ə m p j ʉː t ə"),
]
OFFICIAL = [
    (
        "wordle",
        "The th sounds",
        "Listen for the th. Is it voiced or voiceless?",
        ["thin", "then", "bath", "moth", "teeth", "this"],
        True,
        True,
    ),
    (
        "wordsearch",
        "Tricky clusters",
        "Find each word written in sounds.",
        ["splash", "street", "spring", "strong", "scratch", "crisp"],
        True,
        False,
    ),
    (
        "wordle",
        "Vowel mix",
        "Long vowels and diphthongs. Listen to the middle sound.",
        ["boat", "bike", "bait", "boot", "bark", "beard"],
        True,
        True,
    ),
    (
        "wordsearch",
        "Big words",
        "Longer words with three or more syllables.",
        ["butterfly", "elephant", "kangaroo", "umbrella", "dinosaur", "computer"],
        True,
        False,
    ),
    ("wordle", "Sh and ch", "Is it sh or ch?", ["ship", "chin", "shop", "chip", "fish", "much"], True, False),
    ("wordsearch", "Three-sound starters", "Short words to warm up.", ["bed", "bid", "bad", "bud", "book", "boat"], False, False),
]


def _word_map(db: Session) -> dict[str, Word]:
    return {w.english: w for w in db.scalars(select(Word).where(Word.is_official.is_(True))).all()}


def seed_words(db: Session) -> None:
    lists_data = json.loads(DATA.read_text(encoding="utf-8"))
    existing = _word_map(db)
    for order, item in enumerate(lists_data):
        slug = SLUGS.get(item["name"], item["name"].lower().replace(" ", "-"))
        lst = db.scalar(select(WordList).where(WordList.slug == slug))
        if not lst:
            lst = WordList(slug=slug, name=item["name"], description=item["description"], sort_order=order)
            db.add(lst)
        for english, sounds in item["words"]:
            w = existing.get(english)
            if not w:
                ph = validate_phonemes(sounds.split())
                w = Word(english=english, phonemes=ph, phoneme_count=len(ph), is_official=True)
                db.add(w)
                existing[english] = w
            if lst not in w.lists:
                w.lists.append(lst)
    clusters = db.scalar(select(WordList).where(WordList.slug == "clusters"))
    if not clusters:
        clusters = WordList(
            slug="clusters", name="Clusters and big words", description="Consonant clusters and longer words.", sort_order=10
        )
        db.add(clusters)
    for english, sounds in EXTRA:
        w = existing.get(english)
        if not w:
            ph = validate_phonemes(sounds.split())
            w = Word(english=english, phonemes=ph, phoneme_count=len(ph), is_official=True)
            db.add(w)
            existing[english] = w
        if clusters not in w.lists:
            w.lists.append(clusters)
    for english, sounds in [
        ("moth", "m ɔ θ"),
        ("this", "ð ɪ s"),
        ("shop", "ʃ ɔ p"),
        ("chip", "tʃ ɪ p"),
        ("fish", "f ɪ ʃ"),
        ("much", "m ɐ tʃ"),
        ("teeth", "t iː θ"),
    ]:
        if english not in existing:
            ph = validate_phonemes(sounds.split())
            w = Word(english=english, phonemes=ph, phoneme_count=len(ph), is_official=True)
            db.add(w)
            existing[english] = w
    db.commit()


def _activity(
    words: dict[str, Word], kind: str, title: str, instructions: str, names: list[str], published: bool, featured: bool, demo: bool
) -> Activity:
    return Activity(
        kind=kind,
        title=title,
        instructions=instructions,
        settings={
            "max_guesses": 5,
            "hints": True,
            "show_spelling": True,
            "shuffle": False,
            "grid_size": 10,
            "difficulty": "MEDIUM",
            "seed": sum(map(ord, title)) * 97 % 100000,
            "answer_key": True,
        },
        words=[{"english": n, "phonemes": words[n].phonemes} for n in names],
        is_official=True,
        is_published=published,
        is_featured=featured,
        is_demo=demo,
    )


def seed_activities(db: Session, include_demo: bool = False) -> None:
    """Official games. With include_demo, also a copy marked is_demo for the read-only demos."""
    words = _word_map(db)
    for demo in (False, True) if include_demo else (False,):
        have = {a.title for a in db.scalars(select(Activity).where(Activity.is_official.is_(True), Activity.is_demo.is_(demo))).all()}
        for kind, title, instr, names, published, featured in OFFICIAL:
            if title in have:
                continue
            act = _activity(words, kind, title, instr, names, published, featured, demo)
            db.add(act)
            db.flush()
            db.add(ActivityVersion(activity_id=act.id, version=1, snapshot=snapshot(act), created_by="seed"))
    db.commit()


def run() -> None:
    with SessionLocal() as db:
        seed_words(db)
        if showcase_available():
            from .showcase.seed_demo import seed_demo

            seed_activities(db, include_demo=True)
            seed_demo(db)
        else:
            seed_activities(db)
    print("Seed complete")


if __name__ == "__main__":
    run()
