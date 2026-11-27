"""Runtime settings, read from environment variables (and a local .env in development)."""

from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: Literal["development", "test", "production"] = "development"
    release: str = "dev"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/phonemestudio"

    # Auth
    google_client_id: str = ""
    auth_enabled: bool = False  # real Google sign-in; off on the public site (demos only)
    admin_emails: Annotated[list[str], NoDecode] = Field(default_factory=list)
    dev_login_enabled: bool = False
    demo_enabled: bool = True
    cookie_secure: bool = False
    admin_session_hours: int = 8
    teacher_session_days: int = 30
    demo_session_hours: int = 2

    # Request safety
    allowed_origins: Annotated[list[str], NoDecode] = Field(default_factory=lambda: ["http://localhost:3000"])
    trust_proxy: bool = True
    ip_hash_salt: str = "change-me"
    redis_url: str = ""
    login_fail_limit: int = 8
    login_fail_window_minutes: int = 15

    # Observability and operations
    sentry_dsn: str = ""
    log_level: str = "INFO"
    cron_secret: str = ""
    alert_webhook_url: str = ""
    daily_salt: str = "phoneme-studio"

    @field_validator("admin_emails", "allowed_origins", mode="before")
    @classmethod
    def split_csv(cls, v: object) -> object:
        if isinstance(v, str):
            return [s.strip().lower() if "@" in s else s.strip() for s in v.split(",") if s.strip()]
        return v

    @property
    def is_production(self) -> bool:
        return self.env == "production"

    @property
    def dev_login_allowed(self) -> bool:
        return self.dev_login_enabled and not self.is_production


@lru_cache
def get_settings() -> Settings:
    return Settings()
