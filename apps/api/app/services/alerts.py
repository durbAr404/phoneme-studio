"""Alerting hook. Posts a short JSON message to ALERT_WEBHOOK_URL (Slack, Discord or any webhook)."""

import httpx

from ..config import get_settings
from ..observability.logging import log


def send_alert(title: str, detail: str) -> bool:
    url = get_settings().alert_webhook_url
    log.warning("alert", title=title, detail=detail)
    if not url:
        return False
    try:
        httpx.post(url, json={"text": f"[Phoneme Studio] {title}: {detail}"}, timeout=5)
        return True
    except httpx.HTTPError:
        log.warning("alert_delivery_failed")
        return False
