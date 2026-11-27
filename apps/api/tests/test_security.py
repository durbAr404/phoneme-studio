"""Security behaviour: these are the tests to point at in an interview."""

from tests.conftest import CSRF, WORDLE


def test_mutations_need_csrf_header(client):
    client.headers.pop("X-Requested-With")
    assert client.post("/shares", json=WORDLE).status_code == 403


def test_foreign_origin_is_blocked(client):
    r = client.post("/shares", json=WORDLE, headers={"Origin": "https://evil.example"})
    assert r.status_code == 403


def test_security_headers_present(client):
    h = client.get("/health").headers
    assert h["x-content-type-options"] == "nosniff"
    assert h["x-frame-options"] == "DENY"
    assert "x-request-id" in h


def test_rate_limit_on_share_creation(client):
    codes = [client.post("/shares", json=WORDLE).status_code for _ in range(31)]
    assert codes[:30] == [201] * 30 and codes[30] == 429


def test_save_code_update_needs_token(client):
    created = client.post("/saves", json={"data": {"progress": {}}}).json()
    r = client.put(f"/saves/{created['code']}", json={"data": {"x": 1}}, headers={**CSRF, "X-Edit-Token": "wrong"})
    assert r.status_code == 403


def test_cron_needs_secret(client):
    assert client.post("/internal/cron/cleanup").status_code == 401
    assert client.post("/internal/cron/cleanup", headers={"Authorization": "Bearer test-cron"}).status_code == 200
