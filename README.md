# Plannance API

Backend API for `plannance-front`, focused on calendar-based cash flow events. The project follows a Clean Architecture layout with explicit domain, application services, repositories, and presentation handlers.

## Requirements

- Node `v22.18.0`
- MySQL 8

## Project Structure

- `src/domain`: core domain types and validation schemas
- `src/application`: service layer and repository ports
- `src/infrastructure`: MySQL repository implementations
- `src/presentation`: HTTP handlers, routes, and middleware
- `src/db`: database connection and schema

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
```

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

- `GET /calendar-events?userId=...&month=YYYY-MM`
  - Lists calendar events. `userId` and `month` are optional filters.

- `GET /calendar-events/:id`
  - Returns a single event by id.

- `POST /calendar-events`
  - Body:
    ```json
    {
      "userId": "user-123",
      "title": "Payday",
      "start": "2026-01-05T00:00:00.000Z",
      "end": null,
      "amount": 1500,
      "type": "credit",
    }
    ```

- `PUT /calendar-events/:id`
  - Body: any subset of fields above (at least one field required).

- `DELETE /calendar-events/:id`

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
