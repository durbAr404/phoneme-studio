"""Feature switches and the maintenance banner, editable by admins without a deploy."""

from typing import Any

from sqlalchemy.orm import Session

from ..models import SiteSetting

DEFAULTS: dict[str, Any] = {
    "daily_enabled": True,
    "classroom_enabled": True,
    "maintenance_message": "",
}


def get_all(db: Session) -> dict[str, Any]:
    values = dict(DEFAULTS)
    for row in db.query(SiteSetting).all():
        if row.key in values:
            values[row.key] = row.value
    return values


def set_all(db: Session, values: dict[str, Any], actor: str) -> None:
    for key, value in values.items():
        if key not in DEFAULTS:
            continue
        row = db.get(SiteSetting, key)
        if row:
            row.value = value
            row.updated_by = actor
        else:
            db.add(SiteSetting(key=key, value=value, updated_by=actor))
