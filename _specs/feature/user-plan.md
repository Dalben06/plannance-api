## Introduction

We need to implement User Plan, so all the preferences from the user will be stored.

## Requirements

GET: /api/v1/users/plan

- Auth: required (Bearer token)
  200: {
  data: {
  budget: number,
  reminderImportRegister: boolean,
  notifyFixedEventOnDay: boolean,
  createdAt: string,
  updatedAt: string,
  }
  }
  404: not found (no plan exists for this user)
  500: server error

POST: /api/v1/users/plan

- Auth: required (Bearer token)
- userId filled internally from auth token
  body: {
  budget: number,
  reminderImportRegister: boolean,
  notifyFixedEventOnDay: boolean,
  }
  201: created (returns the created plan)
  400: validation error
  500: server error

PUT: /api/v1/users/plan

- Auth: required (Bearer token)
- userId filled internally from auth token
- Upsert behavior: updates the existing plan for the authenticated user, or creates a new plan if none exists
  body: {
  budget: number,
  reminderImportRegister: boolean,
  notifyFixedEventOnDay: boolean,
  }
  200: ok (returns the updated or newly created plan)
  400: validation error
  500: server error

## Accepted Criteria

- New Prisma model: `UserPlan` (table: `user_plans`)
- All booleans (reminderImportRegister, notifyFixedEventOnDay) are required
- budget must be >= 0 (zero is valid)
- budget stored as Decimal(12,2) in the database
- userId always comes from the authenticated user's token, never from the request body
- GET returns 404 if no plan exists for the user (does not auto-create)
- PUT is an upsert: finds record by id + userId; if not found creates a new plan for the user

## Decisions

- Field name: `budget` (corrected from original `budge` typo)
- PUT returns 200 (not 201)
- DB model/table: UserPlan / user_plans
- budget DB type: Decimal(12,2)

## Tests

- Unit tests for all endpoints: 200/201, 400, 404, 500
- Auth guard tests (401 when no token)
- Ownership validation on PUT upsert
- Service unit tests
- Repository unit tests with mocked Prisma

## Rules

After executing the plan, need to run lint and test. When everything passes, the implementation is done.
