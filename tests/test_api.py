"""Backend tests for the Urgent Fix API (accounts, sessions and reports).

They use a small in-memory stand-in for Supabase, so no real database or key is needed.
Run from the project folder with:  python -m pytest tests -q
(Needs: pip install pytest httpx)
"""

import sys
import time
from datetime import date
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api import index as api  # noqa: E402


# --------------------------------------------------------------------------
# A tiny fake of the Supabase calls the API makes
# --------------------------------------------------------------------------
class FakeDuplicateError(Exception):
    code = "23505"


class FakeQuery:
    def __init__(self, store, name):
        self.store = store
        self.name = name
        self.action = "select"
        self.row = None
        self.filters = []
        self.order_by = None
        self.max_rows = None

    def select(self, *_columns):
        self.action = "select"
        return self

    def insert(self, row):
        self.action = "insert"
        self.row = dict(row)
        return self

    def eq(self, column, value):
        self.filters.append((column, value))
        return self

    def order(self, column, desc=False):
        self.order_by = (column, desc)
        return self

    def limit(self, count):
        self.max_rows = count
        return self

    def execute(self):
        rows = self.store.setdefault(self.name, [])
        if self.action == "insert":
            if self.name == "app_users" and any(r["email"] == self.row["email"] for r in rows):
                raise FakeDuplicateError("duplicate key value violates unique constraint")
            saved = {
                "id": f"id-{len(rows) + 1:08d}-aaaa-bbbb-cccc-dddddddddddd",
                "created_at": f"2026-10-0{len(rows) % 9 + 1}T01:00:00+00:00",
                **self.row,
            }
            rows.append(saved)
            return SimpleNamespace(data=[saved])

        found = [r for r in rows if all(r.get(c) == v for c, v in self.filters)]
        if self.order_by:
            column, desc = self.order_by
            found.sort(key=lambda r: r[column], reverse=desc)
        if self.max_rows is not None:
            found = found[: self.max_rows]
        return SimpleNamespace(data=[dict(r) for r in found])


class FakeDB:
    def __init__(self):
        self.store = {}

    def table(self, name):
        return FakeQuery(self.store, name)


@pytest.fixture()
def db(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "fake-service-key-for-unit-tests-only")
    monkeypatch.delenv("SESSION_SECRET", raising=False)
    fake = FakeDB()
    monkeypatch.setattr(api, "get_db", lambda: fake)
    return fake


@pytest.fixture()
def client(db):
    return TestClient(api.app)


def signup(client, email="renter@example.com", password="Sunshine123"):
    return client.post("/api/auth/signup", json={"email": email, "password": password})


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


def report_body(**overrides):
    body = {
        "description": "Kitchen tap is leaking",
        "date_noticed": date.today().isoformat(),
        "photo_name": "leak.jpg",
        "photo_size": 1450000,
        "rental_address": "12/45 Smith Street, Fitzroy VIC 3065",
        "contact_email": "landlord@example.com",
    }
    body.update(overrides)
    return body


# --------------------------------------------------------------------------
# Create account
# --------------------------------------------------------------------------
def test_signup_creates_account_and_returns_token(client, db):
    response = signup(client, email="  Renter@Example.COM ")
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "renter@example.com"
    assert body["token"].count(".") == 1
    assert len(db.store["app_users"]) == 1


def test_password_is_never_stored_as_plain_text(client, db):
    signup(client, password="Sunshine123")
    stored = db.store["app_users"][0]["password_hash"]
    assert stored.startswith("scrypt$")
    assert "Sunshine123" not in stored


def test_same_password_gets_a_different_hash_each_time(client, db):
    signup(client, email="a@example.com")
    signup(client, email="b@example.com")
    hashes = [row["password_hash"] for row in db.store["app_users"]]
    assert hashes[0] != hashes[1]


def test_signup_rejects_duplicate_email(client):
    assert signup(client).status_code == 201
    second = signup(client, email="RENTER@example.com")
    assert second.status_code == 409
    assert "already exists" in second.json()["detail"]


@pytest.mark.parametrize(
    "password", ["short1", "allletterslong", "12345678901", "        ", ""]
)
def test_signup_rejects_weak_passwords(client, password):
    response = signup(client, password=password)
    assert response.status_code == 422


def test_signup_rejects_bad_email(client):
    assert signup(client, email="not-an-email").status_code == 422


def test_signup_rejects_very_long_password(client):
    assert signup(client, password="a1" * 100).status_code == 422


