## Introduction

We need to implement User Settings, so all the preferences from the user will be stored.

## Requirements

All endpoints require authentication (Bearer token). The `userId` is filled internally from the auth token.

GET: /api/v1/users/settings
200: {
data: {
phoneNumber: string
isDarkMode: boolean
notifyByEmail: boolean
notifyByMessage: boolean
}
}
404: not found
500: server error

POST: /api/v1/users/settings
body: {
phoneNumber: string
isDarkMode: boolean
}
Note: notifyByEmail and notifyByMessage default to false on creation.
201: created { data: { phoneNumber, isDarkMode, notifyByEmail, notifyByMessage } }
400: validation error
409: settings already exist for this user (use PUT to update)
500: server error

PUT: /api/v1/users/settings
body: {
phoneNumber: string
isDarkMode: boolean
notifyByEmail: boolean
notifyByMessage: boolean
}
200: updated { data: { phoneNumber, isDarkMode, notifyByEmail, notifyByMessage } }
400: validation error
404: settings not found (use POST to create first)
500: server error

## Accepted Criteria

- Create a new `user_settings` table in Prisma (PostgreSQL)
- All boolean fields are required
- `notifyByEmail` and `notifyByMessage` default to `false` when created via POST
- POST returns 409 if settings already exist for the user
- PUT returns 404 if settings do not exist for the user
- Field name corrections: `notifyByEmail` / `notifyByMessage` (spec had typos: `notifityByEmail` / `notifityByMessage`)

## Tests

- Presentation (route) tests: GET 200/404, POST 201/400/409, PUT 200/400/404, auth guard 401
- Service unit tests: getByUserId, create, update
- Repository unit tests: findByUserId (found/null), create, update, P2025 → null

## Rules

After execute the plan action, need to run lint, and test. when passed everything, the implementation will be done.
when its done run /init update claude.md, postman.collection, memory
