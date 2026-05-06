# OTP (One-Time Password) Feature

## Overview
FieldNow now supports email-based OTP verification for user registration and authentication. Users must verify their email address with a 6-digit OTP before they can log in.

## Flow

### 1. User Registration
1. User calls `POST /api/v1/auth/register` with email, password, fullName, role
2. Account is created but **email is NOT verified** (`is_email_verified = false`)
3. User cannot log in until email is verified

### 2. Send OTP
1. User calls `POST /api/v1/otp/send` with their email
2. System generates a 6-digit OTP and saves it (valid for 10 minutes)
3. OTP is sent to user's email via email worker
4. Response includes `expiresIn` (in milliseconds)

### 3. Verify OTP
1. User receives email with OTP code
2. User calls `POST /api/v1/otp/verify` with email and 6-digit OTP
3. System validates:
   - OTP code matches
   - OTP hasn't expired
4. On success: `is_email_verified` is set to true, OTP is cleared
5. User can now log in

### 4. Login (Email Verified)
1. User calls `POST /api/v1/auth/login` with email and password
2. System checks:
   - Email and password are valid
   - **Email is verified** ← NEW check
3. If verified: JWT token is returned
4. If not verified: `401 Unauthorized` with message "Email not verified. Please verify your email first."

### 5. Resend OTP
1. If user didn't receive OTP or it expired, call `POST /api/v1/otp/resend` with email
2. New OTP is generated and sent

## API Endpoints

### `POST /api/v1/otp/send`
Send OTP to user's email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "OTP sent to your email",
    "expiresIn": 600000
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

---

### `POST /api/v1/otp/verify`
Verify OTP and mark email as verified.

**Request:**
```json
{
  "email": "user@example.com",
  "otp_code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Email verified successfully",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "role": "USER",
      "full_name": "John Doe",
      "is_email_verified": true
    }
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid OTP"
  }
}
```

---

### `POST /api/v1/otp/resend`
Resend OTP to user's email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:** Same as `/send`

**Response (409):**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Email already verified"
  }
}
```

---

## Database Changes

### User Model
New fields added to `User` table:
- `is_email_verified` (Boolean, default: false)
- `otp_code` (String, nullable)
- `otp_expires_at` (DateTime, nullable)

### Email Types
New email type supported by email worker:
- `email.otp_sent` — sends OTP code to user

## Environment Variables

No new environment variables required. OTP uses existing email configuration:
- `EMAIL_PROVIDER` — ethereal, smtp, or sendgrid
- `SMTP_*` or `SENDGRID_API_KEY` — email provider credentials

## Security Notes

- OTP is valid for **10 minutes only**
- OTP is a 6-digit numeric code
- OTP is cleared after successful verification
- OTP is cleared after new OTP is generated (old one becomes invalid)
- Users should not be able to log in without email verification

## Example Workflow

```bash
# 1. Register user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "fullName": "John Doe",
    "role": "USER"
  }'

# 2. Send OTP
curl -X POST http://localhost:5000/api/v1/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# 3. Wait for email and extract OTP code (e.g., "123456")

# 4. Verify OTP
curl -X POST http://localhost:5000/api/v1/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp_code": "123456"
  }'

# 5. Now user can login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

## Testing

Use the test script `test-otp-flow.js` to test the complete OTP flow:

```bash
node test-otp-flow.js
```

This script will:
1. Create a test user
2. Send OTP
3. Verify OTP
4. Attempt login (should succeed)
5. Cleanup
