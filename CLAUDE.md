# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (hot reload)
npm run dev

# Build
npm run build

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npx vitest run tests/presentation/auth.test.ts

# Start production server
npm start

# Apply schema changes to DB (dev only — no migration history needed)
npx prisma db push

# Regenerate Prisma client after schema changes
npx prisma generate

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
```

Local dev with Docker (PostgreSQL 16):
```bash
docker compose up -d
```

Environment variables must be set (see `.env.example`).

## Architecture

Clean Architecture with Ports & Adapters pattern. Layers (outer to inner):

- **`src/presentation/`** — Express routes, handlers, middleware (`requireAuth`, `validateBody`/`validateQuery`, `errorHandler`)
- **`src/application/`** — Business logic services + port interfaces (repository/provider abstractions)
- **`src/domain/`** — TypeScript types and Zod schemas; no logic
- **`src/infrastructure/`** — Concrete implementations: Prisma repositories, Google OAuth provider, HMAC token service, HMAC password hasher
- **`src/container.ts`** — Dependency injection wiring; all services are created here and injected into route handlers

The DI container accepts `AppContainerOverrides` for test mocking. Tests mock at the application service layer (not the HTTP/DB layer), so no database is needed for any tests.

## Key Patterns

**Adding a new feature** typically means:
1. Define domain types in `src/domain/` (input DTO, view/output type)
2. Define the port interface in `src/application/ports/`
3. Implement the service in `src/application/services/`
4. Implement the Prisma repository in `src/infrastructure/repositories/`
5. Add handlers and routes in `src/presentation/`
6. Wire up in `src/container.ts`

**Domain types — user pattern:**
- `UserCreate` — internal DTO for repository create (password must be pre-hashed)
- `UserRegistration` — service-layer input (plaintext password, hashed by service)
- `UserView` — public output (no password, no DB `id`; `id` field maps to the `uuid` column)

**Authentication:**
- Bearer token in `Authorization` header
- `requireAuth` middleware calls `authService.verifyAccessToken` and attaches `req.authUser`
- Two providers via a unified `POST /api/v1/auth/login` endpoint with a discriminated union body:
  - `{ type: "google", tokenId: "..." }` — verifies via Google `/tokeninfo`
  - `{ type: "email_password", username: "...", password: "..." }` — verifies against DB with HMAC hash
- On first Google login the user is auto-created in the DB
- Tokens are HMAC-SHA256 JWTs (hand-rolled, not a library)

**Password hashing:**
- Port: `PasswordHasher` (`src/application/ports/passwordHasher.ts`)
- Implementation: `HmacPasswordHasher` — HMAC-SHA256 keyed with `AUTH_JWT_SECRET`
- `verify(plain, hashed)` uses `timingSafeEqual` to prevent timing attacks
- Never stored or compared as plain strings

**Database:** PostgreSQL via Prisma 6. Schema: `prisma/schema.prisma`. Two models: `User`, `CalendarEvent`.
- `db push` for dev (no migration history); use `prisma migrate dev` once a baseline is established
- `getPrismaClient()` in `src/db/prisma.ts` returns a singleton
- BigInt IDs → `.toString()` for domain; Decimal amounts → `Number(row.amount)`
- P2025 Prisma error = record not found (update/delete return `null`/`false`)
- Repository methods that can return nothing use `| null` return type — never throw for not-found
- `DATABASE_URL` may point to a connection pooler (e.g. PgBouncer); `DIRECT_URL` is the direct connection used by Prisma for migrations

**Validation:** Zod schemas in `src/domain/validators/` applied via `validateBody(schema)` or `validateQuery(schema)` middleware — replaces `req.body`/`req.query` with the parsed, type-safe value.

**Error handling:** Throw `HttpError` for HTTP-level errors. `AuthenticationError` maps to 401. Zod validation errors map to 400. Unhandled throws map to 500.

**Tooling:**
- ESLint v10 + typescript-eslint + eslint-plugin-import (flat config: `eslint.config.js`)
- Prettier (`.prettierrc`): semi, double quotes, trailingComma es5, printWidth 100
- Husky: pre-commit runs `lint` + `audit:check`; pre-push runs `test`
- `npm install` requires `--legacy-peer-deps` due to eslint-plugin-import peer dep conflict with ESLint v10

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/health` | — | Health check |
| POST | `/api/v1/auth/login` | — | Authenticate (Google or email/password) |
| GET | `/api/v1/auth/me` | ✓ | Get current user |
| POST | `/api/v1/users` | — | Register a new user (email/password) |
| GET | `/api/v1/calendar-events` | ✓ | List events (query: `month`, `weekStartsOn`) |
| GET | `/api/v1/calendar-events/:id` | ✓ | Get single event |
| POST | `/api/v1/calendar-events` | ✓ | Create event |
| PUT | `/api/v1/calendar-events/:id` | ✓ | Update event |
| DELETE | `/api/v1/calendar-events/:id` | ✓ | Delete event |
| GET | `/api/v1/calendar-day` | ✓ | Month grid summary (query: `month` required, `weekStartsOn`) |

## Test Structure

~124 tests across 14 files. All pass with `npm run test`. No database required.

Tests are organized by architectural layer under `tests/`:

| File | Type | What it covers |
|------|------|----------------|
| `tests/presentation/health.test.ts` | Route | Health endpoint |
| `tests/presentation/auth.test.ts` | Route | Login (both providers), schema validation, `/me` |
| `tests/presentation/user.test.ts` | Route | User creation, validation rules |
| `tests/presentation/calendarEvents.test.ts` | Route | Full CRUD, auth guard |
| `tests/presentation/calendarDay.test.ts` | Route | Month grid endpoint, auth guard |
| `tests/application/services/authService.test.ts` | Unit | Google flow, email/password flow, token verification |
| `tests/application/services/userService.test.ts` | Unit | Password hashing, immutability, return value |
| `tests/application/services/calendarDayService.test.ts` | Unit | Month grid generation, event aggregation |
| `tests/infrastructure/auth/hmacSessionTokenService.test.ts` | Unit | Token create/verify, expiry, tampering |
| `tests/infrastructure/auth/hmacPasswordHasher.test.ts` | Unit | Hash consistency, verify correctness, wrong secret |
| `tests/infrastructure/auth/googleTokenInfoIdentityProvider.test.ts` | Unit | Google token verification |
| `tests/infrastructure/repositories/prismaCalendarEventRepository.test.ts` | Unit | Repository CRUD with mocked Prisma |
| `tests/prismaUserRepository.test.ts` | Unit | User repository with mocked Prisma |
| `tests/utils/dateUtils.test.ts` | Unit | Date utilities |

## Environment

- Node 22.18.0 required
- TypeScript strict mode + `noUncheckedIndexedAccess` — array/map access returns `T | undefined`
- Module resolution: NodeNext (use `.js` extensions in imports even for `.ts` source files)
- API base path: `/api/v1`
