# Football Field Booking System - Detailed Execution Plan

## Context
- Repo already has Phase 1 baseline implemented on backend (Express app, auth routes, JWT middleware, Prisma schema).
- Remaining phases need deeper backend and infrastructure planning for reliable delivery.
- Frontend scope is kept lightweight in this document because FE is handled by another team member.

## Current Backend Baseline (Verified)
- Express app bootstrapped with CORS, JSON middleware, health endpoint, auth routes.
- Prisma schema already defines core entities: users, fields, field_slots, bookings, payments.
- Auth implemented: register, login, me endpoint.
- JWT middleware and role middleware exist.
- Placeholders still empty: booking controller/service, payment service, repositories, Redis/BullMQ setup, workers.

### Resolved Blockers (from review 2026-04-24)
- [x] @prisma/client added to runtime dependencies.
- [x] Indexes and constraints from schema.md applied to schema.prisma.
- [x] Test framework installed: jest + supertest.
- [x] Standardized error response format defined and implemented.
- [x] JWT fallback secret removed; centralized config enforces required env vars.
- [x] Input validation added via Zod; ADMIN role blocked on self-registration.
- [x] App/server split for testability (app.js + server.js).
- [x] created_at/updated_at added to Field, FieldSlot models.
- [x] created_at added to Payment model.

### Open Items (Phase 1 — must close before Phase 2)
- [ ] Implement user.repository.js (findByEmail, create, findById) — currently placeholder.
- [ ] Refactor auth.service.js to use user.repository instead of direct Prisma calls.
- [ ] Create and run first Prisma migration (20260424_phase1_initial_schema).
- [ ] Create seed script (prisma/seed.js) for baseline users.
- [ ] Add updated_at to Booking and Payment models in schema.prisma.
- [ ] Configure CORS with environment-aware origin whitelist (currently hardcoded allow-all).
- [ ] Update .env.example with CORS_ORIGIN, JWT_EXPIRES_IN.
- [ ] Write unit tests for auth service and middleware.
- [ ] Document auth API contracts with request/response examples.

## Delivery Principles (All Phases)
- Keep strict layered architecture: route -> controller -> service -> repository -> infrastructure.
- Add validation and error contracts before expanding feature set.
- Every phase must close with API contract updates and test coverage for changed modules.
- Prefer idempotent APIs and explicit status transitions for booking/payment flows.

## Architecture Targets (Backend + Infrastructure)

### Backend Core
- Runtime: Node.js + Express.
- Data access: Prisma + PostgreSQL (Supabase-hosted or managed Postgres).
- Auth: JWT access token with role claims.
- Validation library: Zod (used for request payload validation in all phases).
- Queue and jobs: BullMQ + Redis (Redis serves dual purpose: queue backend and distributed locking).
- Logging: pino + pino-http (structured JSON logs with auto request logging).
- Security headers: helmet (XSS, clickjacking, MIME sniffing protection).
- Rate limiting: express-rate-limit (Redis-backed in production).
- File upload: multer (local parse) + Cloudinary or Supabase Storage (cloud storage).
- Email: nodemailer (Ethereal for dev, Resend or SendGrid for production).
- API docs: swagger-jsdoc + swagger-ui-express (served at /api-docs in dev).
- Test framework: Jest + Supertest.
- Delayed jobs: BullMQ native delayed jobs for booking expiration (15 min delay).
- Scheduled consistency cleanup: cron fallback for missed delayed jobs.

### Operational Baseline
- Environment profiles: local, staging, production.
- CORS policy: restrict origins per environment (allow-all only in local dev).
- App-level observability: pino structured request logs, job logs, error logs, health checks.
- HTTP compression: compression middleware for response payloads.
- Basic resilience: BullMQ retries with exponential backoff, dead-letter strategy, connection recovery.

### Error Response Contract (All Endpoints)
All API responses follow a consistent envelope:
- Success: `{ "success": true, "data": { ... } }`
- Error: `{ "success": false, "error": { "code": "ERROR_CODE", "message": "...", "details": [...] } }`

Error codes are defined in schema.md section 6.

### API Versioning
All API routes use the `/api/v1/` prefix to support future breaking changes:
- Auth: `/api/v1/auth/...`
- Owner: `/api/v1/owner/...`
- Public: `/api/v1/fields/...`
- Booking: `/api/v1/bookings/...`
- Payment: `/api/v1/payments/...`
- Admin: `/api/v1/admin/...`

### Migration Naming Convention
All Prisma migrations must follow this format:
- `YYYYMMDD_phaseN_description`
- Example: `20260424_phase1_initial_schema`
- Example: `20260501_phase2_add_field_indexes`

