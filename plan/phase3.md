# Phase 3: Booking Concurrency Engine

## Objective
Implement race-condition-safe booking flow with Redis locking, BullMQ delayed jobs for expiration, and observable background workers.

## Infrastructure Work Breakdown

### A. Redis Foundation
1. Implement src/infrastructure/redis.js:
   - connection setup with retry/backoff policy
   - graceful shutdown handler
   - Redis serves dual purpose: BullMQ queue backend + distributed locking (SET NX PX).
2. Define key patterns:
   - lock:slot:{slotId}
   - idempotency:booking:{requestId}
3. Add redis health check integration.

### B. Queue Foundation (BullMQ)
1. Implement src/infrastructure/queue.js with named queues:
   - booking-events
   - booking-expiration
   - notification-email
2. Configure queue options:
   - attempts: 3
   - exponential backoff
   - removeOnComplete/removeOnFail policies
3. Use BullMQ native delayed jobs for booking expiration (15 min delay).
4. Add queue dashboard/log strategy (at minimum, jobId logging).

### C. Workers and Scheduler
1. Implement email.worker.js:
   - Consume booking-created events from booking-events queue.
   - Email provider: nodemailer with Ethereal (dev) or Resend/SendGrid (production).
   - Config via `EMAIL_PROVIDER` env var.
   - Dev mode: log email content to console + Ethereal preview URL.
2. Implement expiration.worker.js:
   - Processes delayed booking expiration jobs from booking-expiration queue.
   - Checks booking status before cancel update.
   - Idempotent cancellation (skip if already CONFIRMED/CANCELLED).
3. Implement cleanup cron fallback:
   - Run every minute.
   - Cancel stale pending bookings missed by BullMQ (safety net).
4. All workers use pino logger with jobId/queueName context for structured observability.

## Backend Work Breakdown

### D. Booking Domain and Transactions
1. Implement booking.repository.js methods:
   - findActiveBookingBySlot
   - createPendingBookingTx
   - cancelBookingTx
   - confirmBookingTx
   - getBookingById
   - listBookingsByUser
2. Implement booking.service.js createBooking flow:
   - validate slot and user
   - acquire distributed lock (Redis SET NX PX)
   - check slot availability
   - create pending booking in DB transaction
   - enqueue delayed expiration job (15 min) to booking-expiration queue
   - enqueue booking-created event to booking-events queue
   - release lock safely with token check

### E. Booking APIs
1. POST /api/v1/bookings
2. GET /api/v1/bookings/me
3. GET /api/v1/bookings/:id
4. DELETE /api/v1/bookings/:id (policy-based cancel)

### F. Error Handling and Status Contracts
1. Booking error codes:
   - SLOT_LOCKED
   - SLOT_TAKEN
   - BOOKING_EXPIRED
   - BOOKING_NOT_FOUND
2. Response includes booking status and expires_at.

### G. Concurrency and Reliability Testing
1. Parallel request test for same slot (>= 10 concurrent requests).
2. Verify exactly one pending booking created.
3. Verify delayed expiration changes status correctly.
4. Verify idempotent processing when worker retries.

## Deliverables
1. Complete create booking flow with Redis lock + DB transaction + BullMQ enqueue.
2. Working workers for expiration (delayed jobs) and email notifications.
3. Booking APIs with stable status/error contracts.
4. Concurrency test evidence.

## Done Criteria
1. Double booking does not happen under concurrent requests.
2. Expired pending bookings are auto-cancelled reliably via BullMQ delayed jobs.
3. Worker retry does not create duplicate side effects (idempotent processing).
4. Redis and queue health are observable via /ready endpoint.

## FE Scope (Minimal)
1. Slot selection and booking action integrated with booking API.
2. User history page reads bookings by status.

## Effort Estimates (Phase 3)
| Task | Size | Est. Hours |
|------|------|------------|
| Redis connection + retry/health check | M | 1-2h |
| BullMQ queue setup (3 queues + delayed jobs) | M | 1-2h |
| booking.repository.js (transactional methods) | L | 3-4h |
| booking.service.js (lock + transaction + enqueue) | L | 4-6h |
| Expiration worker (delayed + idempotent) | M | 2-3h |
| Email worker + provider integration | M | 2-3h |
| Cleanup cron fallback | S | 0.5-1h |
| Booking API routes + controller | M | 2-3h |
| Redis health check in /ready | S | 0.5h |
| Concurrency tests (parallel requests) | L | 3-4h |
| Worker idempotency tests | M | 1-2h |
| **Total** | | **~20-30h** |
