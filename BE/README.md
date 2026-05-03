# FieldNow — Backend API

Football field booking platform backend built with Node.js, Express, Prisma, and PostgreSQL.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (v18+) |
| Framework | Express 5 |
| Database | PostgreSQL (Supabase-hosted) |
| ORM | Prisma 6 |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | Zod |
| Logging | pino + pino-http (structured JSON) |
| Security | helmet, CORS (env-aware) |
| Compression | compression middleware |
| Queue (Phase 3) | BullMQ + Redis |
| Docs | Swagger UI (swagger-jsdoc + swagger-ui-express) |
| Testing | Jest + Supertest |

## Quick Start

### Prerequisites

- Node.js ≥ 18
- PostgreSQL database (local or Supabase)
- (Phase 3+) Redis server

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — fill in DATABASE_URL and JWT_SECRET at minimum
```

### 3. Setup database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (creates all tables)
npm run prisma:migrate

# Seed baseline users (USER, OWNER, ADMIN)
npm run prisma:seed
```

### 4. Start development server

```bash
npm run dev
```

The server starts at:

```
API base:  http://localhost:5000/api/v1
Health:    http://localhost:5000/health
API Docs:  http://localhost:5000/api-docs    (dev only)
```

## NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `nodemon src/server.js` | Start dev server with auto-reload |
| `npm start` | `node src/server.js` | Start production server |
| `npm test` | `jest --verbose` | Run test suite |
| `npm run test:watch` | `jest --watch` | Run tests in watch mode |
| `npm run prisma:generate` | `prisma generate` | Generate Prisma client from schema |
| `npm run prisma:migrate` | `prisma migrate dev` | Create and apply migrations |
| `npm run prisma:studio` | `prisma studio` | Open Prisma Studio (DB browser) |
| `npm run prisma:seed` | `node prisma/seed.js` | Seed baseline data |

## Project Structure

```
BE/
├── prisma/
│   ├── schema.prisma          # Database schema (models, enums, indexes)
│   ├── seed.js                # Seed script (baseline users)
│   └── migrations/            # Migration history (auto-generated)
├── src/
│   ├── app.js                 # Express app (middleware stack + routes)
│   ├── server.js              # Server entry point (listen)
│   ├── config/
│   │   ├── index.js           # Centralized config loader (env validation)
│   │   └── swagger.js         # OpenAPI 3.0 spec configuration
│   ├── controllers/           # Request handlers (parse → delegate → respond)
│   │   └── auth.controller.js
│   ├── services/              # Business logic (validation, rules, orchestration)
│   │   └── auth.service.js
│   ├── repositories/          # Data access layer (Prisma queries)
│   │   └── user.repository.js
│   ├── middlewares/
│   │   ├── auth.middleware.js      # JWT verification
│   │   ├── role.middleware.js      # Role-based access control
│   │   ├── validate.middleware.js  # Zod schema validation
│   │   └── error.middleware.js     # Global error handler
│   ├── validators/            # Zod schemas for request payloads
│   │   └── auth.validator.js
│   ├── routes/                # Express route definitions (+ Swagger docs)
│   │   └── auth.routes.js
│   ├── infrastructure/        # External service connections
│   │   └── prisma.js          # Prisma client singleton
│   ├── utils/
│   │   └── errors.js          # AppError class + factory helpers
│   └── jobs/                  # (Phase 3) BullMQ workers
├── .env.example               # Environment variable template
├── .gitignore
└── package.json
```

## Architecture

```
Request → Middleware Stack → Controller → Service → Repository → Prisma → DB
                                 ↑              ↑
                            Validators      AppError (thrown)
                                                ↓
                                        Error Middleware → Response
```

**Layer rules:**
- **Controllers** parse `req.body`/`req.params`, delegate to services, format response.
- **Services** contain business logic, throw `AppError` on failures.
- **Repositories** encapsulate Prisma queries — services never call Prisma directly.
- **Middlewares** handle cross-cutting concerns (auth, validation, errors).

## API Documentation

### Interactive (Swagger UI)

Available at `http://localhost:5000/api-docs` in development mode.

Features:
- Try out endpoints directly from the browser
- **Authorize** button — paste JWT token to test authenticated endpoints
- Full request/response schema documentation

### Endpoints

#### Auth (Phase 1)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/auth/register` | — | Register a new user |
| `POST` | `/api/v1/auth/login` | — | Login, returns JWT token |
| `GET` | `/api/v1/auth/me` | Bearer | Get current user info |

#### Public (Phase 2)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/fields` | — | Search active fields (filters: location, minPrice, maxPrice) |
| `GET` | `/api/v1/fields/:id` | — | Get field details + slots (optional date filter) |

#### Owner (Phase 2)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/owner/fields` | Bearer (OWNER) | Create a new field (pending approval) |
| `GET` | `/api/v1/owner/fields` | Bearer (OWNER) | List all fields owned by user |
| `PATCH`| `/api/v1/owner/fields/:id` | Bearer (OWNER) | Update owned field |
| `POST` | `/api/v1/owner/fields/:id/slots/batch` | Bearer (OWNER) | Batch create slots for field |
| `PATCH`| `/api/v1/owner/slots/:slotId` | Bearer (OWNER) | Update specific slot |
| `DELETE`| `/api/v1/owner/slots/:slotId` | Bearer (OWNER) | Delete specific slot |

#### Admin (Phase 2)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `PATCH`| `/api/v1/admin/fields/:id/approve` | Bearer (ADMIN) | Approve field (is_active=true) |
| `PATCH`| `/api/v1/admin/fields/:id/reject` | Bearer (ADMIN) | Reject field (is_active=false) |

