"""Authorization dependencies. Every route declares who may call it; the default is nobody special."""

from collections.abc import Callable

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..db import get_db
from .sessions import Principal, load_principal


def current_principal(request: Request, db: Session = Depends(get_db)) -> Principal:
    cached = getattr(request.state, "principal", None)
    if cached is not None:
        return cached
    principal = load_principal(db, request)
    request.state.principal = principal
    return principal


def require_roles(*roles: str) -> Callable[..., Principal]:
    def dependency(principal: Principal = Depends(current_principal)) -> Principal:
        if principal.role == "visitor":
            raise HTTPException(status_code=401, detail="Sign in to continue.")
        if principal.role not in roles:
            raise HTTPException(status_code=403, detail="You don't have access to this.")
        return principal

    return dependency


# Admin pages are readable by real admins and by the read-only demo.
admin_reader = require_roles("admin", "demo")


def admin_writer(principal: Principal = Depends(current_principal)) -> Principal:
    if principal.role == "visitor":
        raise HTTPException(status_code=401, detail="Sign in to continue.")
    if principal.role == "demo":
        raise HTTPException(status_code=403, detail="Demo mode is read-only.")
    if principal.role != "admin":
        raise HTTPException(status_code=403, detail="You don't have access to this.")
    return principal


teacher_or_admin = require_roles("teacher", "admin")
