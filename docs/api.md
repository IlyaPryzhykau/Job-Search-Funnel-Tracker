# API

Base URL: `http://localhost:8003`

## Auth
- Google OAuth with session cookies.
- Dev header `X-User-Id` works only when `ALLOW_DEV_HEADER=true`.

## Endpoints

### `POST /users`
Create a user (used by OAuth flow).

### `GET /me`
Get current user.

### `GET /stages`
List stages.

### `GET /jobs`
List jobs for current user (optional `stage_id`).

### `POST /jobs`
Create a job for current user.

### `PATCH /jobs/{job_id}`
Update a job for current user.

### `GET /metrics`
Get funnel metrics for current user.

#### Metrics notes
- `stage_counts` counts jobs by current stage.
- `stage_progress` counts jobs that have timestamp set (passed the stage).
- Conversions are based on timestamp fields (not just current stage).
- Avg response uses `applied_at` to `hr_response_at`.