### Image Upload Strategy
- Field images are stored as URL strings in the database (`images: String[]`).
- Upload flow: FE uploads to cloud storage (Cloudinary or Supabase Storage), receives URL, sends URL to BE.
- BE validates URL format only; does not handle file upload directly.
- Cloud provider choice: Cloudinary (free tier: 25 credits/month) or Supabase Storage (integrated with existing DB host).
- Max images per field: 10. Max file size: 5MB. Accepted formats: JPEG, PNG, WebP.

### Email Provider Strategy
- Development: nodemailer + Ethereal (fake SMTP — emails viewable at ethereal.email).
- Production: Resend (generous free tier, simple API) or SendGrid.
- Config: `EMAIL_PROVIDER` env var (values: `ethereal`, `resend`, `sendgrid`).
- Templates: simple string interpolation for MVP; migrate to handlebars if needed.

### Payment Provider Strategy
- Phase 4 implements VNPay integration using their sandbox environment for testing.
- The provider simulates real-world flows: initiate payment → VNPay gateway → callback (IPN/Return URL) → confirm/fail.
- Provider interface is abstracted so other real providers can be plugged in later if needed.
- Config: `PAYMENT_PROVIDER=vnpay`. VNPay requires `VNP_TMNCODE`, `VNP_HASHSECRET`, and `VNP_URL` in `.env`.

---

## Phase Breakdown

### Phase 1 - Foundation and Auth Hardening (Retrofit + Complete)
Goal: keep existing implementation, then harden and complete missing production fundamentals.

Primary backend tasks:
1. Configuration and startup hardening
- Implement centralized config loader in src/config/index.js with validation for required env vars.
- Split app construction from server start to improve testability.
- Add consistent error response format middleware.

2. Prisma and database readiness
- Add Prisma Client runtime dependency and generation workflow.
- Create and run first migration from current schema.prisma.
- Add seed script for roles/test users.

3. Auth module hardening
- Add input validation for register/login payloads.
- Enforce role whitelist on registration (default USER; OWNER only via controlled path if needed).
- Replace fallback JWT secret with required env variable.
- Add token expiration strategy and standard auth error codes.

4. Repository layer completion
- Implement user.repository.js methods:
  - findByEmail
  - createUser
  - findById
- Refactor auth.service.js to use repository instead of direct Prisma calls.

5. API contract and docs
- Define auth endpoint contracts:
  - POST /api/v1/auth/register
  - POST /api/v1/auth/login
  - GET /api/v1/auth/me
- Add request/response examples and common error payloads.

6. Tests for Phase 1 closure
- Unit tests: auth service success/failure cases.
- Middleware tests: missing token, invalid token, forbidden role.
- Smoke test: health endpoint + auth route registration.

Phase 1 Done Criteria:
- No placeholder file in auth path.
- Auth works with validated input and strict env config.
- Migration and seed commands documented and repeatable.
- Test suite exists and passes for auth and middleware baseline.

### Phase 2 - Field and Slot Domain (Owner + Public Query)
Goal: implement complete field inventory lifecycle and slot generation with clean ownership rules.

Primary backend tasks:
1. Data model refinements
- Add indexes for field search and slot lookup.
- Add unique constraints for duplicate slot prevention:
  - (field_id, date, start_time, end_time)
- Prepare soft-delete strategy if required (active flag or deleted_at).

2. Field repository and service
- Implement field repository methods:
  - createField
  - updateField
  - listOwnerFields
  - getFieldById
  - setFieldActiveStatus
- Implement business rules:
  - Owner can mutate only own fields.
  - Admin controls approval state if moderation is enabled.

3. Slot generation and management
- Implement slot generation strategies:
  - manual batch create
  - recurring generator for date range
- Validate slot overlaps before insert.
- Expose slot CRUD for owner-managed windows.

4. Public search APIs
- GET /api/v1/fields with pagination and filters:
  - location
  - price range
  - active only
- GET /api/v1/fields/:id with field detail and upcoming slots.

5. Security and role controls
- Owner endpoints protected by auth + role middleware.
- Public endpoints read-only and rate-limited.

6. Test coverage
- Service tests for ownership and slot overlap.
- API integration tests for filters and pagination.

Phase 2 Done Criteria:
- Owner can fully manage fields and slots without violating ownership.
- Public can discover active fields with predictable query performance.
- Duplicate/overlapping slot creation is blocked.

Frontend scope (minimal):
- Owner field form and slot management pages consume stable APIs.
- Public field list/detail pages support core filters and pagination only.

### Phase 3 - Booking Concurrency Engine and Job Processing
Goal: build safe booking flow under concurrency with expiration and async notifications.

Primary infrastructure tasks:
1. Redis setup
- Implement infrastructure/redis.js with connection lifecycle and retry policy.
- Redis serves dual purpose: BullMQ queue backend + distributed locking (SET NX PX).
- Define key naming strategy:
  - lock:slot:{slotId}
  - rate:booking:{userId}

