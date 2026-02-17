"""Pydantic-схемы для запросов и ответов API."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    """Данные для создания пользователя."""

    email: str
    name: str | None = None
    provider: str | None = None
    provider_sub: str | None = None


class UserOut(BaseModel):
    """Ответ с данными пользователя."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str | None
    provider: str | None
    provider_sub: str | None


class StageOut(BaseModel):
    """Ответ с данными этапа."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    order_index: int
    is_terminal: bool


class JobBase(BaseModel):
    """Общие поля заявки."""

    company: str
    position: str
    source: str | None = None
    salary: str | None = None
    stack: str | None = None
    notes: str | None = None
    priority: str | None = None
    applied_at: datetime | None = None
    hr_response_at: datetime | None = None
    screening_at: datetime | None = None
    tech_interview_at: datetime | None = None
    homework_at: datetime | None = None
    final_at: datetime | None = None
    offer_at: datetime | None = None
    rejected_at: datetime | None = None


class JobCreate(JobBase):
    """Данные для создания заявки."""

    stage_id: int | None = None


class JobUpdate(BaseModel):
    """Данные для обновления заявки."""

    company: str | None = None
    position: str | None = None
    source: str | None = None
    salary: str | None = None
    stack: str | None = None
    notes: str | None = None
    priority: str | None = None
    stage_id: int | None = None
    applied_at: datetime | None = None
    hr_response_at: datetime | None = None
    screening_at: datetime | None = None
    tech_interview_at: datetime | None = None
    homework_at: datetime | None = None
    final_at: datetime | None = None
    offer_at: datetime | None = None
    rejected_at: datetime | None = None


class JobOut(JobBase):
    """Ответ с данными заявки."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    stage_id: int
    created_at: datetime
    updated_at: datetime


class StageCount(BaseModel):
    """Счетчик этапа для метрик."""

    stage_id: int
    stage_name: str
    count: int


class StageProgress(BaseModel):
    """Количество заявок, прошедших этап (по timestamp-полю)."""

    stage_id: int
    stage_name: str
    count: int


class ConversionMetric(BaseModel):
    """Конверсия между двумя этапами."""

    from_stage_id: int
    from_stage_name: str
    to_stage_id: int
    to_stage_name: str
    conversion_rate: float | None


class MetricsOut(BaseModel):
    """Ответ с агрегированными метриками."""

    stage_counts: list[StageCount]
    stage_progress: list[StageProgress]
    conversions: list[ConversionMetric]
    avg_hr_response_days: float | None
