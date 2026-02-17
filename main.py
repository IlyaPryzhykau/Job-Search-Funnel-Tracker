"""Входная точка FastAPI для API трекера воронки поиска работы."""

import os
from datetime import datetime
from typing import Annotated

from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware

from app.deps import get_db
from app.models import Job, Stage, User
from app.schemas import (
    ConversionMetric,
    JobCreate,
    JobOut,
    JobUpdate,
    MetricsOut,
    StageProgress,
    StageCount,
    StageOut,
    UserCreate,
    UserOut,
)

STAGE_DATE_MAP = {
    "Applied": "applied_at",
    "HR Response": "hr_response_at",
    "Screening": "screening_at",
    "Tech Interview": "tech_interview_at",
    "Homework": "homework_at",
    "Final": "final_at",
    "Offer": "offer_at",
    "Rejected": "rejected_at",
}

load_dotenv()
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
SESSION_SECRET = os.getenv("SESSION_SECRET", "change-me")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
ALLOW_DEV_HEADER = os.getenv("ALLOW_DEV_HEADER", "false").lower() == "true"

app = FastAPI(title="Job Search Funnel Tracker")

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    same_site="lax",
    https_only=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

oauth = OAuth()
if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    oauth.register(
        name="google",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


def _get_default_stage(db: Session) -> Stage:
    """Получить первый этап по порядковому индексу."""
    stage = db.execute(
        select(Stage).order_by(Stage.order_index.asc()).limit(1)
    ).scalar_one()
    return stage


def _get_current_user(
    db: Annotated[Session, Depends(get_db)],
    request: Request,
    x_user_id: int | None = Header(default=None),
) -> User:
    """Определить текущего пользователя по сессии (или dev-хедеру)."""
    user_id = request.session.get("user_id")
    if user_id:
        user = db.get(User, int(user_id))
        if user:
            return user
    if ALLOW_DEV_HEADER and x_user_id is not None:
        user = db.get(User, x_user_id)
        if user:
            return user
    raise HTTPException(status_code=401, detail="Not authenticated.")


def _apply_stage_timestamp(job: Job, stage_name: str, explicit_updates: JobUpdate) -> None:
    """Записать время этапа, если оно не передано явно."""
    date_field = STAGE_DATE_MAP.get(stage_name)
    if not date_field:
        return
    if getattr(explicit_updates, date_field, None) is not None:
        return
    if getattr(job, date_field) is None:
        setattr(job, date_field, datetime.utcnow())


@app.get("/stages", response_model=list[StageOut])
def list_stages(db: Annotated[Session, Depends(get_db)]):
    """Вернуть список всех этапов."""
    stages = db.execute(select(Stage).order_by(Stage.order_index.asc())).scalars().all()
    return stages


@app.post("/users", response_model=UserOut, status_code=201)
def create_user(payload: UserCreate, db: Annotated[Session, Depends(get_db)]):
    """Создать пользователя."""
    existing = (
        db.execute(select(User).where(User.email == payload.email))
        .scalar_one_or_none()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")
    user = User(**payload.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.get("/auth/google/login")
async def google_login(request: Request):
    """Запустить OAuth вход через Google."""
    client = oauth.create_client("google")
    if not client:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured.")
    redirect_uri = request.url_for("auth_google_callback")
    return await client.authorize_redirect(request, redirect_uri)


@app.get("/auth/google/callback", name="auth_google_callback")
async def google_callback(request: Request, db: Annotated[Session, Depends(get_db)]):
    """Обработать OAuth callback и сохранить сессию."""
    client = oauth.create_client("google")
    if not client:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured.")
    token = await client.authorize_access_token(request)
    resp = await client.get(
        "https://openidconnect.googleapis.com/v1/userinfo",
        token=token,
    )
    userinfo = resp.json()
    email = userinfo.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google profile missing email.")
    name = userinfo.get("name")
    provider_sub = userinfo.get("sub")

    user = (
        db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    )
    if user is None:
        user = User(
            email=email,
            name=name,
            provider="google",
            provider_sub=provider_sub,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if user.provider != "google" or user.provider_sub != provider_sub:
            user.provider = "google"
            user.provider_sub = provider_sub
            if name and not user.name:
                user.name = name
            db.commit()

    request.session["user_id"] = user.id
    return RedirectResponse(FRONTEND_ORIGIN)


@app.post("/auth/logout")
def logout(request: Request):
    """Очистить сессию пользователя."""
    request.session.clear()
    return JSONResponse({"ok": True})


@app.get("/me", response_model=UserOut)
def get_me(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(_get_current_user)],
):
    """Вернуть текущего пользователя."""
    return user


@app.get("/jobs", response_model=list[JobOut])
def list_jobs(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(_get_current_user)],
    stage_id: int | None = None,
):
    """Вернуть заявки текущего пользователя с фильтром по этапу."""
    query = select(Job).where(Job.user_id == user.id).order_by(Job.updated_at.desc())
    if stage_id is not None:
        query = query.where(Job.stage_id == stage_id)
    return db.execute(query).scalars().all()


@app.post("/jobs", response_model=JobOut, status_code=201)
def create_job(
    payload: JobCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(_get_current_user)],
):
    """Создать заявку для текущего пользователя."""
    if payload.stage_id is None:
        stage = _get_default_stage(db)
        stage_id = stage.id
    else:
        stage = db.get(Stage, payload.stage_id)
        if not stage:
            raise HTTPException(status_code=400, detail="Invalid stage_id.")
        stage_id = stage.id

    job = Job(
        **payload.model_dump(exclude={"stage_id"}),
        stage_id=stage_id,
        user_id=user.id,
    )
    if job.applied_at is None:
        job.applied_at = datetime.utcnow()
    _apply_stage_timestamp(job, stage.name, JobUpdate())

    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@app.patch("/jobs/{job_id}", response_model=JobOut)
def update_job(
    job_id: int,
    payload: JobUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(_get_current_user)],
):
    """Обновить заявку текущего пользователя."""
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden.")

    if payload.stage_id is not None:
        stage = db.get(Stage, payload.stage_id)
        if not stage:
            raise HTTPException(status_code=400, detail="Invalid stage_id.")
        job.stage_id = stage.id
        _apply_stage_timestamp(job, stage.name, payload)

    for field, value in payload.model_dump(exclude={"stage_id"}, exclude_unset=True).items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)
    return job