2. BullMQ setup
- Implement infrastructure/queue.js with named queues:
  - booking-events
  - booking-expiration
  - notification-email
- Configure worker concurrency, retries, and exponential backoff.
- Use BullMQ native delayed jobs for booking expiration (15 min delay).

3. Worker and scheduler implementation
- Implement email.worker.js for booking-created notifications.
- Implement delayed expiration worker:
  - cancel pending booking when expires_at reached
  - idempotency check before state update
- Keep cleanup cron as fallback sweeper for missed expiration jobs.

Primary backend tasks:
4. Booking repository and transactional service
- Implement booking repository methods:
  - findConfirmedBySlot
  - createPendingBooking
  - confirmBooking
  - cancelExpiredBooking
  - listBookingsByUser
- Implement createBooking flow:
  - acquire Redis lock (SET NX PX)
  - verify slot availability
  - create booking in transaction
  - enqueue delayed expiration job
  - release lock safely (token-based unlock)

5. Booking API endpoints
- POST /api/v1/bookings
- GET /api/v1/bookings/me
- GET /api/v1/bookings/:id
- DELETE /api/v1/bookings/:id (cancel if policy allows)

6. Concurrency and reliability tests
- Simulate parallel booking requests on same slot.
- Verify only one booking wins and others fail with deterministic code.
- Validate job retry and idempotent re-processing.

Phase 3 Done Criteria:
- Double-booking prevention is validated under concurrent requests.
- Pending bookings auto-expire after 15 minutes.
- Jobs are observable and retry-safe.

Frontend scope (minimal):
- Booking button/flow integrated with status feedback.
- My Bookings page shows pending/confirmed/cancelled states.

### Phase 4 - Payment, Admin Operations, Quality Gate, Deployment
Goal: complete payment state machine, admin controls, production hardening, and release.

Primary backend tasks:
1. Payment domain implementation
- Implement payment.service.js with state transitions:
  - PENDING -> COMPLETED
  - PENDING -> FAILED
- Protect against duplicate payment confirmation.
- Link payment completion to booking confirmation transactionally.

2. Payment endpoints
- POST /api/v1/payments/initiate
- POST /api/v1/payments/confirm (mock provider callback)
- POST /api/v1/payments/fail
- GET /api/v1/payments/:bookingId

3. Admin APIs
- Approve/reject fields.
- List users with role/status filters.
- Optional role update endpoint with audit logging.

4. Observability and operations
- Add pino structured logs with requestId/jobId correlation.
- Add readiness and dependency checks (db, redis, queue).
- Add graceful shutdown for HTTP server and workers.

5. Testing and release readiness
- End-to-end flow tests:
  - register -> login -> create field -> create slot -> book -> pay -> confirm
- Non-functional test checklist:
  - concurrent booking load test
  - expired booking sweep correctness
  - payment idempotency

6. Deployment and runbook
- Dockerfiles and environment templates for BE workers and API.
- Deploy API + worker as separate processes.
- Document rollback steps and post-deploy verification checklist.

Phase 4 Done Criteria:
- End-to-end happy path and critical failure paths are tested.
- Admin operations and payment states are stable.
- Production deployment includes worker process and operational runbook.

Frontend scope (minimal):
- Admin pages consume stable moderation and user APIs.
- Payment UI can trigger mock initiate/confirm/fail actions.

---

## Suggested Execution Order Inside Backend Team
1. Complete Phase 1 hardening before new domain features.
2. Build Phase 2 repositories/services first, then controllers/routes.
3. In Phase 3, finish Redis + queue infrastructure before booking API.
4. In Phase 4, lock payment state machine and idempotency before admin extras.

## Artifacts to Maintain Per Phase
- Updated API contract document.
- Migration scripts and rollback notes.
- Test report (unit/integration/load where relevant).
- Operational checklist (health checks, queue status, known risks).

## Cross-Phase Conventions
- API versioning: all routes prefixed with `/api/v1/`.
- Validation: all request payloads validated via Zod schemas in src/validators/ before reaching controllers.
- Error handling: services throw AppError instances (from src/utils/errors.js); global error middleware handles formatting.
- Response format: all endpoints return { success: true/false, data/error } envelope.
- Logging: pino for structured JSON logs; pino-http for automatic request logging with requestId.
- Security: helmet for HTTP headers; CORS environment-aware origin whitelist.
- Migration naming: YYYYMMDD_phaseN_description.
- Testing: jest for unit tests, supertest for integration/API tests.

## Frontend Integration Notes
- FE stack: React 19 + Vite + TailwindCSS v4 + React Router v7.
- HTTP client: axios with centralized instance (base URL, auth interceptor, error transform).
- Token storage: localStorage or httpOnly cookie (to be decided in Phase 1).
- FE–BE contract: FE must parse the `{ success, data, error }` envelope consistently.
- Detailed FE plan maintained separately by FE team member; see plan/frontend.md.
