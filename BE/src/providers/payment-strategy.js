class PaymentStrategy {
  createCheckoutFields(_bookingId, _amount, _description) {
    throw new Error('Not implemented');
  }

  verifyIpn(_headers, _body) {
    throw new Error('Not implemented');
  }

  isSuccess(_body) {
    throw new Error('Not implemented');
  }

  extractBookingId(_body) {
    throw new Error('Not implemented');
  }
}

module.exports = PaymentStrategy;
