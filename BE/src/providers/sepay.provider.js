const { SePayPgClient } = require('sepay-pg-node');
const { logger } = require('../infrastructure/logger');

class SePayProvider {
  constructor() {
    this.merchantId = process.env.SEPAY_MERCHANT_ID;
    this.secretKey = process.env.SEPAY_SECRET_KEY;
    this.env = process.env.SEPAY_ENV || 'production';

    this.successUrl = process.env.SEPAY_SUCCESS_URL || 'http://localhost:3000/payment/success';
    this.errorUrl = process.env.SEPAY_ERROR_URL || 'http://localhost:3000/payment/error';
    this.cancelUrl = process.env.SEPAY_CANCEL_URL || 'http://localhost:3000/payment/cancel';

    if (!this.merchantId || !this.secretKey) {
      logger.warn('[SePay] SEPAY_MERCHANT_ID or SEPAY_SECRET_KEY is not set!');
    }

    this._client = new SePayPgClient({
      env: this.env,
      merchant_id: this.merchantId,
      secret_key: this.secretKey,
    });
  }

  /**
   * Generate the SePay checkout URL and signed form fields for a booking.
   * The frontend POSTs these fields to `checkoutUrl` to redirect the user.
   *
   * @param {string} bookingId  - Used as order_invoice_number so IPN can resolve the booking
   * @param {number} amount     - Amount in VND
   * @param {string} description
   * @returns {{ checkoutUrl: string, formFields: object }}
   */
  createCheckoutFields(bookingId, amount, description = 'Payment for booking') {
    const checkoutUrl = this._client.checkout.initCheckoutUrl();

    const formFields = this._client.checkout.initOneTimePaymentFields({
      operation: 'PURCHASE',
      payment_method: 'BANK_TRANSFER',   // QR chuyển khoản VietQR — nhanh nhất, không cần hồ sơ
      order_invoice_number: bookingId,   // dùng bookingId làm invoice number
      order_amount: amount,
      currency: 'VND',
      order_description: description,
      success_url: this.successUrl,
      error_url: this.errorUrl,
      cancel_url: this.cancelUrl,
    });

    return { checkoutUrl, formFields };
  }

  /**
   * Verify the IPN request from SePay using the X-Secret-Key header.
   * SePay only sends this header when the merchant has configured auth type = SECRET_KEY.
   *
   * @param {object} headers - Express request headers
   * @returns {boolean}
   */
  verifyIpn(headers) {
    const receivedKey = headers['x-secret-key'];
    if (!receivedKey) {
      logger.warn('[SePay IPN] Missing X-Secret-Key header');
      return false;
    }
    return receivedKey === this.secretKey;
  }

  /**
   * Check whether the IPN payload signals a successful payment.
   * @param {object} body - Parsed IPN JSON body
   * @returns {boolean}
   */
  isSuccess(body) {
    return (
      body?.notification_type === 'ORDER_PAID' &&
      body?.order?.order_status === 'CAPTURED' &&
      body?.transaction?.transaction_status === 'APPROVED'
    );
  }

  /**
   * Extract the booking ID from an IPN payload.
   * We store the bookingId in order_invoice_number when creating the checkout.
   * @param {object} body
   * @returns {string}
   */
  extractBookingId(body) {
    return body?.order?.order_invoice_number;
  }
}

module.exports = new SePayProvider();
