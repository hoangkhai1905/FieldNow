# FieldNow

FieldNow is a sports field booking web application built as a course project for
system architecture and software design. The project uses a React frontend, a
Node.js/Express backend, PostgreSQL/Supabase, Redis, and BullMQ.

## Architecture

The backend follows a layered architecture:

```text
HTTP request
  -> routes
  -> middlewares
  -> controllers
  -> services / business pipeline
  -> repositories
  -> Prisma
  -> PostgreSQL
```

Main backend folders:

- `BE/src/routes`: API route definitions.
- `BE/src/controllers`: request/response handling.
- `BE/src/services`: business logic and orchestration.
- `BE/src/repositories`: database access through Prisma.
- `BE/src/validators`: Zod request validation schemas.
- `BE/src/middlewares`: auth, role checks, validation, rate limit, error handling.
- `BE/src/infrastructure`: Prisma, Redis, Queue, Supabase clients.
- `BE/src/workers` and `BE/src/listeners`: BullMQ jobs and domain event handlers.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the booking flow,
database design notes, and deployment checklist.

## Core Booking Flow

1. User searches active fields and opens field detail.
2. Frontend submits `{ fieldId, date, startTime, endTime }`.
3. Backend validates the payload and field operating hours.
4. Redis lock reduces concurrent writes for the same field/date.
5. Repository checks overlapping `PENDING` or `CONFIRMED` bookings.
6. PostgreSQL exclusion constraint is the final double-booking guard.
7. Booking is created as `PENDING` with an initial payment row.
8. BullMQ schedules a 15-minute expiration job for unpaid online bookings.
9. Online payment callback confirms the booking; cash selection confirms the
   booking immediately and payment is collected at the venue.

## Local Verification

Backend:

```bash
cd BE
npx prisma validate
npm test -- --runInBand
```

Frontend:

```bash
cd FE
npm run build
```

## Deployment Notes

- Use real environment variables in hosting, not committed secrets.
- Rotate any payment key that has ever appeared in shared documents or commit
  history.
- Set `CORS_ORIGIN` in production.
- Run Prisma migrations before starting the API.
- Redis must be available for booking locks and BullMQ workers.
