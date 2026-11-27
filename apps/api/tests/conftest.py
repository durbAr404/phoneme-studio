import os

os.environ.update(
    {
        "ENV": "test",
        "DATABASE_URL": os.environ.get("TEST_DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/phonemestudio_test"),
        "DEV_LOGIN_ENABLED": "true",
        "ADMIN_EMAILS": "admin@example.com",
        "ALLOWED_ORIGINS": "http://localhost:3000",
        "CRON_SECRET": "test-cron",
        "REDIS_URL": "",
    }
)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.db import Base, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.security import ratelimit  # noqa: E402
from app.seed import run as seed  # noqa: E402

CSRF = {"X-Requested-With": "phonemestudio"}


@pytest.fixture(scope="session", autouse=True)
def database():
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
    Base.metadata.create_all(engine)
    seed()
    yield


@pytest.fixture(autouse=True)
def reset_limits():
    ratelimit.store().reset()
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        c.headers.update(CSRF)
        yield c


def login(c: TestClient, email: str, role: str = "teacher") -> TestClient:
    r = c.post("/auth/dev-login", json={"email": email, "role": role})
    assert r.status_code == 200, r.text
    return c


@pytest.fixture
def admin(client):
    return login(client, "admin@example.com", "admin")


@pytest.fixture
def teacher(client):
    return login(client, "teacher@example.com")


@pytest.fixture
def demo(client):
    assert client.post("/auth/demo").status_code == 200
    return client


WORDLE = {
    "kind": "wordle",
    "title": "Test game",
    "words": [{"english": "thin", "phonemes": ["θ", "ɪ", "n"]}, {"english": "ship", "phonemes": ["ʃ", "ɪ", "p"]}],
}
