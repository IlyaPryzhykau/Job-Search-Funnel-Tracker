# Architecture

## Overview
Backend (FastAPI) + frontend (React) with Postgres.

## Backend
- FastAPI HTTP API.
- SQLAlchemy ORM.
- Alembic migrations.
- Postgres DB (SQLite for local fallback).

## Data model
- `User` owns `Job` entries.
- `Stage` defines pipeline steps.
- `Job` belongs to a `Stage` and a `User`.

## Auth
- Google OAuth with session cookies.
- Dev `X-User-Id` header only when `ALLOW_DEV_HEADER=true`.

## Metrics
- Stage counts from current stage.
- Funnel progress from timestamp fields.
- Conversion uses adjacent timestamp counts.
