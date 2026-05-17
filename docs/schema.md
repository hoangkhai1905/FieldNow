# FieldNow Backend and Infrastructure Schema

This document reflects the current backend schema and operational contracts used by
FieldNow. The source of truth for database structure is
`BE/prisma/schema.prisma`; migrations live in `BE/prisma/migrations`.

## 1) Data Schema (PostgreSQL via Prisma)

### User

- `id`: UUID, primary key
- `email`: text, unique, required
- `password`: text, required
- `full_name`: text, nullable
- `phone_number`: text, nullable
- `avatar_url`: text, nullable
- `role`: enum `USER | OWNER | ADMIN`, default `USER`
- `is_active`: boolean, default `true`
- `deactivated_at`: timestamptz, nullable
- `is_email_verified`: boolean, default `false`
- `otp_code`: text, nullable
- `otp_expires_at`: timestamp, nullable
- `otp_attempts`: integer, default `0`
- `otp_last_sent_at`: timestamptz, nullable
- `otp_resend_available_at`: timestamptz, nullable
- `created_at`: timestamptz, default `now()`

Relations:

- One user can own many `Field` records.
- One user can create many `Booking` records.
- One user can have many `RefreshToken` records.

Indexes and constraints:

- `UNIQUE(email)`
- `INDEX(otp_code)`

### Field

- `id`: UUID, primary key
- `owner_id`: UUID, foreign key to `User.id`
- `name`: text, required
- `location`: text, required
- `description`: text, nullable
- `images`: text array
- `price_per_hour`: decimal, required
- `search_vector`: PostgreSQL `tsvector`, nullable
- `type`: enum `FUTSAL | BADMINTON | BASKETBALL | VOLLEYBALL | TENNIS`, default `FUTSAL`
- `open_time`: time, default `06:00:00`
- `close_time`: time, default `22:00:00`
- `is_active`: boolean, default `false`
- `created_at`: timestamptz, default `now()`
- `updated_at`: timestamp, auto-updated

Relations:

- Belongs to one owner user.
- Has many `FieldSlot` records.
- Has many `Booking` records.

Indexes and constraints:

- `INDEX(owner_id)`
- `INDEX(location, is_active)`
- `GIN INDEX(search_vector)` mapped as `idx_field_search_vector`

### FieldSlot

- `id`: UUID, primary key
- `field_id`: UUID, foreign key to `Field.id`
- `start_time`: time, required
- `end_time`: time, required
- `date`: date, required
- `price_override`: decimal, nullable
- `is_locked`: boolean, default `false`
- `created_at`: timestamptz, default `now()`

Relations:

- Belongs to one `Field`.
- Can be referenced by many `Booking` records.

Indexes and constraints:

- `UNIQUE(field_id, date, start_time, end_time)`
- `INDEX(field_id, date)`

Notes:

- The current booking flow can book by `field_id + date + start_time + end_time`.
  `slot_id` is optional to support both exact pre-created slots and flexible time
  intervals.
- Owner scheduling stores every manually created slot, quick daily generated slot,
  and recurring generated slot as `FieldSlot` rows. Recurring generation is
  orchestrated by the frontend through the existing batch slot API.
- `is_locked = true` means the owner temporarily blocks that exact slot from new
  bookings without deleting the schedule row.

### Booking

- `id`: UUID, primary key
- `user_id`: UUID, foreign key to `User.id`
- `field_id`: UUID, foreign key to `Field.id`
- `slot_id`: UUID, nullable foreign key to `FieldSlot.id`
- `date`: date, required
- `start_time`: time, required
- `end_time`: time, required
- `status`: enum `PENDING | CONFIRMED | CANCELLED`, default `PENDING`
- `total_price`: decimal, default `0`
- `created_at`: timestamptz, default `now()`
- `updated_at`: timestamp, auto-updated
- `expires_at`: timestamptz, required

Relations:

- Belongs to one `User`.
- Belongs to one `Field`.
- Optionally belongs to one `FieldSlot`.
- Has many `Payment` attempts.

Indexes and constraints:

