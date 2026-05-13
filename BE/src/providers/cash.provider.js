const { logger } = require('../infrastructure/logger');

class CashProvider {
  /**
   * For cash payments, we don't need a redirect.
   * We just return instructions to the user.
   */
  createCheckoutFields(bookingId, amount, _description = 'Thanh toán trực tiếp tại sân') {
    logger.info(`[CashPayment] Initialized for booking: ${bookingId}`);
    
    return {
      checkoutUrl: null,
      instructions: 'Vui lòng thanh toán trực tiếp tại quầy khi đến sân.',
      isDirect: true,
      message: 'Bạn đã chọn thanh toán trực tiếp. Vui lòng chuẩn bị tiền mặt hoặc chuyển khoản tại quầy.'
    };
  }

  // Cash payment doesn't have IPN/Webhook usually, but we could implement one for owner's app
  verifyIpn() {
    return false;
  }

  isSuccess() {
    return false;
  }

  extractBookingId() {
    return null;
  }
}

module.exports = new CashProvider();
