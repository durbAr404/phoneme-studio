"""Optional Sentry error and performance monitoring, enabled when SENTRY_DSN is set."""

from ..config import Settings


def init_sentry(settings: Settings) -> bool:
    if not settings.sentry_dsn:
        return False
    import sentry_sdk

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.env,
        release=settings.release,
        traces_sample_rate=0.1,
        send_default_pii=False,
    )
    return True
