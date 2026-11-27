"""Australian English (HCE) phoneme inventory and validation.

Mirrors apps/web/lib/phonemes.ts. The server validates every phoneme it stores,
so a bad symbol can never reach a shared game or the official library.
"""

import unicodedata
from dataclasses import dataclass


@dataclass(frozen=True)
class Phoneme:
    symbol: str
    spelling: str
    example: str
    sound_class: str


_P = Phoneme
PHONEMES: tuple[Phoneme, ...] = (
    _P("p", "p", "pin", "plosive"),
    _P("b", "b", "bin", "plosive"),
    _P("t", "t", "tin", "plosive"),
    _P("d", "d", "din", "plosive"),
    _P("k", "k", "kin", "plosive"),
    _P("g", "g", "gun", "plosive"),
    _P("tʃ", "ch", "chin", "affricate"),
    _P("dʒ", "j", "jam", "affricate"),
    _P("f", "f", "fan", "fricative"),
    _P("v", "v", "van", "fricative"),
    _P("θ", "th", "thin", "fricative"),
    _P("ð", "th", "then", "fricative"),
    _P("s", "s", "sun", "fricative"),
    _P("z", "z", "zip", "fricative"),
    _P("ʃ", "sh", "ship", "fricative"),
    _P("ʒ", "s", "vision", "fricative"),
    _P("h", "h", "hat", "fricative"),
    _P("m", "m", "map", "nasal"),
    _P("n", "n", "nap", "nasal"),
    _P("ŋ", "ng", "sing", "nasal"),
    _P("l", "l", "light", "approximant"),
    _P("ɹ", "r", "right", "approximant"),
    _P("w", "w", "win", "approximant"),
    _P("j", "y", "yes", "approximant"),
    _P("ɪ", "i", "hid", "short-vowel"),
    _P("e", "e", "head", "short-vowel"),
    _P("æ", "a", "had", "short-vowel"),
    _P("ɐ", "u", "hut", "short-vowel"),
    _P("ɔ", "o", "hot", "short-vowel"),
    _P("ʊ", "oo", "hood", "short-vowel"),
    _P("ə", "a", "about", "short-vowel"),
    _P("iː", "ee", "heed", "long-vowel"),
    _P("ɐː", "ar", "hard", "long-vowel"),
    _P("ɜː", "ir", "heard", "long-vowel"),
    _P("ʉː", "oo", "who'd", "long-vowel"),
    _P("oː", "or", "fork", "long-vowel"),
    _P("eː", "air", "hair", "long-vowel"),
    _P("æɪ", "ay", "hay", "diphthong"),
    _P("ɑe", "igh", "high", "diphthong"),
    _P("oɪ", "oy", "boy", "diphthong"),
    _P("æɔ", "ow", "how", "diphthong"),
    _P("əʉ", "oa", "boat", "diphthong"),
    _P("ɪə", "ear", "here", "diphthong"),
    _P("ʊə", "oor", "tour", "diphthong"),
)
SYMBOLS: frozenset[str] = frozenset(p.symbol for p in PHONEMES)
BY_SYMBOL = {p.symbol: p for p in PHONEMES}
_LONGEST_FIRST = sorted(SYMBOLS, key=len, reverse=True)


def normalise_symbol(raw: str) -> str:
    s = unicodedata.normalize("NFC", raw.strip())
    s = s.replace(":", "ː").replace("ˑ", "ː").replace("ɡ", "g")
    return {"r": "ɹ", "ʧ": "tʃ", "ʤ": "dʒ"}.get(s, s)


def tokenize(text: str) -> tuple[list[str], list[str]]:
    """Split '/tʃ ɪ n/' or 'tʃɪn' into phonemes. Returns (phonemes, unknown_characters)."""
    cleaned = unicodedata.normalize("NFC", text)
    for ch in "/[]":
        cleaned = cleaned.replace(ch, " ")
    phonemes: list[str] = []
    unknown: list[str] = []
    for chunk in cleaned.replace(",", " ").split():
        whole = normalise_symbol(chunk)
        if whole in SYMBOLS:
            phonemes.append(whole)
            continue
        rest = chunk.replace(":", "ː").replace("ɡ", "g").replace("ʧ", "tʃ").replace("ʤ", "dʒ").replace("r", "ɹ")
        while rest:
            match = next((s for s in _LONGEST_FIRST if rest.startswith(s)), None)
            if match:
                phonemes.append(match)
                rest = rest[len(match) :]
            else:
                unknown.append(rest[0])
                rest = rest[1:]
    return phonemes, unknown


def validate_phonemes(items: list[str]) -> list[str]:
    """Normalise and check a phoneme list; raises ValueError naming the first bad symbol."""
    out = [normalise_symbol(x) for x in items]
    bad = [x for x in out if x not in SYMBOLS]
    if bad:
        raise ValueError(f"'{bad[0]}' is not an HCE sound")
    if not 1 <= len(out) <= 12:
        raise ValueError("A word needs between 1 and 12 sounds")
    return out


def evaluate_guess(guess: list[str], target: list[str]) -> list[str]:
    """Standard Wordle scoring over phonemes: exact matches first, then left-to-right presence."""
    if len(guess) != len(target):
        raise ValueError("Guess length does not match the word")
    result = ["absent"] * len(guess)
    remaining: dict[str, int] = {}
    for i, ph in enumerate(guess):
        if ph == target[i]:
            result[i] = "correct"
        else:
            remaining[target[i]] = remaining.get(target[i], 0) + 1
    for i, ph in enumerate(guess):
        if result[i] == "correct":
            continue
        if remaining.get(ph, 0) > 0:
            result[i] = "present"
            remaining[ph] -= 1
    return result
