"""Optional parts of the app."""

import importlib.util


def showcase_available() -> bool:
    """True when app/showcase exists. It holds sign-in, the admin dashboard, teacher accounts and
    the read-only demos, and is kept out of the public repo for now, so the API must run without it."""
    return importlib.util.find_spec("app.showcase") is not None
