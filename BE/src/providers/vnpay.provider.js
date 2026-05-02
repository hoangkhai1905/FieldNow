const crypto = require('crypto');
const querystring = require('querystring');
const config = require('../config');
const { logger } = require('../infrastructure/logger');

// Sort the object properties alphabetically
const sortObject = (obj) => {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
};

class VNPayProvider {
  constructor() {
    this.tmnCode = process.env.VNP_TMNCODE || 'TEST1234';
    this.hashSecret = process.env.VNP_HASHSECRET || 'TESTSECRET1234567890';
    this.url = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    // Ensure you have an environment variable for backend URL or use config
    this.returnUrl = process.env.VNP_RETURN_URL || `http://localhost:${config.port}/api/v1/payments/vnpay-return`;
  }

  /**
   * Generates VNPay payment URL for a booking
   */
  createPaymentUrl(bookingId, amount, ipAddr, orderInfo = 'Payment for booking') {
    const date = new Date();
    // Format: yyyyMMddHHmmss
    const createDate = 
      date.getFullYear().toString() +
      ('0' + (date.getMonth() + 1)).slice(-2) +
      ('0' + date.getDate()).slice(-2) +
      ('0' + date.getHours()).slice(-2) +
      ('0' + date.getMinutes()).slice(-2) +
      ('0' + date.getSeconds()).slice(-2);

    // Format: yyyyMMddHHmmss for expire (e.g. + 15 mins)
    const expireDateObj = new Date(date.getTime() + 15 * 60000);
    const expireDate = 
      expireDateObj.getFullYear().toString() +
      ('0' + (expireDateObj.getMonth() + 1)).slice(-2) +
      ('0' + expireDateObj.getDate()).slice(-2) +
      ('0' + expireDateObj.getHours()).slice(-2) +
      ('0' + expireDateObj.getMinutes()).slice(-2) +
      ('0' + expireDateObj.getSeconds()).slice(-2);

    const tmnCode = this.tmnCode;
    const secretKey = this.hashSecret;
    let vnpUrl = this.url;
    const returnUrl = this.returnUrl;
    
    // Convert to VNPay amount (multiply by 100)
    const vnpAmount = amount * 100;

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = bookingId;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = vnpAmount;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr || '127.0.0.1';
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDate;

    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex'); 
    vnp_Params['vnp_SecureHash'] = signed;

    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    return vnpUrl;
  }

  /**
   * Verifies the IPN or Return URL signature
   */
  verifySignature(vnp_Params) {
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    const signData = querystring.stringify(vnp_Params, { encode: false });
    
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');     

    return secureHash === signed;
  }

  isSuccess(vnp_Params) {
    return vnp_Params['vnp_ResponseCode'] === '00';
  }
}

module.exports = new VNPayProvider();
