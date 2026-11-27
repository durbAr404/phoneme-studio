from datetime import UTC, datetime

from tests.conftest import CSRF, WORDLE


def test_health_and_ready(client):
    assert client.get("/health").json()["status"] == "ok"
    assert client.get("/ready").json()["status"] == "ready"


def test_word_library_filters(client):
    data = client.get("/words", params={"sound": "θ"}).json()
    assert data["total"] > 0 and all("θ" in w["phonemes"] for w in data["items"])
    lists = client.get("/lists").json()
    assert {lst["slug"] for lst in lists} >= {"three-sounds", "th-words"}


def test_gallery_only_shows_published_real_activities(client):
    items = client.get("/gallery").json()
    assert items and all(a["is_published"] for a in items)
    assert len({a["title"] for a in items}) == len(items)  # no demo duplicates
    wordles = client.get("/gallery", params={"kind": "wordle"}).json()
    assert all(a["kind"] == "wordle" for a in wordles)


def test_share_round_trip_and_validation(client):
    sid = client.post("/shares", json=WORDLE).json()["id"]
    got = client.get(f"/shares/{sid}").json()
    assert got["title"] == "Test game" and got["words"][0]["phonemes"] == ["θ", "ɪ", "n"]
    bad = {**WORDLE, "words": [{"english": "x", "phonemes": ["q"]}]}
    r = client.post("/shares", json=bad)
    assert r.status_code == 422 and "not an HCE sound" in r.json()["detail"]


def test_plays_are_validated(client):
    sid = client.post("/shares", json=WORDLE).json()["id"]
    ok = {"share_id": sid, "player_id": "player-12345", "solved": 2, "total": 2, "duration_ms": 1000}
    assert client.post("/plays", json=ok).status_code == 201
    assert client.post("/plays", json={**ok, "solved": 3}).status_code == 422
    assert client.post("/plays", json={**ok, "nickname": "<script>"}).status_code == 422


def test_save_codes(client):
    created = client.post("/saves", json={"data": {"streak": 3}}).json()
    assert created["code"].count("-") == 2
    assert client.get(f"/saves/{created['code']}").json()["data"] == {"streak": 3}
    r = client.put(f"/saves/{created['code']}", json={"data": {"streak": 4}}, headers={**CSRF, "X-Edit-Token": created["edit_token"]})
    assert r.status_code == 200
    assert client.get(f"/saves/{created['code']}").json()["data"]["streak"] == 4
    assert client.get("/saves/koala-river-0000x").status_code == 404


def test_daily_challenge_hides_answer_until_done(client):
    today = datetime.now(UTC).date().isoformat()
    info = client.get("/daily", params={"day": today}).json()
    wrong = ["ʒ"] * info["length"]
    r = client.post("/daily/guess", json={"date": today, "guess": wrong, "attempt": 1}).json()
    assert r["answer"] is None and not r["solved"]
    r = client.post("/daily/guess", json={"date": today, "guess": wrong, "attempt": 6}).json()
    answer = r["answer"]["phonemes"]
    win = client.post("/daily/guess", json={"date": today, "guess": answer, "attempt": 2}).json()
    assert win["solved"] and win["states"] == ["correct"] * len(answer)


def test_unknown_errors_return_request_id(client, monkeypatch):
    from app.routers import public

    def boom(*a, **k):
        raise RuntimeError("kaboom")

    monkeypatch.setattr(public, "PHONEMES", None)  # forces a TypeError inside /sounds
    r = client.get("/sounds")
    assert r.status_code == 500 and "request_id" in r.json()


def test_daily_word_changes_each_day_and_cycles_without_repeats():
    from datetime import date, timedelta

    from app.db import SessionLocal
    from app.services.daily import daily_word

    with SessionLocal() as db:
        words = [daily_word(db, date(2026, 1, 1) + timedelta(days=i)).english for i in range(30)]
    assert len(set(words)) == 30  # no repeats within the cycle
