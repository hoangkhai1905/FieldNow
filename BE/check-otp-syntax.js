/**
 * Syntax check script for OTP modules
 * Usage: node check-otp-syntax.js
 */

console.log('Checking OTP modules for syntax errors...\n');

try {
  console.log('✓ Loading OTP validator...');
  require('./src/validators/otp.validator.js');
  console.log('✓ OTP validator loaded successfully');

  console.log('✓ Loading OTP repository...');
  require('./src/repositories/otp.repository.js');
  console.log('✓ OTP repository loaded successfully');

  console.log('✓ Loading OTP controller...');
  require('./src/controllers/otp.controller.js');
  console.log('✓ OTP controller loaded successfully');

  console.log('✓ Loading OTP routes...');
  require('./src/routes/otp.routes.js');
  console.log('✓ OTP routes loaded successfully');

  console.log('\n✅ All OTP modules have valid syntax!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Syntax error found:');
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}
