# Frontend

## Features
- Kanban board for stages.
- Modal to view/edit job.
- RU/EN toggle.

## Structure
- `components/` UI building blocks.
- `services/api.ts` HTTP client.
- `types.ts` shared models.

## UI notes
- Company always first line, role second line.
- Cards have fixed height with 2-line clamp for long fields.

## API
- Base URL from `VITE_API_URL` (default `http://localhost:8003`).
- OAuth via cookies; dev header only with `VITE_DEV_USER_ID`.
- Metrics derived from timestamp fields.
