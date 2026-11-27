"""Readable random identifiers for share links and save codes."""

import secrets
import string

_ALPHABET = string.ascii_lowercase + string.digits
ANIMALS = [
    "koala",
    "wombat",
    "emu",
    "possum",
    "dingo",
    "echidna",
    "quokka",
    "numbat",
    "platypus",
    "kookaburra",
    "galah",
    "bilby",
    "wallaby",
    "dugong",
    "magpie",
    "lorikeet",
    "cockatoo",
    "gecko",
    "dolphin",
    "penguin",
]
PLACES = [
    "river",
    "beach",
    "reef",
    "desert",
    "forest",
    "harbour",
    "valley",
    "island",
    "meadow",
    "canyon",
    "lagoon",
    "outback",
    "creek",
    "summit",
    "garden",
    "bay",
    "dune",
    "ridge",
    "billabong",
    "coast",
]


def share_id() -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(8))


def save_code() -> str:
    # About 400 * 10,000 = 4 million combinations; restore is also rate limited per IP.
    return f"{secrets.choice(ANIMALS)}-{secrets.choice(PLACES)}-{secrets.randbelow(10000):04d}"
