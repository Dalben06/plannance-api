## Introduction

Users can configure recurring forecasts (fixed expenses or income) to plan their monthly budget. Forecast events live in their own table, scoped to the authenticated user, and are independent from `calendar_events`.

## Requirements

Base path: `/api/v1/forecast`. All endpoints require authentication. Users can only access their own data.

### POST /api/v1/forecast
Body:
```
{
  "name": "string (1-255)",
  "day": 1-31,
  "amount": number > 0,
  "type": "credit" | "debit",
  "startDate": "YYYY-MM-DD" | ISO date,
  "endDate": "YYYY-MM-DD" | ISO date | null   // optional
}
```
- `201 Created` — returns `{ data: ForecastEvent }`
- `400 Bad Request` — validation errors
- `401 Unauthorized` — missing/invalid token
- `500 Internal Server Error`

### PUT /api/v1/forecast/:id
Path: `:id` is the forecast UUID. Body: any subset of the create body fields.
- `200 OK` — `{ data: ForecastEvent }`
- `400 Bad Request`
- `404 Not Found` — forecast does not exist or belongs to a different user
- `500`

### DELETE /api/v1/forecast/:id
- `204 No Content`
- `404 Not Found`
- `500`

### GET /api/v1/forecast/:id
- `200 OK` — `{ data: ForecastEvent }`
- `404 Not Found`
- `500`

### GET /api/v1/forecast
- `200 OK` — `{ data: ForecastEvent[] }` (only the authenticated user's records)
- `500`

### ForecastEvent shape
```
{
  "id": "uuid",
  "userId": "string",
  "name": "string",
  "day": 1-31,
  "amount": number,
  "type": "credit" | "debit",
  "startDate": "ISO datetime",
  "endDate": "ISO datetime" | null,
  "createdAt": "ISO datetime",
  "updatedAt": "ISO datetime"
}
```

## Accepted Criteria

- `amount` must be > 0
- `day` must be between 1 and 31
- `name` must be 1-255 characters
- All fields required except `endDate`
- `startDate` cannot be in the future
- When `endDate` is provided, it must be strictly greater than `startDate`
- Persisted in the new `forecast_events` table with `userId`, `createdAt`, `updatedAt`
- Users can only access their own records (enforced at the repository layer by filtering on `userId`)
- Public identifier is a UUID (separate from the internal BigInt PK)

## Tests

- Unit tests for the service (creation generates uuid, scoping by user, null pass-through)
- Unit tests for the Prisma repository (mapping, user-scoped queries, missing-row handling)
- Route tests for 200, 201, 204, 400 (all validation rules), 401, 404, 500

## Rules

After executing the plan, run lint and tests. When everything passes, the implementation is done.
When done, run `/init` to update CLAUDE.md, the Postman collection, and memory.