#### Bookings (Phase 3)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/bookings` | Bearer | Create a new booking for a slot (PENDING) |
| `GET`  | `/api/v1/bookings/me` | Bearer | Get user's booking history |
| `GET`  | `/api/v1/bookings/:id` | Bearer | Get details of a specific booking |
| `DELETE` | `/api/v1/bookings/:id`| Bearer | Cancel a pending booking |
| `GET` | `/api/v1/bookings/:id/status` | Bearer | Polling booking status |

#### Payments (Phase 4)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/payments/initiate` | Bearer | Generate VNPay payment URL for a booking |
| `GET`  | `/api/v1/payments/:bookingId` | Bearer | Get payment status of a booking |
| `GET`  | `/api/v1/payments/vnpay-return`| — | VNPay callback redirect (Frontend) |
| `GET`  | `/api/v1/payments/vnpay-ipn` | — | VNPay Server-to-Server callback |

#### Admin (Phase 4)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `PATCH`| `/api/v1/admin/fields/:id/approve` | Admin | Approve field for public display |
| `PATCH`| `/api/v1/admin/fields/:id/reject`  | Admin | Reject/Suspend field |
| `GET`  | `/api/v1/admin/users` | Admin | List all registered users |
| `PATCH`| `/api/v1/admin/users/:id/role` | Admin | Change user role (USER/OWNER/ADMIN) |

#### Upload (Phase 4 Extension)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/upload/images` | Owner/Admin | Upload images to Supabase Storage (Multipart) |
| `DELETE`| `/api/v1/upload/images` | Owner/Admin | Delete an image from storage by URL |

#### Utility
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | — | Process liveness health check |
| `GET` | `/ready`  | — | Database and Redis readiness check |

### Response Envelope

All responses follow a consistent format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
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

### Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Request payload failed Zod validation |
| `UNAUTHORIZED` | 401 | Missing/invalid JWT token or credentials |
| `FORBIDDEN` | 403 | Valid token but insufficient role |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate resource (e.g. email already used) |
| `SLOT_LOCKED` | 423 | Slot is being booked by another user |
| `SLOT_TAKEN` | 409 | Slot already has a confirmed booking |
| `BOOKING_EXPIRED` | 410 | Pending booking has expired |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Secret key for JWT signing |
| `PORT` | — | `5000` | Server port |
| `NODE_ENV` | — | `development` | Environment (`development`, `production`) |
| `JWT_EXPIRES_IN` | — | `1d` | JWT token expiration |
| `REDIS_URL` | — | `redis://localhost:6379` | Redis connection (Phase 3+) |
| `CORS_ORIGIN` | — | `*` (allow all) | Comma-separated allowed origins |
| `EMAIL_PROVIDER` | — | `ethereal` | Email service (`ethereal`, `resend`, `sendgrid`) |
| `PAYMENT_PROVIDER` | — | `mock` | Payment service (`mock`, `momo`, `vnpay`) |

## Database

### Schema overview

```
User (id, email, password, full_name, phone_number, role, is_active, created_at)
  ├── Field (id, owner_id, name, location, description, images, price_per_hour, is_active, ...)
  │     └── FieldSlot (id, field_id, date, start_time, end_time, price_override, is_locked, ...)
  │           └── Booking (id, user_id, slot_id, status, expires_at, created_at, updated_at)
  │                 └── Payment (id, booking_id, amount, provider, status, created_at, updated_at)
  └── Booking (via user_id)
```

### Roles

| Role | Capabilities |
|------|-------------|
| `USER` | Register, login, search fields, book slots, manage own bookings |
| `OWNER` | All USER capabilities + create/manage own fields and slots |
| `ADMIN` | All capabilities + approve/reject fields, manage users |

### Seed Data

After running `npm run prisma:seed`, these accounts are available:

| Email | Password | Role |
|-------|----------|------|
| `user@fieldnow.dev` | `password123` | USER |
| `owner@fieldnow.dev` | `password123` | OWNER |
| `admin@fieldnow.dev` | `password123` | ADMIN |

## Middleware Stack

Middleware executes in this order for every request:

1. **helmet** — Sets secure HTTP headers (XSS, clickjacking, MIME sniffing protection)
2. **cors** — Environment-aware origin whitelist
3. **compression** — Gzip response payloads
4. **express.json** — Parse JSON request bodies
5. **pino-http** — Structured JSON logging with auto `requestId`
6. **Swagger UI** — Serves `/api-docs` (dev only)
7. **Routes** — API endpoint handlers
8. **errorHandler** — Global error catch-all (formats `AppError` + unknown errors)

## Logging

Uses **pino** for structured JSON logging. Every request gets a unique `requestId`.

Example log output:
```json
{
  "level": 30,
  "time": 1777515201496,
  "req": { "method": "POST", "url": "/api/v1/auth/login" },
  "res": { "statusCode": 200 },
  "responseTime": 1121,
  "msg": "request completed"
}
```

## Roadmap

| Phase | Status | Scope |
|-------|--------|-------|
| Phase 1 | Foundation & Auth (Express, PostgreSQL, Prisma, JWT) | ✅ Completed |
| Phase 2 | Entities & REST API (Fields, Slots, Admin) | ✅ Completed |
| Phase 3 | Scheduling & High Concurrency (Redis Lock, BullMQ Jobs) | ✅ Completed |
| Phase 4 | Payments, Admin & Deployment (VNPay Sandbox, Docker) | ✅ Completed |

See [`../plan/`](../plan/) for detailed phase documentation and effort estimates.
