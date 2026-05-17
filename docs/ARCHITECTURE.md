# FieldNow Architecture Notes

## System Context

FieldNow is a modular monolith for sports field booking. The application is
split into a React frontend and an Express backend. PostgreSQL stores the main
business data, Supabase Storage stores field images, Redis supports short-lived
booking locks and cache entries, and BullMQ runs background jobs.

## Layered Backend

| Layer | Responsibility | Main files |
| --- | --- | --- |
| Route | Map HTTP paths to handlers and validation | `BE/src/routes` |
| Middleware | Cross-cutting concerns: auth, roles, errors, rate limits | `BE/src/middlewares` |
| Controller | Read request data, call services, return response envelope | `BE/src/controllers` |
| Service | Business rules and flow orchestration | `BE/src/services` |
| Pipeline | Step-by-step booking creation workflow | `BE/src/pipelines/booking` |
| Repository | Prisma data access | `BE/src/repositories` |
| Infrastructure | External clients and process wiring | `BE/src/infrastructure`, `BE/src/server.js` |
| Worker | Delayed jobs and async side effects | `BE/src/workers`, `BE/src/listeners` |

## Booking Flow

```text
POST /api/v1/bookings
  -> auth middleware
  -> Zod booking validation
  -> booking controller
  -> booking service
  -> ValidateSlotStep
  -> AcquireLockStep
  -> CheckAvailabilityStep
  -> CreateBookingStep
  -> EmitEventStep
  -> BullMQ expiration + email jobs
```

The most important invariant is that one field cannot have overlapping active
bookings. FieldNow enforces this in two layers:

- Redis lock: reduces concurrent booking writes for the same field/date.
- PostgreSQL exclusion constraint: final source of truth for overlap prevention.

Active statuses for overlap checks are `PENDING` and `CONFIRMED`. `CANCELLED`
bookings no longer block a time interval.

## Payment and Expiration

Online payment keeps the booking in `PENDING` until a successful payment
callback confirms it. BullMQ schedules a delayed job to cancel unpaid pending
bookings after 15 minutes. A cron fallback sweeps stale pending bookings that
may have been missed by the delayed job.

Cash payment confirms the booking immediately and records that collection will
happen at the venue. This keeps the demo flow simple and avoids an indefinite
pending hold without an owner approval workflow.

## Database Design

Core tables:

- `User`: account, role, verification, refresh token relation.
- `Field`: owner-managed sports field, type, location, price, operating hours.
- `FieldSlot`: optional owner-created slot definitions.
- `Booking`: user booking interval and status.
- `Payment`: payment attempts per booking.

Important constraints and indexes:

- Unique field slot by `field_id`, `date`, `start_time`, `end_time`.
- Booking indexes for user history and field/date lookup.
- PostgreSQL GIST exclusion constraint preventing active booking overlap.
- GIN search index for field full-text search.

## Deployment Checklist

- `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `REDIS_URL`, `CORS_ORIGIN`.
- Supabase storage variables for image upload.
- Payment provider credentials through environment variables only.
- Run `npx prisma migrate deploy`.
- Verify `/health` and `/ready`.
- Run backend tests and frontend build before the demo.
