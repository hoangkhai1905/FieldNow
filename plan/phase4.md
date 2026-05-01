# Phase 4: Payment, Admin, Production Hardening, Deployment

## Objective
Close the system with payment state handling, admin moderation, end-to-end reliability testing, and production deployment readiness.

## Backend Work Breakdown

### A. Payment Domain Completion
1. Implement payment.repository and payment.service modules.
2. Define payment state machine rules:
   - PENDING -> COMPLETED
   - PENDING -> FAILED
   - no backward transition from COMPLETED
3. On payment completion:
   - update payment status
   - confirm booking transactionally
4. Add idempotency guard for repeated confirmation callback.
5. Payment provider: VNPay Sandbox (see PLAN.md Payment Provider Strategy).
   - Abstract provider interface: `createPaymentUrl(booking)`, `verifyIpn(payload)`, `verifyReturn(payload)`.
   - Real provider VNPay is used via `PAYMENT_PROVIDER=vnpay`.

### B. Payment APIs
1. POST /api/v1/payments/initiate (returns VNPay payment URL)
2. GET /api/v1/payments/vnpay-return (redirect URL from VNPay)
3. GET /api/v1/payments/vnpay-ipn (Webhook for VNPay to confirm status)
4. GET /api/v1/payments/:bookingId
5. Validate ownership: user only accesses own booking payment.

### C. Admin Domain
1. Implement admin-only moderation endpoints:
   - PATCH /api/v1/admin/fields/:id/approve
   - PATCH /api/v1/admin/fields/:id/reject
2. Implement user management endpoint:
   - GET /api/v1/admin/users
   - optional PATCH /api/v1/admin/users/:id/role
3. Add audit logging for admin actions (logged via pino with admin userId + action + target).

### D. Operational Hardening
1. Add structured logging with correlation ids (pino + pino-http, requestId per request).
2. Add readiness endpoint checking:
   - database connectivity
   - redis connectivity (covers both BullMQ and locking)
3. Add graceful shutdown hooks for API + worker processes.
4. Add centralized error boundary for unhandled promise rejections.
5. Add process manager config (PM2 ecosystem file or Docker Compose).

### E. End-to-End and Non-Functional Testing
1. E2E flow:
   - register/login
   - create field/slot
   - create booking
   - confirm payment
   - verify booking confirmed
2. Failure flow:
   - pending booking expiration
   - payment failed
3. Load/concurrency check:
   - simultaneous booking attempts
   - queue retry behavior

## Infrastructure and Deployment

### F. Container and Runtime Layout
1. Provide API container config.
2. Provide worker process container config (separate from API).
3. Keep Redis as external service or managed provider.
4. Document required environment variables per process (API, workers).
5. Docker Compose for local full-stack dev: API + workers + Redis + PostgreSQL.

### G. Deployment Plan
1. Staging deploy with seed data.
2. Smoke tests in staging.
3. Production deploy with rollback strategy.
4. Post-deploy checks:
   - health/readiness
   - booking creation
   - expiration worker

## Deliverables
1. Stable payment and booking confirmation flow.
2. Admin moderation and user management APIs.
3. Production-ready observability and graceful shutdown.
4. Documented deployment + rollback runbook.

## Done Criteria
1. Payment callbacks are idempotent and safe.
2. Booking and payment states are consistent in all tested paths.
3. Admin actions are role-protected and auditable.
4. Deployment runbook executed successfully in staging.

## FE Scope (Minimal)
1. Basic admin pages consume moderation/user APIs.
2. Payment mock action buttons map to payment endpoints.

## Effort Estimates (Phase 4)
| Task | Size | Est. Hours |
|------|------|------------|
| payment.repository.js + payment.service.js | L | 3-4h |
| Payment API routes + controller | M | 2-3h |
| Idempotency guard for payment callbacks | M | 1-2h |
| Mock payment provider implementation | M | 2-3h |
| Admin moderation endpoints | M | 2-3h |
| Admin user management | S | 1-2h |
| Audit logging for admin actions | S | 0.5-1h |
| Structured logging setup (pino finalization) | S | 0.5h |
| Readiness endpoint (/ready) | S | 0.5-1h |
| Graceful shutdown hooks | M | 1-2h |
| E2E flow tests (happy path) | L | 3-4h |
| Failure flow tests | M | 2-3h |
| Dockerfiles + Docker Compose | M | 2-3h |
| Deployment runbook + rollback docs | M | 1-2h |
| **Total** | | **~20-32h** |

---

## Project Total Effort Estimate
| Phase | Est. Hours |
|-------|------------|
| Phase 1 (remaining) | ~8-13h |
| Phase 2 | ~16-24h |
| Phase 3 | ~20-30h |
| Phase 4 | ~20-32h |
| **Grand Total** | **~64-99h** |
