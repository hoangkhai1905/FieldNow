# Phase 1: Foundation and Auth Hardening

## Objective
Finalize the backend foundation and authentication module so later phases can build on a stable baseline.

## Current Status Snapshot (Already Implemented)
- Express server and auth routes are in place.
- Prisma schema includes all core entities.
- Basic register/login/me flow exists.
- JWT auth middleware and role middleware exist.

## Phase 1 Work Breakdown (Detailed)

### A. Project and Runtime Foundation
1. Create centralized env configuration in src/config/index.js. ✅
2. Validate required env vars at startup: ✅
   - PORT
   - DATABASE_URL
   - JWT_SECRET
3. Add environment sample updates in .env.example.
4. Split app bootstrap and app listen flow to improve testability. ✅
   - app.js exports the Express app (no listen call).
   - server.js imports app and calls listen.
   - Enables supertest to import app without starting a server.

### B. Prisma and Database Readiness
1. Ensure runtime dependency includes @prisma/client.
2. Create initial Prisma migration from schema.prisma.
3. Add scripts in package.json:
   - prisma:generate
   - prisma:migrate
   - prisma:studio (optional)
4. Create seed script for baseline users (USER/OWNER/ADMIN).

### C. Auth Domain Hardening
1. Add payload validation for register/login using Zod. ✅
   - Validation library: Zod (chosen over joi for TypeScript-first design and smaller bundle).
   - Schemas live in src/validators/auth.validator.js.
   - Generic validate() middleware in src/middlewares/validate.middleware.js wraps any Zod schema.
2. Enforce role input policy: ✅
   - default role = USER
   - only USER and OWNER allowed on registration (ADMIN blocked)
   - reject invalid role values via Zod enum validation
3. Remove fallback JWT secret and require env-based secret. ✅
4. Standardize auth error format and status mapping: ✅
   - 400 validation errors (code: VALIDATION_ERROR, with field-level details array)
   - 401 invalid credentials/token (code: UNAUTHORIZED)
   - 409 duplicate email (code: CONFLICT)
5. Keep consistent response DTO for login/register/me.
   - Success envelope: { success: true, data: { ... } }
   - Error envelope: { success: false, error: { code, message, details? } }
   - Implemented in src/utils/errors.js (AppError class) and src/middlewares/error.middleware.js.

### D. Repository Layer Completion
1. Implement user.repository.js methods:
   - findByEmail(email)
   - create(data)
   - findById(id)
2. Refactor auth.service.js to use repository methods.
3. Keep Prisma calls out of controller layer.

### E. Middleware and Security
1. Keep auth middleware strict for Bearer token format. ✅
2. Add optional middleware to normalize requestId for logs (use `crypto.randomUUID()`).
3. Add role-based route examples beyond /me for validation.
4. Configure CORS with environment-aware origin whitelist:
   - Development: allow all origins (default).
   - Staging/Production: restrict to known FE domains via CORS_ORIGIN env var.
   - Implementation: `app.use(cors({ origin: config.corsOrigin || '*' }))`.
   - Add `corsOrigin` to config loader from `CORS_ORIGIN` env var.
5. Add helmet middleware for HTTP security headers:
   - `app.use(helmet())` — protects against XSS, clickjacking, MIME sniffing.
   - Install: `npm install helmet`.
6. Add compression middleware for response payloads:
   - `app.use(compression())`.
   - Install: `npm install compression`.
7. Set up pino + pino-http for structured logging:
   - Install: `npm install pino pino-http`.
   - Middleware auto-attaches requestId to all log entries.
8. Update all route prefixes to `/api/v1/` for API versioning.
   - Example: `app.use('/api/v1/auth', authRoutes)`.

### F. API Contract Documentation
1. Document endpoint contracts (all using /api/v1/ prefix):
   - POST /api/v1/auth/register
   - POST /api/v1/auth/login
   - GET /api/v1/auth/me
2. Include request payload, success response, error cases.
3. Add token usage instructions for FE integration.

### G. Testing Scope
Test framework: Jest + Supertest (installed in devDependencies). ✅
1. Unit test auth service:
   - register success
   - register duplicate email
   - login success
   - login wrong password
2. Middleware tests:
   - missing token
   - invalid token
   - forbidden role
   - validation middleware rejects invalid payloads
3. Health and route smoke tests.
4. Validation tests:
   - register with missing email
   - register with invalid role (e.g., ADMIN)
   - login with empty password

## Deliverables
1. Hardened auth backend with validated config and payloads.
2. Migration + seed setup reproducible across environments.
3. Basic automated test coverage for auth and middleware.
4. Updated auth API contract doc.

## Done Criteria
1. No placeholder file remains in auth/config/repository path.
2. New environment setup works from clean clone.
3. All auth endpoints return consistent response structure.
4. Phase 1 tests pass in CI/local.

## FE Scope (Minimal)
1. Keep login/register/auth context aligned with backend contracts.
2. Ensure token storage + auth header injection is stable.

## Stretch Goals (Phase 1)
1. Refresh token strategy:
   - Issue short-lived access token (15 min) + long-lived refresh token (7 days).
   - Add POST /api/v1/auth/refresh endpoint.
   - Store refresh token hash in DB or Redis.
   - Rationale: current 1-day access token is a compromise; refresh flow improves security.
2. Swagger/OpenAPI setup:
   - Auto-generate API docs from controller annotations.
   - Serve at /api-docs in development.

## Effort Estimates (Phase 1 Remaining)
| Task | Size | Est. Hours |
|------|------|------------|
| user.repository.js + auth.service refactor | M | 1-2h |
| First Prisma migration + seed script | M | 1-2h |
| CORS + helmet + compression setup | S | 0.5h |
| pino + pino-http logging setup | S | 0.5-1h |
| .env.example update | S | 0.25h |
| API versioning (route prefix change) | S | 0.5h |
| Unit tests (auth service) | M | 2-3h |
| Middleware tests | M | 1-2h |
| Health + smoke tests | S | 0.5h |
| Auth API contract docs | M | 1h |
| **Total remaining** | | **~8-13h** |
