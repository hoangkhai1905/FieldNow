# Password Reset and Change Password Features

## Overview

FieldNow now supports password reset (for forgotten passwords) and password change (for logged-in users) using OTP-based verification. Both flows provide secure password management without requiring the old password to be sent in plain text.

## Features

### 1. Password Reset (Forgot Password)
- User can request password reset without authentication
- OTP is sent to registered email
- User verifies OTP and sets new password
- Useful for users who forgot their password

### 2. Change Password
- User must be authenticated (JWT token required)
- OTP is sent to user's email for verification
- User verifies OTP and sets new password
- Useful for users who want to change their password regularly

## API Endpoints

### Password Reset Flow

#### `POST /api/v1/password/forgot`
Request a password reset link/OTP. No authentication required.

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
    "message": "If email exists, reset instructions will be sent",
    "expiresIn": 600000
  }
}
```

**Notes:**
- Returns same message for both existing and non-existing emails (security best practice)
- OTP is valid for 10 minutes
- Email is sent asynchronously via email worker

---

#### `POST /api/v1/password/reset`
Reset password using OTP. No authentication required.

**Request:**
```json
{
  "email": "user@example.com",
  "otp_code": "123456",
  "new_password": "secureNewPassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Password reset successfully",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "role": "USER"
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

**Validation Rules:**
- Email must be valid format
- OTP must be 6 digits
- New password must be at least 6 characters

---

### Change Password Flow

#### `POST /api/v1/password/change-request`
Request OTP for password change. Requires authentication.

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/password/change-request \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "OTP sent to your email for password change verification",
    "expiresIn": 600000
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or malformed token"
  }
}
```

---

#### `POST /api/v1/password/change`
Change password using OTP. Requires authentication.

**Request:**
```json
{
  "otp_code": "123456",
  "new_password": "brandNewPassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Password changed successfully",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "role": "USER"
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

**Validation Rules:**
- OTP must be 6 digits
- New password must be at least 6 characters
- JWT token must be valid

---

## Complete Workflows

### Password Reset Workflow

```bash
# 1. Request password reset
curl -X POST http://localhost:5000/api/v1/password/forgot \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# 2. Wait for email with OTP code

# 3. Reset password with OTP
curl -X POST http://localhost:5000/api/v1/password/reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp_code": "123456",
    "new_password": "newSecurePassword123"
  }'

# 4. Login with new password
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "newSecurePassword123"
  }'
```

### Change Password Workflow

```bash
# 1. Request OTP for password change (must be authenticated)
curl -X POST http://localhost:5000/api/v1/password/change-request \
  -H "Authorization: Bearer {JWT_TOKEN}"

# 2. Wait for email with OTP code

# 3. Change password with OTP
curl -X POST http://localhost:5000/api/v1/password/change \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "otp_code": "123456",
    "new_password": "updatedPassword123"
  }'

# 4. Old JWT token still works until expiration
#    New login with updated password will get new token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "updatedPassword123"
  }'
```

## Email Templates

### Password Reset OTP Email
```
Subject: Password Reset Request

Hi {user.full_name},

We received a request to reset your password. Your One-Time Password (OTP) is: {otp_code}

This code will expire in 10 minutes. Do not share this code with anyone.

If you didn't request a password reset, please ignore this email.
```

### Change Password OTP Email
```
Subject: Verify Password Change

Hi {user.full_name},

You requested to change your password. Your One-Time Password (OTP) is: {otp_code}

This code will expire in 10 minutes. Do not share this code with anyone.

If you didn't request this, please ignore this email.
```

## Database Changes

### User Model
Uses existing OTP fields:
- `otp_code` (String, nullable) — Stores 6-digit OTP
- `otp_expires_at` (DateTime, nullable) — Stores OTP expiration time

Note: Same fields are reused for email verification, password reset, and change password. The context is determined by the endpoint being called.

## Security Considerations

1. **No Email Enumeration**: Password reset endpoint returns same message for existing and non-existing emails
2. **OTP Expiration**: All OTPs expire after 10 minutes
3. **One-Time Use**: OTP is cleared after successful use
4. **HTTPS Required**: Always use HTTPS in production
5. **Rate Limiting**: Consider implementing rate limiting on `/password/forgot` endpoint
6. **No Old Password Required**: Password reset doesn't require old password (for recovery)
7. **Change Password Requires Auth**: Password change requires active JWT token (for security)

## Testing

### Run password tests
```bash
npm run test:password
```

### Run all integration tests
```bash
npm test -- tests/integration/
```

### Test coverage includes:
- ✅ Password reset request
- ✅ Password reset with OTP
- ✅ Password reset with expired OTP
- ✅ Change password request (authenticated)
- ✅ Change password with OTP (authenticated)
- ✅ Error cases (invalid OTP, missing email, etc.)
- ✅ Complete workflows

## Troubleshooting

### OTP Not Received
- Check email configuration in `.env` (EMAIL_PROVIDER, SMTP/SendGrid settings)
- Check email worker is running
- Check user's email address is correct
- Check spam/junk folder

### "No password reset request found"
- OTP has expired (>10 minutes)
- User hasn't requested password reset yet
- OTP was already used

### "Invalid OTP"
- Entered wrong OTP code
- OTP was for different user
- OTP was already used in successful reset

## Future Enhancements

- [ ] SMS-based OTP option
- [ ] Rate limiting on password reset endpoint
- [ ] Password strength validation (uppercase, numbers, special chars)
- [ ] Password history (prevent reusing recent passwords)
- [ ] Multi-factor authentication
- [ ] Security questions as additional verification
