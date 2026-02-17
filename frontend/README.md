# Frontend

React + Vite UI for Job Search Funnel Tracker.

## Run

1) Install dependencies

```
npm install
```

2) Configure API (optional)

```
# .env
VITE_API_URL=http://localhost:8000
VITE_USER_ID=1
```

3) Start dev server

```
npm run dev
```

The app runs on http://localhost:5173 by default.

## Notes
- UI connects to the FastAPI backend (`/stages`, `/jobs`, `/metrics`).
- Drag cards between columns to update stage timestamps.
- Language toggle switches RU/EN content.
