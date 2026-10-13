"""Urgent Fix - Python backend (FastAPI).

How the pieces fit together:
  React (browser)  ->  this Python API  ->  Supabase (Postgres database)

Only this file talks to Supabase. The Supabase secret key is read from
environment variables and is never sent to the browser.

Accounts:
  * POST /api/auth/signup  creates an account (the password is stored only as a
    salted scrypt hash in the `app_users` table, never as plain text).
  * POST /api/auth/login   checks the password and returns a signed session token.
  * Every /api/reports call needs that token, and a renter can only ever see or
    save reports under the email address inside their own token.
"""

import base64
import hashlib
import hmac
import json
import logging
import os
import re
import secrets
import time
from datetime import date, timedelta
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field, field_validator
from supabase import Client, create_client

# Local development: read SUPABASE_URL and SUPABASE_SERVICE_KEY from the .env file.
# On Vercel there is no .env file - the same names come from Project Settings.
load_dotenv()

logger = logging.getLogger("urgent-fix")

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
TABLE_NAME = "reports"
USERS_TABLE = "app_users"
MAX_REPORTS_RETURNED = 20

MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128
SESSION_SECONDS = 8 * 60 * 60  # a sign-in lasts 8 hours

# scrypt settings (about 16 MB of memory per check, which suits a small server).
SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_LENGTH = 32

app = FastAPI(title="Urgent Fix API")


# --------------------------------------------------------------------------
# Database connection
# --------------------------------------------------------------------------
@lru_cache(maxsize=1)
def _create_client() -> Client:
    url = os.environ.get("SUPABASE_URL", "").strip()
    key = os.environ.get("SUPABASE_SERVICE_KEY", "").strip()
    if not url or not key:
        raise RuntimeError("SUPABASE_URL or SUPABASE_SERVICE_KEY is not set")
    return create_client(url, key)


def get_db() -> Client:
    """Return the Supabase client, or a clear 500 if the server is not configured."""
    try:
        return _create_client()
    except RuntimeError:
        logger.error("Supabase environment variables are missing")
        raise HTTPException(
            status_code=500,
            detail="The server is not set up to reach the database yet.",
        )


# --------------------------------------------------------------------------
# Passwords and session tokens
# --------------------------------------------------------------------------
def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def hash_password(password: str) -> str:
    """Return 'scrypt$N$r$p$salt$hash'. A fresh random salt is used every time."""
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
        dklen=SCRYPT_LENGTH,
    )
    return f"scrypt${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, stored: str) -> bool:
    """Check a password against a stored hash in constant time."""
    try:
        scheme, n, r, p, salt, digest = stored.split("$")
        if scheme != "scrypt":
            return False
        expected = _unb64(digest)
        actual = hashlib.scrypt(
            password.encode("utf-8"),
            salt=_unb64(salt),
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(expected),
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(actual, expected)


@lru_cache(maxsize=1)
def _dummy_hash() -> str:
    """Used when an email is unknown so a wrong email takes as long as a wrong password."""
    return hash_password("not-a-real-password")


def _session_key() -> bytes:
    """The secret that signs session tokens. Server-side only, never sent to the browser."""
    explicit = os.environ.get("SESSION_SECRET", "").strip()
    if explicit:
        return explicit.encode("utf-8")
    service_key = os.environ.get("SUPABASE_SERVICE_KEY", "").strip()
    if not service_key:
        raise RuntimeError("No key is available to sign sessions")
    # Derive a separate signing key so the database key itself is never used directly.
    return hmac.new(
        service_key.encode("utf-8"), b"urgent-fix-session-signing-v1", hashlib.sha256
    ).digest()


def make_token(email: str) -> str:
    """A signed token: base64(payload).signature. It proves who the renter is."""
    payload = {"sub": email, "exp": int(time.time()) + SESSION_SECONDS}
    body = _b64(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = _b64(hmac.new(_session_key(), body.encode("ascii"), hashlib.sha256).digest())
    return f"{body}.{signature}"


def read_token(token: str) -> Optional[str]:
    """Return the email inside a valid, unexpired token - otherwise None."""
    try:
        body, signature = token.split(".")
        expected = _b64(hmac.new(_session_key(), body.encode("ascii"), hashlib.sha256).digest())
        if not hmac.compare_digest(signature, expected):
            return None
        payload = json.loads(_unb64(body))
        if int(payload["exp"]) < time.time():
            return None
        email = payload["sub"]
        return email if isinstance(email, str) and email else None
    except RuntimeError:
        raise
    except Exception:
        return None


def current_user(authorization: Optional[str] = Header(default=None)) -> str:
    """Dependency for protected routes: returns the signed-in renter's email or 401."""
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Please log in to continue.")
    try:
        email = read_token(token.strip())
    except RuntimeError:
        logger.error("Session signing key is missing")
        raise HTTPException(
            status_code=500,
            detail="The server is not set up to sign you in yet.",
        )
    if not email:
        raise HTTPException(
            status_code=401,
            detail="Your session has expired. Please log in again.",
        )
    return email


def _new_session(email: str) -> dict:
    try:
        return {"email": email, "token": make_token(email)}
    except RuntimeError:
        logger.error("Session signing key is missing")
        raise HTTPException(
            status_code=500,
            detail="The server is not set up to sign you in yet.",
        )


# --------------------------------------------------------------------------
# Request validation
# --------------------------------------------------------------------------
def _clean_email(value: str) -> str:
    value = value.strip().lower()
    if not EMAIL_PATTERN.match(value):
        raise ValueError("Enter a valid email address.")
    return value


class LoginIn(BaseModel):
    """Email and password sent to log in."""

    email: str = Field(max_length=254)
    password: str = Field(min_length=1, max_length=MAX_PASSWORD_LENGTH)

    @field_validator("email")
    @classmethod
    def check_email(cls, value: str) -> str:
        return _clean_email(value)


class SignUpIn(LoginIn):
    """Email and password sent to create an account (the password must be strong enough)."""

    @field_validator("password")
    @classmethod
    def check_strength(cls, value: str) -> str:
        if (
            len(value) < MIN_PASSWORD_LENGTH
            or not re.search(r"[A-Za-z]", value)
            or not re.search(r"\d", value)
        ):
            raise ValueError(
                f"Use at least {MIN_PASSWORD_LENGTH} characters, with a letter and a number."
            )
        return value


class ReportIn(BaseModel):
    """The data React sends when a renter submits a report.

    The renter's own email is not part of this: it comes from their session token.
    """

    description: str = Field(max_length=2000)
    date_noticed: date
    photo_name: Optional[str] = Field(default=None, max_length=255)
    photo_size: Optional[int] = Field(default=None, ge=0, le=2_147_483_647)
    rental_address: str = Field(max_length=300)
    contact_email: str = Field(max_length=254)

    @field_validator("contact_email")
    @classmethod
    def check_email(cls, value: str) -> str:
        return _clean_email(value)

    @field_validator("description", "rental_address")
    @classmethod
    def check_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty.")
        return value

    @field_validator("date_noticed")
    @classmethod
    def check_not_in_future(cls, value: date) -> date:
        # One day of slack because the server clock (UTC) can be behind Victoria.
        if value > date.today() + timedelta(days=1):
            raise ValueError("The date you first noticed the problem cannot be in the future.")
        return value


# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------
@app.get("/api/health")
def health():
    """Quick check used while testing: is the API up and are the keys present?"""
    configured = bool(
        os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_KEY")
    )
    return {"status": "ok", "database_configured": configured}


def _is_missing_users_table(error: Exception) -> bool:
    text = f"{getattr(error, 'code', '')} {error}"
    return "PGRST205" in text or "app_users" in text and "not find" in text


@app.post("/api/auth/signup", status_code=201)
def sign_up(credentials: SignUpIn):
    """Create a new account and log the renter straight in."""
    db = get_db()
    email = credentials.email

    try:
        existing = db.table(USERS_TABLE).select("id").eq("email", email).limit(1).execute()
        if existing.data:
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists. Try logging in.",
            )
        db.table(USERS_TABLE).insert(
            {"email": email, "password_hash": hash_password(credentials.password)}
        ).execute()
    except HTTPException:
        raise
    except Exception as error:
        if getattr(error, "code", "") == "23505" or "duplicate key" in str(error).lower():
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists. Try logging in.",
            )
        if _is_missing_users_table(error):
            logger.error("The app_users table is missing - run supabase/auth.sql")
            raise HTTPException(
                status_code=503,
                detail="Accounts are not set up yet. Please try again later.",
            )
        logger.exception("Could not create account")
        raise HTTPException(
            status_code=502,
            detail="We could not create your account. Please try again.",
        )

    return _new_session(email)