# --------------------------------------------------------------------------
# Log in
# --------------------------------------------------------------------------
def test_login_works_with_the_right_password(client):
    signup(client)
    response = client.post(
        "/api/auth/login", json={"email": "Renter@example.com", "password": "Sunshine123"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "renter@example.com"
    assert response.json()["token"]


def test_login_fails_with_wrong_password_and_unknown_email_with_same_message(client):
    signup(client)
    wrong_password = client.post(
        "/api/auth/login", json={"email": "renter@example.com", "password": "Wrong12345"}
    )
    unknown_email = client.post(
        "/api/auth/login", json={"email": "nobody@example.com", "password": "Sunshine123"}
    )
    assert wrong_password.status_code == 401
    assert unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json() == {"detail": "Incorrect email or password."}


def test_login_with_empty_password_is_rejected(client):
    response = client.post("/api/auth/login", json={"email": "a@example.com", "password": ""})
    assert response.status_code == 422


def test_verify_password_handles_garbage_hashes(client):
    assert api.verify_password("x", "not-a-hash") is False
    assert api.verify_password("x", "scrypt$a$b$c$d$e") is False


# --------------------------------------------------------------------------
# Reports need a session
# --------------------------------------------------------------------------
def test_reports_need_a_token(client):
    assert client.get("/api/reports").status_code == 401
    assert client.post("/api/reports", json=report_body()).status_code == 401
    wrong_scheme = client.get("/api/reports", headers={"Authorization": "Basic abc"})
    assert wrong_scheme.status_code == 401


def test_saved_report_is_filed_under_the_verified_email(client, db):
    token = signup(client).json()["token"]
    # Even if the browser tries to send someone else's email, the token wins.
    body = report_body(user_email="victim@example.com")
    response = client.post("/api/reports", json=body, headers=bearer(token))
    assert response.status_code == 201
    assert response.json()["user_email"] == "renter@example.com"
    assert db.store["reports"][0]["user_email"] == "renter@example.com"


def test_each_renter_only_sees_their_own_reports(client):
    alice = signup(client, email="alice@example.com").json()["token"]
    bob = signup(client, email="bob@example.com").json()["token"]
    client.post("/api/reports", json=report_body(description="Alice's leak"), headers=bearer(alice))
    client.post("/api/reports", json=report_body(description="Bob's heater"), headers=bearer(bob))

    alice_reports = client.get("/api/reports", headers=bearer(alice)).json()
    bob_reports = client.get("/api/reports", headers=bearer(bob)).json()
    assert [r["description"] for r in alice_reports] == ["Alice's leak"]
    assert [r["description"] for r in bob_reports] == ["Bob's heater"]


def test_report_validation_still_applies(client):
    token = signup(client).json()["token"]
    blank = client.post("/api/reports", json=report_body(description="   "), headers=bearer(token))
    future = client.post(
        "/api/reports", json=report_body(date_noticed="2999-01-01"), headers=bearer(token)
    )
    bad_email = client.post(
        "/api/reports", json=report_body(contact_email="nope"), headers=bearer(token)
    )
    assert blank.status_code == future.status_code == bad_email.status_code == 422


# --------------------------------------------------------------------------
# Tokens
# --------------------------------------------------------------------------
def test_tampered_token_is_rejected(client):
    token = signup(client).json()["token"]
    body, signature = token.split(".")
    forged_body = api._b64(b'{"sub":"victim@example.com","exp":9999999999}')
    for bad in (f"{forged_body}.{signature}", f"{body}.{signature[:-2]}AA", "garbage", ""):
        response = client.get("/api/reports", headers=bearer(bad))
        assert response.status_code == 401, bad


def test_expired_token_is_rejected(client, monkeypatch):
    token = signup(client).json()["token"]
    later = time.time() + api.SESSION_SECONDS + 5
    monkeypatch.setattr(api.time, "time", lambda: later)
    response = client.get("/api/reports", headers=bearer(token))
    assert response.status_code == 401
    assert "expired" in response.json()["detail"]


def test_token_signed_with_another_key_is_rejected(client, monkeypatch):
    token = signup(client).json()["token"]
    monkeypatch.setenv("SESSION_SECRET", "a-different-secret-value")
    assert client.get("/api/reports", headers=bearer(token)).status_code == 401


def test_missing_server_key_gives_a_clear_error(monkeypatch):
    monkeypatch.delenv("SUPABASE_SERVICE_KEY", raising=False)
    monkeypatch.delenv("SESSION_SECRET", raising=False)
    monkeypatch.setattr(api, "get_db", lambda: FakeDB())
    client = TestClient(api.app)
    response = client.post(
        "/api/auth/signup", json={"email": "a@example.com", "password": "Sunshine123"}
    )
    assert response.status_code == 500
    assert "not set up" in response.json()["detail"]


def test_responses_never_contain_the_secret_key(client):
    response = signup(client)
    assert "fake-service-key-for-unit-tests-only" not in response.text


def test_health_still_works(client):
    assert client.get("/api/health").json()["status"] == "ok"