- `INDEX(user_id, created_at)`
- `INDEX(slot_id, status)`
- `INDEX(field_id, date)`
- PostgreSQL exclusion constraint `Booking_no_active_overlap`:
  active bookings for the same `field_id` and `date` cannot have overlapping
  `[start_time, end_time)` ranges when `status IN ('PENDING', 'CONFIRMED')`.

Business invariant:

- `PENDING` and `CONFIRMED` bookings block the time interval.
- `CANCELLED` bookings do not block the time interval.
- The exclusion constraint is the final source of truth against double booking.

### Payment

- `id`: UUID, primary key
- `booking_id`: UUID, foreign key to `Booking.id`
- `amount`: decimal, required
- `provider`: text, required
- `status`: enum `PENDING | COMPLETED | FAILED`, default `PENDING`
- `created_at`: timestamptz, default `now()`
- `updated_at`: timestamp, auto-updated

Relations:

- Belongs to one `Booking`.

Indexes and constraints:

- `INDEX(booking_id)`

Notes:

- A booking can have multiple payment attempts.
- `GET /api/v1/payments/:bookingId` returns the latest payment attempt.
- Failed online payments can be retried by creating a new pending payment row.

### RefreshToken

- `id`: UUID, primary key
- `user_id`: UUID, foreign key to `User.id`
- `token_hash`: text, unique, required
- `expires_at`: timestamptz, required
- `revoked_at`: timestamptz, nullable
- `last_used_at`: timestamptz, nullable
- `created_at`: timestamptz, default `now()`

Indexes and constraints:

- `UNIQUE(token_hash)`
- `INDEX(user_id, expires_at)`

## 2) Domain State Machines

### Booking status

Allowed states:

- `PENDING`
- `CONFIRMED`
- `CANCELLED`

Main transitions:

- Create booking: starts as `PENDING`.
- Online payment success: `PENDING -> CONFIRMED`.
- Online payment timeout: `PENDING -> CANCELLED`.
- User cancellation: `PENDING -> CANCELLED`.
- Cash payment selection: `PENDING -> CONFIRMED`; payment is collected at the venue.

Terminal states:

- `CONFIRMED`
- `CANCELLED`

### Payment status

Allowed states:

- `PENDING`
- `COMPLETED`
- `FAILED`

Main transitions:

- Payment attempt creation: starts as `PENDING`.
- Payment callback success: `PENDING -> COMPLETED`.
- Payment callback failure: `PENDING -> FAILED`.
- Retry after failed online payment: create a new `PENDING` payment row.

Idempotency rule:

- Duplicate terminal callbacks are acknowledged without overwriting already
  processed payment state.

## 3) Redis Key Schema

### Booking contention lock

- Key: `lock:field:{fieldId}:date:{date}`
- Value: random lock token
- Write: `SET key token NX PX 10000`
- Release: Lua compare-token-then-delete script

Purpose:

- Reduce concurrent booking writes for the same field/date.
- This is not the final correctness guard; the database exclusion constraint is.

### Cache keys

- Search key prefix: `fields:search`
- Field detail key: `fields:detail:{fieldId}:date:{date|all}`

Behavior:

- Public field search and field detail responses can be cached.
- Wildcard invalidation uses Redis `SCAN` batching rather than `KEYS`.

### Rate limit keys

Managed by `express-rate-limit` for:

- Public search throttling.
- OTP email requests.
- Password reset/change requests.

## 4) Queue and Job Schema (BullMQ + Redis)

Default queue settings:

- `attempts: 3`
- exponential backoff starting at `1000ms`
- `removeOnComplete: true`
- `removeOnFail: false`

### Queue: `booking-expiration`

Job:

- Name: `booking.expire`
- Delay: 15 minutes from booking creation
- `jobId`: `booking-expire:{bookingId}`
- Payload:
  - `bookingId`
  - `slotId`
  - `expectedStatus: PENDING`

Worker behavior:

- Load booking by id.
- If status is still `PENDING` and `expires_at <= now`, set booking to
  `CANCELLED`.
