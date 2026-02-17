"""Зависимости FastAPI."""

from collections.abc import Generator
from .db import SessionLocal


def get_db() -> Generator:
    """Предоставить сессию БД на время запроса."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
