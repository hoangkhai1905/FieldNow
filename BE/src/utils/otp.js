const crypto = require('crypto');

const hashOtp = (otpCode) => {
  return crypto.createHash('sha256').update(String(otpCode)).digest('hex');
};

module.exports = { hashOtp };
