/**
 * OTP Flow Test Script
 * Tests: Register → Send OTP → Verify OTP → Login
 * Usage: node test-otp-flow.js
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE = `http://localhost:${process.env.PORT || 5000}/api/v1`;

// Test data
const testEmail = `test-otp-${Date.now()}@example.com`;
const testPassword = 'testPassword123';
const testName = 'OTP Test User';

console.log('\n=== OTP Flow Test ===\n');
console.log(`Test Email: ${testEmail}`);
console.log(`API Base: ${API_BASE}\n`);

let testUserId, otpCode;

const test = async () => {
  try {
    // Step 1: Register User
    console.log('1️⃣  Registering user...');
    const registerRes = await axios.post(`${API_BASE}/auth/register`, {
      email: testEmail,
      password: testPassword,
      fullName: testName,
      role: 'USER',
    });
    console.log('✓ User registered');
    console.log(`  - User ID: ${registerRes.data.data.user.id}\n`);
    testUserId = registerRes.data.data.user.id;

    // Step 2: Send OTP
    console.log('2️⃣  Sending OTP...');
    const sendOtpRes = await axios.post(`${API_BASE}/otp/send`, {
      email: testEmail,
    });
    console.log('✓ OTP sent to email');
    console.log(`  - Expires in: ${sendOtpRes.data.data.expiresIn}ms\n`);

    // Step 3: Get OTP from database (in real scenario, user receives this via email)
    // For testing, we'll mock this by fetching from DB or using a test endpoint
    // For now, we'll simulate by extracting from logs or use a hardcoded test OTP
    console.log('3️⃣  Simulating OTP retrieval from email...');
    
    // In production, you'd fetch this from the email or a test endpoint
    // For this test, we'll use a Prisma query directly
    const prisma = require('../src/infrastructure/prisma');
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    otpCode = user.otp_code;
    console.log(`✓ OTP retrieved: ${otpCode}\n`);

    // Step 4: Verify OTP
    console.log('4️⃣  Verifying OTP...');
    const verifyOtpRes = await axios.post(`${API_BASE}/otp/verify`, {
      email: testEmail,
      otp_code: otpCode,
    });
    console.log('✓ OTP verified');
    console.log(`  - Email verified: ${verifyOtpRes.data.data.user.is_email_verified}\n`);

    // Step 5: Attempt login (should work now)
    console.log('5️⃣  Logging in with verified email...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: testPassword,
    });
    console.log('✓ Login successful');
    console.log(`  - JWT Token: ${loginRes.data.data.token.substring(0, 20)}...\n`);

    // Step 6: Verify token works
    console.log('6️⃣  Verifying JWT token...');
    const meRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${loginRes.data.data.token}` },
    });
    console.log('✓ Token is valid');
    console.log(`  - Authenticated as: ${meRes.data.data.user.email}\n`);

    console.log('✅ All OTP flow tests passed!\n');

    // Cleanup: Delete test user (optional)
    console.log('🧹 Cleanup: Deleting test user...');
    await prisma.user.delete({ where: { id: testUserId } });
    console.log('✓ Test user deleted\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.message) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
};

test();
