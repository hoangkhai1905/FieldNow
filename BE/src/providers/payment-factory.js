const config = require('../config');

const getPaymentProvider = () => {
  switch ((config.paymentProvider || 'sepay').toLowerCase()) {
    case 'vnpay':
      return require('./vnpay.provider');
    case 'sepay':
      return require('./sepay.provider');
    default:
      throw new Error(`Unknown payment provider: ${config.paymentProvider}`);
  }
};

module.exports = {
  getPaymentProvider,
};
