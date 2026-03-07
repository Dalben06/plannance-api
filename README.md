# Plannance API

Backend API for `plannance-front`, focused on calendar-based cash flow events. The project follows a Clean Architecture layout with explicit domain, application services, repositories, and presentation handlers.

The HTTP app uses a small IoC/composition root (`src/container.ts`) so service wiring is explicit and easy to extend.

## Requirements

- Node `v22.18.0`
- PostgreSQL 16

## Project Structure

- `src/domain/` — core domain types and Zod validation schemas
- `src/application/` — service layer and repository/provider port interfaces
- `src/infrastructure/` — Prisma repositories, Google OAuth provider, HMAC auth implementations
- `src/presentation/` — Express handlers, routes, and middleware
- `src/db/` — Prisma client singleton
- `src/config/` — environment variable parsing (Zod-validated)
- `src/utils/` — shared utilities (date helpers)
- `src/container.ts` — application dependency wiring

## Environment

Copy `.env.example` and adjust as needed.

```
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL="postgres://user:pass@host-pooler:6543/db?pgbouncer=true"
DIRECT_URL="postgres://user:pass@host:5432/db"
GOOGLE_CLIENT_ID=
AUTH_JWT_SECRET=replace-with-a-long-random-secret
AUTH_TOKEN_TTL_SECONDS=3600
```

- `DATABASE_URL` — connection string used at runtime (may point to a pooler such as PgBouncer)
- `DIRECT_URL` — direct connection string used by Prisma CLI for migrations/schema pushes
- `GOOGLE_CLIENT_ID` — must be a Google OAuth client ID from Google Identity Services (a plain API key is not sufficient)

## Database

Schema is managed with Prisma. After setting up environment variables:

```bash
# Apply schema to DB (dev — no migration history)
npx prisma db push

# Regenerate Prisma client after schema changes
npx prisma generate
```

Schema file: `prisma/schema.prisma`. Two models: `User`, `CalendarEvent`.

## Local Development

```bash
# Start PostgreSQL (Docker)
docker compose up -d

npm install
npm run dev
```

API runs on `http://localhost:3000`.

## API Endpoints

Base path: `/api/v1`

### Auth

- `POST /auth/login`
  - Unified login endpoint — accepts a discriminated union body:
    ```json
    { "type": "google", "tokenId": "google-id-token" }
    ```
    ```json
    { "type": "email_password", "username": "user@example.com", "password": "secret" }
    ```
  - Returns an application bearer token. On first Google login the user is auto-created.

- `GET /auth/me`
  - Requires `Authorization: Bearer <token>`
  - Returns the authenticated user profile.

### Users

- `POST /users`
  - Registers a new user with email and password.
  - Body: `{ "name": "...", "email": "...", "password": "..." }`

### Calendar Events

All endpoints below require `Authorization: Bearer <token>`.

- `GET /calendar-events?month=YYYY-MM&weekStartsOn=0|1`
  - Lists the authenticated user's calendar events. `month` is optional.

- `GET /calendar-events/:id`
  - Returns a single event by id.

- `POST /calendar-events`
  - Body:
    ```json
    {
      "title": "Payday",
      "start": "2026-01-05T00:00:00.000Z",
      "end": null,
      "amount": 1500,
      "type": "credit",
      "color": "#4caf50"
    }
    ```
  - `userId` is taken from the authenticated user, not from the request body.
  - `color` is optional.

- `PUT /calendar-events/:id`
  - Body: any subset of the fields above (at least one field required).

- `DELETE /calendar-events/:id`

### Calendar Day

- `GET /calendar-day?month=YYYY-MM&weekStartsOn=0|1`
  - Requires `Authorization: Bearer <token>`
  - Returns a 42-slot month grid (6 weeks) with events and income/expense totals per day.
  - `month` is required (`YYYY-MM` format). `weekStartsOn`: `0` = Sunday (default), `1` = Monday.

## Tests

```bash
npm test
```

~124 tests across 14 files. No database required — tests mock at the service layer.

## Docker

This API can run alongside `plannance-front` using the shared Docker network `plannance-net`.

1. Ensure the `plannance-net` network exists. Running the frontend compose creates it, or create it manually:

```bash
docker network create plannance-net
```

2. Start the backend + PostgreSQL:

```bash
docker compose up --build
```

The API container joins `plannance-net` so the frontend can reach it at `http://plannance-api:3000` from inside Docker.
