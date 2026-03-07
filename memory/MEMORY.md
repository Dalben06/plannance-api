# Plannance API - Memory

## Project Overview
Clean Architecture (Ports & Adapters) Express API in TypeScript strict mode.
Node 22.18.0, ESM modules (NodeNext resolution, use `.js` extensions in imports).

## Database: Prisma 6 + PostgreSQL
- Prisma 6.x (NOT 7 — v7 removed `url` from datasource, breaking the schema format)
- Schema: `prisma/schema.prisma`
- Client singleton: `src/db/prisma.ts` → `getPrismaClient()`
- Repositories: `src/infrastructure/repositories/prismaCalendarEventRepository.ts`, `prismaUserRepository.ts`
- Run `npx prisma generate` after schema changes
- Dev sync: `npx prisma db push` (no migration history yet — DB was bootstrapped with db push)
- Do NOT use `prisma migrate dev` until a baseline migration is established first

## Key File Locations
- DI container: `src/container.ts`
- Env config (Zod): `src/config/env.ts`
- Domain types: `src/domain/` (user.ts, auth.ts)
- Port interfaces: `src/application/ports/`
- Services: `src/application/services/`
- Infrastructure: `src/infrastructure/`

## Domain Types — User
- `UserCreate` — internal repo DTO, password pre-hashed, `id` optional (generated if absent)
- `UserRegistration` — service input, plaintext password hashed by service
- `UserView` — public output, `id` maps to DB `uuid` column (BigInt `id` column never exposed)

## Authentication
- Unified endpoint: `POST /api/v1/auth/login` with discriminated union body
  - `{ type: "google", tokenId }` or `{ type: "email_password", username, password }`
- `AuthService.authenticate(form: AuthForm)` — handles both providers
- `AuthService.verifyAccessToken(token)` — validates HMAC JWT, returns `AuthenticatedUser`
- Google OAuth: first login auto-creates user in DB
- Tokens: hand-rolled HMAC-SHA256 JWT via `HmacSessionTokenService`

## Password Hashing
- Port: `PasswordHasher` (`src/application/ports/passwordHasher.ts`)
- Implementation: `HmacPasswordHasher` (`src/infrastructure/auth/hmacPasswordHasher.ts`)
- Uses HMAC-SHA256 keyed with `AUTH_JWT_SECRET`
- `verify(plain, hashed)` uses `timingSafeEqual` — never plain string comparison
- Wired in container alongside `HmacSessionTokenService` (separate concerns)

## Test Pattern
- Tests mock at the application service layer (not HTTP or DB)
- No DB needed for any test
- 51 tests across 8 files — all pass with `npm run test`
- Route tests use `buildAppDependencies()` from `tests/testUtils.ts`
- Unit tests for: `authService`, `userService`, `HmacSessionTokenService`, `HmacPasswordHasher`

## Patterns
- `BigInt` IDs in Prisma → `.toString()` for domain
- `Decimal` amounts → `Number(row.amount)`
- P2025 Prisma error = record not found (update/delete return null/false)
- `toIsoString()` util in `src/utils/date.ts` for date serialization
- Repository methods that "might not find" return `T | null` — never throw for not-found
- Never use plain string `!==` for comparing hashes — always `timingSafeEqual`
- No `console.log` in production code paths (security: no PII in logs)
