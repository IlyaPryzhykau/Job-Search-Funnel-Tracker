"""Конфигурация базы данных и настройка сессий SQLAlchemy."""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


class Base(DeclarativeBase):
    """Базовый класс для моделей SQLAlchemy."""

    pass


def _build_engine():
    """Создать SQLAlchemy engine на основе DATABASE_URL."""
    load_dotenv()
    database_url = os.getenv("DATABASE_URL", "sqlite:///./job_funnel.db")
    connect_args = {}
    if database_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    return create_engine(database_url, connect_args=connect_args, future=True)


engine = _build_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