@app.post("/api/auth/login")
def log_in(credentials: LoginIn):
    """Check the email and password and return a session token."""
    db = get_db()
    email = credentials.email

    try:
        result = db.table(USERS_TABLE).select("password_hash").eq("email", email).limit(1).execute()
    except Exception as error:
        if _is_missing_users_table(error):
            logger.error("The app_users table is missing - run supabase/auth.sql")
            raise HTTPException(
                status_code=503,
                detail="Accounts are not set up yet. Please try again later.",
            )
        logger.exception("Could not look up account")
        raise HTTPException(
            status_code=502,
            detail="We could not log you in. Please try again.",
        )

    found = bool(result.data)
    stored = result.data[0]["password_hash"] if found else _dummy_hash()
    password_ok = verify_password(credentials.password, stored)

    # One message for "no such email" and "wrong password", so it does not reveal which.
    if not (found and password_ok):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    return _new_session(email)


@app.post("/api/reports", status_code=201)
def create_report(report: ReportIn, user_email: str = Depends(current_user)):
    """Save a new repair report in the Supabase `reports` table for the signed-in renter."""
    db = get_db()
    row = report.model_dump(mode="json")
    row["user_email"] = user_email  # always the verified email, never a value from the browser
    try:
        result = db.table(TABLE_NAME).insert(row).execute()
    except Exception:
        logger.exception("Could not insert report")
        raise HTTPException(
            status_code=502,
            detail="We could not save your report. Please try again.",
        )
    if not result.data:
        raise HTTPException(status_code=502, detail="We could not save your report.")
    return result.data[0]


@app.get("/api/reports")
def list_reports(user_email: str = Depends(current_user)):
    """Return the most recent reports saved by the signed-in renter (newest first)."""
    db = get_db()
    try:
        result = (
            db.table(TABLE_NAME)
            .select("*")
            .eq("user_email", user_email)
            .order("created_at", desc=True)
            .limit(MAX_REPORTS_RETURNED)
            .execute()
        )
    except Exception:
        logger.exception("Could not load reports")
        raise HTTPException(
            status_code=502,
            detail="We could not load your reports. Please try again.",
        )
    return result.data
