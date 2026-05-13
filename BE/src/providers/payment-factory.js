const getPaymentProvider = (providerName = 'sepay') => {
  const target = (providerName || 'sepay').toLowerCase();
  
  switch (target) {
    case 'vnpay':
      return require('./vnpay.provider');
    case 'sepay':
      return require('./sepay.provider');
    case 'cash':
      return require('./cash.provider');
    default:
      throw new Error(`Unknown payment provider: ${target}`);
  }
};

module.exports = {
  getPaymentProvider,
};