@app.get("/metrics", response_model=MetricsOut)
def get_metrics(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(_get_current_user)],
):
    """Вернуть метрики воронки для текущего пользователя."""
    stage_rows = (
        db.execute(
            select(Stage.id, Stage.name, func.count(Job.id))
            .join(
                Job,
                (Job.stage_id == Stage.id) & (Job.user_id == user.id),
                isouter=True,
            )
            .group_by(Stage.id, Stage.name)
            .order_by(Stage.order_index.asc())
        )
        .all()
    )

    stage_counts = [
        StageCount(stage_id=stage_id, stage_name=name, count=count)
        for stage_id, name, count in stage_rows
    ]
    count_by_stage_id = {item.stage_id: item.count for item in stage_counts}

    ordered_stages = (
        db.execute(select(Stage).order_by(Stage.order_index.asc())).scalars().all()
    )
    ordered_main = [stage for stage in ordered_stages if stage.name != "Rejected"]

    timestamp_counts: dict[str, int] = {}
    for stage in ordered_stages:
        date_field = STAGE_DATE_MAP.get(stage.name)
        if not date_field:
            continue
        column = getattr(Job, date_field)
        count = db.execute(
            select(func.count(Job.id)).where(
                Job.user_id == user.id,
                column.is_not(None),
            )
        ).scalar_one()
        timestamp_counts[stage.name] = count

    stage_progress = [
        StageProgress(
            stage_id=stage.id,
            stage_name=stage.name,
            count=timestamp_counts.get(stage.name, 0),
        )
        for stage in ordered_stages
    ]

    conversions: list[ConversionMetric] = []
    for idx in range(len(ordered_main) - 1):
        from_stage = ordered_main[idx]
        to_stage = ordered_main[idx + 1]
        from_count = timestamp_counts.get(from_stage.name, 0)
        to_count = timestamp_counts.get(to_stage.name, 0)
        conversion = None
        if from_count > 0:
            conversion = to_count / from_count
        conversions.append(
            ConversionMetric(
                from_stage_id=from_stage.id,
                from_stage_name=from_stage.name,
                to_stage_id=to_stage.id,
                to_stage_name=to_stage.name,
                conversion_rate=conversion,
            )
        )

    response_rows = db.execute(
        select(Job.applied_at, Job.hr_response_at).where(
            Job.user_id == user.id,
            Job.applied_at.is_not(None),
            Job.hr_response_at.is_not(None),
        )
    ).all()
    avg_days = None
    if response_rows:
        total_days = 0.0
        for applied_at, hr_response_at in response_rows:
            total_days += (hr_response_at - applied_at).total_seconds() / 86400
        avg_days = total_days / len(response_rows)

    return MetricsOut(
        stage_counts=stage_counts,
        stage_progress=stage_progress,
        conversions=conversions,
        avg_hr_response_days=avg_days,
    )