- If booking is `CONFIRMED` or `CANCELLED`, no-op.
- Cash-confirmed bookings are already `CONFIRMED`, so expiration no-ops.

### Queue: `notification-email`

Jobs:

- `email.booking_created`
- `email.booking_confirmed`
- `email.booking_cancelled`

Job ids:

- `email-booking-created:{bookingId}`
- `email-booking-confirmed:{bookingId}`
- `email-booking-cancelled:{bookingId}`

Payload:

- `userId`
- `bookingId`
- optional `reason`

### Queue: `booking-events`

The queue is defined for future post-booking tasks. Current booking side effects
are emitted through the in-process booking event emitter and then scheduled into
BullMQ queues.

### Cron fallback

`cleanup.cron.js` runs stale pending booking cleanup periodically. It is a
fallback for missed delayed jobs.

## 5) API Contract Skeleton

All API routes use the `/api/v1` prefix.

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### OTP

- `POST /api/v1/otp/send`
- `POST /api/v1/otp/verify`
- `POST /api/v1/otp/resend`

### Password

- `POST /api/v1/password/forgot`
- `POST /api/v1/password/reset`
- `POST /api/v1/password/change-request`
- `POST /api/v1/password/change`

### Public fields

- `GET /api/v1/fields`
- `GET /api/v1/field-types`
- `GET /api/v1/fields/:id`

### Owner fields and slots

- `POST /api/v1/owner/fields`
- `GET /api/v1/owner/fields`
- `PATCH /api/v1/owner/fields/:id`
- `GET /api/v1/owner/fields/:fieldId/slots`
- `POST /api/v1/owner/fields/:fieldId/slots/batch`
- `PATCH /api/v1/owner/slots/:slotId`
- `DELETE /api/v1/owner/slots/:slotId`
- `GET /api/v1/owner/bookings`
- `GET /api/v1/owner/stats`

Owner scheduling behavior:

- Manual slot creation sends one slot through the batch endpoint.
- Quick daily setup generates contiguous slots for one date.
- Recurring setup generates slots across a date range and selected weekdays, then
  sends them in batches of at most 50 slots.
- Backend validates ownership, time range, overlap, and active booking guards
  before modifying slots.
- Deleting a slot is rejected when it has an active `PENDING` or `CONFIRMED`
  booking.
- Locked slots remain visible to the owner but are unavailable for new bookings.

### Booking

- `POST /api/v1/bookings`
- `GET /api/v1/bookings/me`
- `GET /api/v1/bookings/:id`
- `DELETE /api/v1/bookings/:id`

### Payment

- `POST /api/v1/payments/sepay-ipn`
- `POST /api/v1/payments/initiate`
- `GET /api/v1/payments/:bookingId`

### Upload

- `POST /api/v1/upload/images`
- `DELETE /api/v1/upload/images`

### Admin

- `GET /api/v1/admin/fields`
- `PATCH /api/v1/admin/fields/:id/approve`
- `PATCH /api/v1/admin/fields/:id/reject`
- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:id/role`

## 6) Error Code Schema

### Response envelope

Success response:

```json
{
  "success": true,
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

Implementation:

- `BE/src/utils/errors.js`
- `BE/src/middlewares/error.middleware.js`

Common codes:

- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `INTERNAL_ERROR` (500)

Domain-specific helpers:

- booking expired / booking ownership errors
- payment already completed / already failed
- payment provider errors

## 7) Observability and Readiness

Logging:

- `pino`
- `pino-http`
- request id generation via `x-request-id` or `crypto.randomUUID()`

Health endpoints:

- `/health`: process liveness
- `/ready`: database and Redis readiness

## 8) Migration and Versioning Notes

- Schema changes should be Prisma migration-first.
- Run `npx prisma validate` before deploy.
- Run `npx prisma migrate deploy` in deployment environments.
- Run `npx prisma generate` after schema changes.
- Important current migrations include:
  - initial schema
  - OTP/profile/field type/slot time additions
  - field search vector/index additions
  - booking interval additions
  - booking overlap exclusion constraint
