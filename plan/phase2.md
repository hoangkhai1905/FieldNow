# Phase 2: Field and Slot Domain

## Objective
Implement owner field management and slot inventory with clean data constraints and search-friendly APIs.

## Prerequisites
Before starting Phase 2, create the following files:
- src/repositories/field.repository.js
- src/repositories/slot.repository.js
- src/services/field.service.js
- src/services/slot.service.js
- src/controllers/field.controller.js
- src/controllers/slot.controller.js
- src/validators/field.validator.js
- src/validators/slot.validator.js
- src/routes/owner.routes.js
- src/routes/field.routes.js (public)

## Backend Work Breakdown

### A. Data Modeling and Constraints
1. Review Prisma model types for slot time representation (string vs Time type strategy).
2. DB constraints/indexes (already applied to schema.prisma): ✅
   - unique(field_id, date, start_time, end_time)
   - index on fields(owner_id)
   - index on fields(location, is_active)
   - index on field_slots(field_id, date)
   - created_at added to field_slots
   - created_at + updated_at added to fields
3. Add migration for all new constraints.
   - Migration name: YYYYMMDD_phase2_field_slot_constraints.

### B. Field Repository and Service
1. Implement repository methods:
   - createField
   - updateField
   - deleteField (or soft delete)
   - getFieldById
   - listOwnerFields
   - listPublicFields(filter, pagination)
2. Implement service rules:
   - owner can modify only own records
   - is_active flow controlled by admin where required
   - images and pricing validation

### C. Slot Repository and Service
1. Implement repository methods:
   - createSlot
   - createSlotsBatch
   - updateSlot
   - deleteSlot
   - listSlotsByFieldAndDateRange
2. Implement slot generation utility:
   - input: opening hours, interval, date range
   - output: non-overlapping slot set
3. Add overlap conflict checks at service and DB levels.

### D. API Endpoints
1. Owner endpoints (auth + role OWNER):
   - POST /api/v1/owner/fields
   - PATCH /api/v1/owner/fields/:id
   - GET /api/v1/owner/fields
   - POST /api/v1/owner/fields/:id/slots/batch
   - PATCH /api/v1/owner/slots/:slotId
   - DELETE /api/v1/owner/slots/:slotId
2. Public endpoints:
   - GET /api/v1/fields
   - GET /api/v1/fields/:id
   - GET /api/v1/fields/:id/slots

### E. Validation, Errors, and Performance
1. Validate field payloads using Zod schemas in src/validators/field.validator.js:
   - name: required string, min 1 char
   - location: required string
   - price_per_hour: required positive number
   - description: optional string
   - images: optional array of URL strings
2. Validate slot payloads using Zod schemas in src/validators/slot.validator.js:
   - date: required, must be today or future
   - start_time: required, HH:mm format
   - end_time: required, HH:mm format, must be after start_time
   - price_override: optional positive number
   - Batch creation: array of slots with same validations
3. Add pagination defaults and max page size:
   - Default page size: 20
   - Max page size: 100
   - Validate via Zod query schema
4. Return stable error codes for conflict and permission errors.

### E2. Rate Limiting (Public APIs)
1. Add rate limiting middleware to public search endpoints:
   - GET /api/fields: 60 requests/min per IP
   - GET /api/fields/:id: 120 requests/min per IP
   - GET /api/fields/:id/slots: 120 requests/min per IP
2. Implementation options:
   - express-rate-limit (simple, in-memory or Redis-backed).
   - Recommended: express-rate-limit with rate-limit-redis store when Redis is available (Phase 3).
   - Install: `npm install express-rate-limit`.
3. Return 429 Too Many Requests with Retry-After header.
4. Rate limiting for owner endpoints is lower priority (auth already restricts access).

### E3. Image Upload Integration
1. Field images are stored as URL strings in the database (no file upload on BE).
2. FE uploads images directly to Cloudinary or Supabase Storage.
3. BE validates:
   - URL format (must be valid HTTPS URL).
   - Array length (max 10 images per field).
   - Accepted domains (whitelist cloud storage origins).
4. Add Zod validation for image URLs in field.validator.js.
5. Document upload flow for FE integration.

### F. Test Coverage
1. Unit tests for field ownership and update rules.
2. Unit tests for slot overlap checks.
3. Integration tests for list filters + pagination.
4. Integration tests for owner authorization boundaries.

## Infrastructure Scope
1. Prepare DB migration pipeline for schema/index updates.
2. Add simple seed data for search and owner test scenarios.

## Deliverables
1. Complete field and slot CRUD for owner role.
2. Public field discovery API with filtering and pagination.
3. Conflict-safe slot creation path.
4. Test suite for domain rules and access control.

## Done Criteria
1. Owner cannot mutate data outside ownership.
2. Duplicate/overlapping slots are blocked.
3. Public list queries return consistent paginated responses.
4. Phase 2 tests pass with seeded data.

## FE Scope (Minimal)
1. Owner pages call owner endpoints for field/slot management.
2. Public list/detail pages consume search and slot APIs.
3. Image upload UI integrates with Cloudinary/Supabase Storage SDK.

## Effort Estimates (Phase 2)
| Task | Size | Est. Hours |
|------|------|------------|
| File scaffolding (repos, services, controllers, validators, routes) | S | 0.5h |
| Prisma migration for Phase 2 | S | 0.5h |
| field.repository.js + field.service.js | L | 3-4h |
| slot.repository.js + slot.service.js (incl. generation utility) | L | 3-4h |
| Zod schemas (field + slot validators) | M | 1-2h |
| Owner routes + controller | M | 2-3h |
| Public routes + controller (filters, pagination) | M | 2-3h |
| Rate limiting middleware | S | 0.5-1h |
| Image upload validation | S | 0.5h |
| Seed data for testing | S | 0.5h |
| Service tests (ownership, overlap) | M | 2-3h |
| Integration tests (filters, pagination, auth) | M | 2-3h |
| **Total** | | **~16-24h** |
