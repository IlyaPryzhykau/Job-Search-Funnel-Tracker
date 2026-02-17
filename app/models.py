"""Модели базы данных для трекера воронки поиска работы."""

from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base


class Stage(Base):
    """Определение этапа воронки."""

    __tablename__ = "stages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    order_index: Mapped[int] = mapped_column(Integer, index=True)
    is_terminal: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    jobs: Mapped[list["Job"]] = relationship("Job", back_populates="stage")


class User(Base):
    """Пользователь приложения (поля совместимы с OAuth)."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    provider: Mapped[str | None] = mapped_column(String(32), nullable=True)
    provider_sub: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    jobs: Mapped[list["Job"]] = relationship("Job", back_populates="user")


class Job(Base):
    """Заявка на вакансию, отслеживаемая в воронке."""

    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company: Mapped[str] = mapped_column(String(128), index=True)
    position: Mapped[str] = mapped_column(String(128), index=True)
    source: Mapped[str | None] = mapped_column(String(64), nullable=True)
    salary: Mapped[str | None] = mapped_column(String(64), nullable=True)
    stack: Mapped[str | None] = mapped_column(String(128), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[str | None] = mapped_column(String(16), nullable=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    stage_id: Mapped[int] = mapped_column(ForeignKey("stages.id"))
    applied_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    hr_response_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    screening_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    tech_interview_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    homework_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    final_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    offer_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    stage: Mapped[Stage] = relationship("Stage", back_populates="jobs")
    user: Mapped[User] = relationship("User", back_populates="jobs")
