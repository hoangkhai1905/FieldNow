# FieldNow Backend Update - FE Integration Notes

## Scope

This backend update hardens booking, payment, auth refresh, and cache behavior.
Successful API response shapes were intentionally kept stable where possible.

Frontend changes are not mandatory if the FE already follows the current API
contracts, but the points below should be audited before release.

## Booking Create

### Required request payload

`POST /api/v1/bookings`

```json
{
  "fieldId": "uuid",
  "date": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "endTime": "HH:mm"
}
```

Do not use the old `{ "slotId": "..." }` booking payload.

### Conflict behavior

The backend now has a database-level overlap guard for active bookings
(`PENDING` and `CONFIRMED`). If another booking already overlaps the same field,
date, and time range, the API returns the existing conflict behavior:

```http
409 CONFLICT
```

FE should show the existing "time slot unavailable" or equivalent message for
`409` booking responses.

## Payment Retry

`Payment` now represents a payment attempt. A booking can have multiple payment
rows over time.

### Initiate payment

`POST /api/v1/payments/initiate`

```json
{
  "bookingId": "uuid",
  "provider": "sepay"
}
```

If the latest payment attempt is `FAILED`, calling this endpoint again creates a
new `PENDING` payment attempt for the same booking and returns the new
`paymentId`.

FE should not assume a booking has only one permanent payment id.

### Payment detail

`GET /api/v1/payments/:bookingId`

This endpoint still returns the latest payment for the booking, ordered by
`created_at desc`.

Polling this endpoint remains valid. After a retry, it should reflect the newest
payment attempt.

## SePay Callback

No FE changes are required.

`POST /api/v1/payments/sepay-ipn` is server-to-server. Duplicate terminal
callbacks remain idempotent and return success to the provider.

## Auth Refresh

The JSON contracts for these endpoints are unchanged:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

The backend now enforces refresh-token rotation and reuse rejection more
strictly.

FE must replace the stored refresh token with the new refresh token returned by
`/auth/refresh`. Reusing an old refresh token after a successful refresh should
be treated as invalid.

Logout revokes the active refresh token. After logout, FE should clear local auth
state and not attempt to refresh with the logged-out token.

## Public Field Search And Detail

No FE changes are expected.

The backend keeps the existing response wrapper:

```json
{
  "success": true,
  "data": {}
}
```

`X-Cache` headers are preserved for public field search/detail responses.

## Cache Behavior

No FE changes are required.

The backend replaced Redis `KEYS` wildcard invalidation with production-safe
`SCAN` batching. This is an internal behavior change only.

## FE Audit Checklist

- Booking create uses `{ fieldId, date, startTime, endTime }`.
- Booking `409` responses show a clear unavailable-time message.
- Payment retry calls `POST /payments/initiate` again after latest payment is
  `FAILED`.
- FE does not assume one fixed `paymentId` per booking.
- Payment polling uses `GET /payments/:bookingId` and accepts the latest attempt.
- Refresh-token storage is updated after every successful `/auth/refresh`.
- Logout clears stored access and refresh tokens.

