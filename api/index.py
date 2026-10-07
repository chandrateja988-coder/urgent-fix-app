"""Urgent Fix - Python backend (FastAPI).

How the pieces fit together:
  React (browser)  ->  this Python API  ->  Supabase (Postgres database)

Only this file talks to Supabase. The Supabase secret key is read from
environment variables and is never sent to the browser.
"""

import logging
import os
import re
from datetime import date, timedelta
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from supabase import Client, create_client

# Local development: read SUPABASE_URL and SUPABASE_SERVICE_KEY from the .env file.
# On Vercel there is no .env file - the same two names come from Project Settings.
load_dotenv()

logger = logging.getLogger("urgent-fix")

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
TABLE_NAME = "reports"
MAX_REPORTS_RETURNED = 20

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
# Request validation
# --------------------------------------------------------------------------
def _clean_email(value: str) -> str:
    value = value.strip().lower()
    if not EMAIL_PATTERN.match(value):
        raise ValueError("Enter a valid email address.")
    return value


class ReportIn(BaseModel):
    """The data React sends when a renter submits a report."""

    user_email: str = Field(max_length=254)
    description: str = Field(max_length=2000)
    date_noticed: date
    photo_name: Optional[str] = Field(default=None, max_length=255)
    photo_size: Optional[int] = Field(default=None, ge=0, le=2_147_483_647)
    rental_address: str = Field(max_length=300)
    contact_email: str = Field(max_length=254)

    @field_validator("user_email", "contact_email")
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


@app.post("/api/reports", status_code=201)
def create_report(report: ReportIn):
    """Save a new repair report in the Supabase `reports` table."""
    db = get_db()
    row = report.model_dump(mode="json")
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
def list_reports(user_email: str = Query(..., max_length=254)):
    """Return the most recent reports saved by one renter (newest first)."""
    try:
        email = _clean_email(user_email)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))

    db = get_db()
    try:
        result = (
            db.table(TABLE_NAME)
            .select("*")
            .eq("user_email", email)
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
