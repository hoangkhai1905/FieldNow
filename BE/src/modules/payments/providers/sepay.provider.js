const { SePayPgClient } = require('sepay-pg-node');
const { logger } = require('../../../infrastructure/logger');

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

    const appendQuery = (url, status) => {
      if (!url) return url;
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}bookingId=${bookingId}&status=${status}`;
    };

    const formFields = this._client.checkout.initOneTimePaymentFields({
      operation: 'PURCHASE',
      payment_method: 'BANK_TRANSFER',   // QR chuyển khoản VietQR — nhanh nhất, không cần hồ sơ
      order_invoice_number: bookingId,   // dùng bookingId làm invoice number
      order_amount: amount,
      currency: 'VND',
      order_description: description,
      success_url: appendQuery(this.successUrl, 'success'),
      error_url: appendQuery(this.errorUrl, 'error'),
      cancel_url: appendQuery(this.cancelUrl, 'cancel'),
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
  verifyIpn(headers, _body) {
    logger.info('--- Received IPN Headers ---');
    console.log(JSON.stringify(headers, null, 2));

    let receivedKey = headers['x-secret-key'];

    // If x-secret-key is not present, check Authorization: Apikey <key> or Bearer <key>
    if (!receivedKey && headers['authorization']) {
      const parts = headers['authorization'].split(' ');
      if (parts.length === 2 && (parts[0].toLowerCase() === 'apikey' || parts[0].toLowerCase() === 'bearer')) {
        receivedKey = parts[1];
      }
    }

    if (!receivedKey) {
      logger.warn('[SePay IPN] Missing verification key in headers');
      return false;
    }

    return receivedKey === this.secretKey;
  }

  /**
   * Check whether the IPN payload signals a successful payment.
   * Supports both Payment Gateway IPN and Bank Webhook formats.
   * @param {object} body - Parsed IPN JSON body
   * @returns {boolean}
   */
  isSuccess(body) {
    // 1. Payment Gateway IPN Schema
    if (body?.notification_type === 'ORDER_PAID') {
      return body?.order?.order_status === 'CAPTURED' && body?.transaction?.transaction_status === 'APPROVED';
    }
    
    // 2. Bank Transaction Webhook Schema (from "Mô phỏng giao dịch")
    if (body?.transferType === 'in') {
      return true;
    }

    return false;
  }

  /**
   * Extract the booking ID from an IPN payload.
   * Supports both Payment Gateway IPN and Bank Webhook formats.
   * @param {object} body
   * @returns {string}
   */
  extractBookingId(body) {
    // 1. Payment Gateway IPN Schema
    if (body?.order?.order_invoice_number) {
      return body.order.order_invoice_number;
    }
    
    // 2. Bank Transaction Webhook Schema (from "Mô phỏng giao dịch")
    const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
    
    // Check in 'code' field
    if (body?.code) {
      const match = body.code.match(uuidRegex);
      if (match) return match[0];
    }
    
    // Check in 'content' field (common for bank transfers)
    if (body?.content) {
      const match = body.content.match(uuidRegex);
      if (match) return match[0];
    }

    // Check in 'description' (fallback)
    if (body?.description) {
      const match = body.description.match(uuidRegex);
      if (match) return match[0];
    }
    
    // Log full body if nothing found to help user debug
    logger.warn(`[SePay IPN] Could not extract UUID from body. Keys present: ${Object.keys(body || {}).join(', ')}`);
    
    return body?.code || null;
  }
}

module.exports = new SePayProvider();
