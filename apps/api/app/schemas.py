"""Request and response shapes. Every limit here is a security boundary, not just a nicety."""

import re
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .phonemes import validate_phonemes

NICKNAME_RE = re.compile(r"^[\w .'-]{1,24}$", re.UNICODE)


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class WordIn(StrictModel):
    english: str = Field(min_length=1, max_length=60)
    phonemes: list[str] = Field(min_length=1, max_length=12)

    @field_validator("phonemes")
    @classmethod
    def check_phonemes(cls, v: list[str]) -> list[str]:
        return validate_phonemes(v)


class ActivitySettings(StrictModel):
    max_guesses: int = Field(5, ge=3, le=8)
    hints: bool = True
    show_spelling: bool = True
    shuffle: bool = False
    grid_size: int = Field(10, ge=6, le=14)
    difficulty: Literal["EASY", "MEDIUM", "HARD"] = "MEDIUM"
    seed: int = Field(1, ge=0, le=2**31 - 1)
    answer_key: bool = True


class ActivityIn(StrictModel):
    kind: Literal["wordle", "wordsearch"]
    title: str = Field(min_length=1, max_length=120)
    instructions: str = Field("", max_length=300)
    settings: ActivitySettings = Field(default_factory=ActivitySettings)
    words: list[WordIn] = Field(min_length=1, max_length=30)


class ActivityPatch(StrictModel):
    title: str | None = Field(None, min_length=1, max_length=120)
    instructions: str | None = Field(None, max_length=300)
    settings: ActivitySettings | None = None
    words: list[WordIn] | None = Field(None, min_length=1, max_length=30)
    is_published: bool | None = None
    is_featured: bool | None = None


class ShareIn(ActivityIn):
    activity_id: str | None = None


class PlayIn(StrictModel):
    share_id: str | None = Field(None, max_length=16)
    activity_id: str | None = Field(None, max_length=40)
    player_id: str = Field(min_length=8, max_length=40, pattern=r"^[A-Za-z0-9_-]+$")
    nickname: str = Field("", max_length=24)
    solved: int = Field(ge=0, le=30)
    total: int = Field(ge=1, le=30)
    duration_ms: int = Field(ge=0, le=6 * 60 * 60 * 1000)
    per_word: list[dict[str, Any]] = Field(default_factory=list, max_length=30)

    @field_validator("nickname")
    @classmethod
    def check_nickname(cls, v: str) -> str:
        if v and not NICKNAME_RE.match(v):
            raise ValueError("Nicknames can use letters, numbers and spaces")
        return v


class SaveIn(StrictModel):
    data: dict[str, Any]


class GoogleLoginIn(StrictModel):
    credential: str = Field(min_length=20, max_length=4096)


class DevLoginIn(StrictModel):
    email: str = Field(max_length=320, pattern=r"^[^@\s]+@[^@\s]+$")
    role: Literal["teacher", "admin"] = "teacher"


class DailyGuessIn(StrictModel):
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    guess: list[str] = Field(min_length=1, max_length=12)
    attempt: int = Field(ge=1, le=6)


class SuggestionIn(WordIn):
    pass


class WordPatch(StrictModel):
    english: str | None = Field(None, min_length=1, max_length=60)
    phonemes: list[str] | None = None
    list_ids: list[int] | None = None

    @field_validator("phonemes")
    @classmethod
    def check(cls, v: list[str] | None) -> list[str] | None:
        return validate_phonemes(v) if v is not None else v


class OfficialWordIn(WordIn):
    list_ids: list[int] = Field(default_factory=list)


class VitalIn(StrictModel):
    name: Literal["LCP", "INP", "CLS", "FCP", "TTFB"]
    value: float = Field(ge=0, le=120000)
    page: str = Field(max_length=120)


class SiteSettingsIn(StrictModel):
    daily_enabled: bool = True
    classroom_enabled: bool = True
    maintenance_message: str = Field("", max_length=200)
