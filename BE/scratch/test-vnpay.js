require('dotenv').config();
const vnpayProvider = require('../src/providers/vnpay.provider');

async function testVNPay() {
  console.log('--- VNPay Test Script ---');
  console.log('TMN Code:', process.env.VNP_TMNCODE);
  console.log('Hash Secret:', process.env.VNP_HASHSECRET ? '********' : 'MISSING');
  console.log('VNPay URL:', process.env.VNP_URL);

  const bookingId = 'TEST_' + Date.now();
  const amount = 500000; // 500,000 VND
  const ipAddr = '127.0.0.1';
  
  try {
    const paymentUrl = vnpayProvider.createPaymentUrl(bookingId, amount, ipAddr);
    console.log('\nGenerated Payment URL:');
    console.log(paymentUrl);
    console.log('\n--- Test Verification Logic ---');
    
    // Simulate parsing the URL back to params
    const url = new URL(paymentUrl);
    const params = Object.fromEntries(url.searchParams.entries());
    
    const isValid = vnpayProvider.verifySignature(params);
    console.log('Signature is valid:', isValid);
    
    if (isValid) {
      console.log('SUCCESS: VNPay Provider is working correctly.');
    } else {
      console.error('FAILED: Signature verification failed. Check your HASHSECRET.');
    }
  } catch (error) {
    console.error('ERROR during VNPay test:', error.message);
  }
}

testVNPay();
