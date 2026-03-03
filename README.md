# Plannance API

Backend API for `plannance-front`, focused on calendar-based cash flow events. The project follows a Clean Architecture layout with explicit domain, application services, repositories, and presentation handlers.

The HTTP app now uses a small IoC/composition root (`src/container.ts`) so service wiring is explicit and easier to extend.

## Requirements

- Node `v22.18.0`
- MySQL 8

## Project Structure

- `src/domain`: core domain types and validation schemas
- `src/application`: service layer and repository ports
- `src/infrastructure`: MySQL repository implementations
- `src/presentation`: HTTP handlers, routes, and middleware
- `src/db`: database connection and schema
- `src/container.ts`: application dependency wiring

## Environment

Copy `.env.example` and adjust as needed.

```
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
DB_HOST=localhost
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_CONNECTION_LIMIT=10
GOOGLE_CLIENT_ID=
AUTH_JWT_SECRET=replace-with-a-long-random-secret
AUTH_TOKEN_TTL_SECONDS=3600
```

`GOOGLE_CLIENT_ID` must be your Google OAuth client ID from Google Identity Services. A standard Google API key is not enough to securely verify a sign-in token on the backend.

## Database

Schema is in `src/db/schema.sql`. Apply it to your MySQL database before running the API.

## Local Development

```
npm install
npm run dev
```

API runs on `http://localhost:3000`.

## API Endpoints

Base path: `/api/v1`

- `GET /health`
  - Returns service status.

- `POST /auth/google`
  - Body:
    ```json
    {
      "idToken": "google-id-token"
    }
    ```
  - Verifies a Google ID token and returns an application bearer token.

- `GET /auth/me`
  - Requires `Authorization: Bearer <token>`.
  - Returns the authenticated user profile derived from the access token.

- `GET /calendar-events?month=YYYY-MM&weekStartsOn=0|1`
  - Requires `Authorization: Bearer <token>`.
  - Lists the authenticated user's calendar events. `month` is optional.

- `GET /calendar-events/:id`
  - Requires `Authorization: Bearer <token>`.
  - Returns a single event by id.

- `POST /calendar-events`
  - Requires `Authorization: Bearer <token>`.
  - Body:
    ```json
    {
      "title": "Payday",
      "start": "2026-01-05T00:00:00.000Z",
      "end": null,
      "amount": 1500,
      "type": "credit"
    }
    ```
  - `userId` is taken from the authenticated Google user, not from the request body.

- `PUT /calendar-events/:id`
  - Requires `Authorization: Bearer <token>`.
  - Body: any subset of fields above (at least one field required).

- `DELETE /calendar-events/:id`
  - Requires `Authorization: Bearer <token>`.

- `GET /calendar-day?month=YYYY-MM&weekStartsOn=0|1`
  - Requires `Authorization: Bearer <token>`.
  - Returns the authenticated user's month grid summary.

## Tests

```
npm test
```

## Docker

This API can run alongside `plannance-front` using the shared Docker network `plannance-net`.

1. Ensure the `plannance-net` network exists. Running the frontend compose creates it, or you can create it manually:

```
docker network create plannance-net
```

2. Start the backend + MySQL:

```
docker compose up --build
```

The API container joins `plannance-net` so the frontend can reach it at `http://plannance-api:3000` from inside Docker.
