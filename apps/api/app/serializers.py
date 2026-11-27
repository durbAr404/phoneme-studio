"""Turn database rows into JSON-safe dicts."""

from typing import Any

from .models import Activity, Word


def word_out(w: Word) -> dict[str, Any]:
    return {
        "id": w.id,
        "english": w.english,
        "phonemes": w.phonemes,
        "count": w.phoneme_count,
        "lists": [lst.slug for lst in w.lists],
    }


def activity_out(a: Activity, detail: bool = True) -> dict[str, Any]:
    out: dict[str, Any] = {
        "id": str(a.id),
        "kind": a.kind,
        "title": a.title,
        "instructions": a.instructions,
        "word_count": len(a.words),
        "sounds": a.words[0]["phonemes"][:4] if a.words else [],
        "first_word": a.words[0]["english"] if a.words else "",
        "all_sounds": sorted({p for w in a.words for p in w["phonemes"]}),
        "is_published": a.is_published,
        "is_featured": a.is_featured,
        "version": a.version,
        "updated_at": a.updated_at.isoformat() if a.updated_at else None,
    }
    if detail:
        out["settings"] = a.settings
        out["words"] = a.words
    return out


def snapshot(a: Activity) -> dict[str, Any]:
    return {
        "kind": a.kind,
        "title": a.title,
        "instructions": a.instructions,
        "settings": a.settings,
        "words": a.words,
        "is_published": a.is_published,
        "is_featured": a.is_featured,
    }
