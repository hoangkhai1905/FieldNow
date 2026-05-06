# OTP Integration Tests

## Overview

This test suite (`tests/integration/otp.e2e.test.js`) provides comprehensive coverage for the OTP (One-Time Password) feature, testing the complete flow from user registration through email verification to login.

## Test Suites

### 1. Send OTP (`POST /api/v1/otp/send`)
- ✅ Send OTP to registered user
- ✅ Fail if user does not exist
- ✅ Fail if email is invalid
- ✅ Fail if email is missing
- ✅ Generate new OTP on subsequent sends

### 2. Verify OTP (`POST /api/v1/otp/verify`)
- ✅ Verify OTP and mark email as verified
- ✅ Fail with invalid OTP code
- ✅ Fail if OTP format is invalid
- ✅ Fail if user does not exist
- ✅ Fail if OTP has expired

### 3. Resend OTP (`POST /api/v1/otp/resend`)
- ✅ Resend OTP to unverified user
- ✅ Fail if trying to resend to already verified user
- ✅ Fail if user does not exist

### 4. Email Verification for Login
- ✅ Allow login after email is verified
- ✅ Block login if email is not verified

### 5. Complete OTP Flow
- ✅ Full integration test: register → send OTP → verify → login

## Running the Tests

### Run only OTP tests
```bash
npm test -- tests/integration/otp.e2e.test.js
```

### Run all integration tests
```bash
npm test -- tests/integration/
```

### Run all tests with watch mode
```bash
npm test -- --watch
```

### Run with verbose output
```bash
npm test -- --verbose tests/integration/otp.e2e.test.js
```

## Test Data

Tests use dynamically generated test users with unique emails to avoid conflicts:
```
otp-test-{timestamp}@example.com
```

Each test creates its own test user and cleans up after itself.

## Environment Setup

Tests require:
- **DATABASE_URL** — PostgreSQL database connection
- **JWT_SECRET** — For token generation
- **Email Worker** — Can be mock or real (emails go to Ethereal/SendGrid based on `.env`)

Tests automatically clean up created users after completion.

## Expected Behavior

### Registration
- User is created with `is_email_verified = false`
- User **cannot** log in until verified

### Send OTP
- 6-digit code is generated
- Code is valid for 10 minutes
- Code is sent to email via email worker

### Verify OTP
- Code is validated against stored code
- Expiration is checked
- On success: `is_email_verified = true`, code is cleared

### Login
- Requires valid email and password
- **NEW**: Also requires `is_email_verified = true`
- Returns JWT token on success

### Resend OTP
- Can only resend to users who are not yet verified
- Generates a new code (old one becomes invalid)

## Troubleshooting

### Tests Timeout
- Ensure Redis is not required for basic OTP operations (BullMQ queue can be stubbed)
- Check database connection is working

### OTP Code Mismatch
- Verify that test is retrieving the correct OTP from database
- Check that OTP generation is deterministic in tests

### Email Not Sent (in email tests)
- Check email worker is running or mocked
- Verify SMTP/SendGrid credentials in `.env`

## Adding New Tests

To add more tests:

1. Add new `describe()` block or `it()` test
2. Use existing patterns for setup/teardown
3. Always clean up test data in `afterEach()` or `afterAll()`
4. Use meaningful test names that describe the scenario

Example:
```javascript
it('should handle rate limiting on OTP send', async () => {
  // Send OTP multiple times
  for (let i = 0; i < 5; i++) {
    await request(app)
      .post('/api/v1/otp/send')
      .send({ email: testUser.email });
  }

  // 6th request should fail with 429 Too Many Requests
  const res = await request(app)
    .post('/api/v1/otp/send')
    .send({ email: testUser.email })
    .expect(429);

  expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
});
```

## CI/CD Integration

These tests are suitable for CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run OTP Integration Tests
  run: npm test -- tests/integration/otp.e2e.test.js --forceExit --detectOpenHandles
```

## Known Issues

None currently. Report issues in the project repository.
