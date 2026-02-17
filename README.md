# Job Search Funnel Tracker

Lightweight tracker for job applications with a kanban funnel and metrics.

## Stack
- API: FastAPI + SQLAlchemy + Alembic
- DB: Postgres
- Frontend: React + Vite

## Stages
- Applied
- HR Response
- Screening
- Tech Interview
- Homework
- Final
- Offer
- Rejected

## Local Run (Docker)
1) Ensure Docker is running.
2) Create `.env` from the example below.
3) Start:
```
docker compose up --build
```
4) Open:
- API: http://localhost:8003
- Frontend: http://localhost:5173

## Local Run (API only)
1) Create and activate venv.
2) Install:
```
pip install -r requirements.txt
```
3) Set `DATABASE_URL`.
4) Run migrations:
```
alembic upgrade head
```
5) Start API:
```
uvicorn main:app --reload
```

## Frontend
1) `cd frontend`
2) `npm install`
3) `.env`:
```
VITE_API_URL=http://localhost:8003
```
4) `npm run dev`

## Google Auth
This project uses Google OAuth (only Google accounts can sign in).

1) Create an OAuth Client ID in Google Cloud Console (Web application).
2) Add authorized redirect URI:
```
http://localhost:8003/auth/google/callback
```
3) Set these env vars:
```
FRONTEND_ORIGIN=http://localhost:5173
SESSION_SECRET=change-me
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

## Local Auth Testing (dev only)
If you need to bypass Google locally, enable the dev header:
```
ALLOW_DEV_HEADER=true
VITE_DEV_USER_ID=1
```

## .env example
```
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5438/job_funnel
FRONTEND_ORIGIN=http://localhost:5173
SESSION_SECRET=change-me
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
VITE_DEV_USER_ID=
```
