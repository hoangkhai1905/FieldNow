const { Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const { defaultQueueOptions } = require('../infrastructure/queue');
const { logger } = require('../infrastructure/logger');
const prisma = require('../infrastructure/prisma');

// Lazy initialization of transporter
let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  const provider = (process.env.EMAIL_PROVIDER || 'ethereal').toLowerCase();

  if (provider === 'smtp') {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP provider selected but SMTP_HOST/SMTP_USER/SMTP_PASS not set');
    }

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    logger.info('[Email Worker] Using SMTP transporter');
    return transporter;
  }

  if (provider === 'sendgrid') {
    // Use SendGrid SMTP relay. Requires SENDGRID_API_KEY set.
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is required when EMAIL_PROVIDER=sendgrid');
    }

    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });

    logger.info('[Email Worker] Using SendGrid SMTP transporter');
    return transporter;
  }

  // Default: ethereal for development/testing
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  logger.info('[Email Worker] Using Ethereal test transporter');
  return transporter;
};

const processEmailJob = async (job) => {
  const { name, data } = job;
  const { userId, bookingId } = data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    logger.warn(`[Email Worker] User ${userId} not found, skipping email.`);
    return;
  }

  const transport = await getTransporter();

  let subject = '';
  let text = '';
  let htmlBody = '';

  const createHtmlEmail = (title, content, actionBtn = null) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #334155; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .header { background-color: #022c22; padding: 32px 40px; text-align: center; border-bottom: 4px solid #F59E0B; }
        .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: -1px; }
        .header span { color: #F59E0B; }
        .content { padding: 40px; line-height: 1.6; font-size: 16px; }
        .content h2 { color: #0f172a; font-size: 20px; font-weight: 800; margin-top: 0; }
        .otp-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #10b981; margin: 0; }
        .btn { display: inline-block; background-color: #F59E0B; color: #000000; font-weight: 800; text-decoration: none; padding: 16px 32px; border-radius: 12px; margin-top: 24px; }
        .footer { background-color: #f8fafc; padding: 24px 40px; text-align: center; color: #94a3b8; font-size: 13px; border-top: 1px solid #e2e8f0; }
        .highlight { color: #10b981; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FIELD<span>NOW</span></h1>
        </div>
        <div class="content">
          ${content}
          ${actionBtn ? `<div style="text-align: center;">${actionBtn}</div>` : ''}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} FieldNow. Hệ thống quản lý và đặt sân bóng đá hiện đại nhất.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const fullName = user.full_name || 'Cầu thủ';

  switch (name) {
    case 'email.booking_created':
      subject = 'FieldNow - Đơn đặt sân của bạn đang chờ thanh toán';
      text = `Hi ${fullName},\n\nYour booking (${bookingId}) has been created. Please complete payment within 15 minutes to confirm.`;
      htmlBody = createHtmlEmail(
        'Đơn đặt sân đang chờ thanh toán',
        `<h2>Xin chào ${fullName},</h2>
         <p>Đơn đặt sân của bạn (Mã: <strong>${bookingId}</strong>) đã được tạo thành công trên hệ thống FieldNow.</p>
         <p>Vui lòng hoàn tất thanh toán trong vòng <span class="highlight">15 phút</span> để giữ sân. Sau thời gian này, hệ thống sẽ tự động hủy đơn đặt của bạn.</p>`,
        `<a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/nguoi-dung/dat-san-cua-toi" class="btn">Thanh Toán Ngay</a>`
      );
      break;
    case 'email.booking_confirmed':
      subject = 'FieldNow - Đặt sân thành công!';
      text = `Hi ${fullName},\n\nYour booking (${bookingId}) is confirmed!`;
      htmlBody = createHtmlEmail(
        'Đặt sân thành công!',
        `<h2>Xin chào ${fullName},</h2>
         <p>Tuyệt vời! Đơn đặt sân của bạn (Mã: <strong>${bookingId}</strong>) đã được thanh toán và <span class="highlight">xác nhận thành công</span>.</p>
         <p>Hãy chuẩn bị sẵn sàng cho trận đấu sắp tới. Chúc bạn có những giây phút thể thao bùng nổ!</p>`,
        `<a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/nguoi-dung/dat-san-cua-toi" class="btn">Xem Lịch Đặt</a>`
      );
      break;
    case 'email.booking_cancelled':
      subject = 'FieldNow - Hủy đơn đặt sân';
      text = `Hi ${fullName},\n\nYour booking (${bookingId}) has been cancelled. Reason: ${data.reason || 'User requested or timeout'}.`;
      htmlBody = createHtmlEmail(
        'Đơn đặt sân đã bị hủy',
        `<h2>Xin chào ${fullName},</h2>
         <p>Đơn đặt sân của bạn (Mã: <strong>${bookingId}</strong>) đã bị hủy.</p>
         <p><strong>Lý do:</strong> ${data.reason || 'Hết thời gian thanh toán / Người dùng yêu cầu hủy'}</p>
         <p>Hẹn gặp lại bạn ở những trận đấu tiếp theo cùng FieldNow.</p>`,
        `<a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="btn">Đặt Sân Mới</a>`
      );
      break;
    case 'email.otp_sent':
      subject = 'FieldNow - Mã OTP Xác Thực Tài Khoản';
      text = `Hi ${fullName},\n\nYour OTP is: ${data.otpCode}`;
      htmlBody = createHtmlEmail(
        'Xác Thực Tài Khoản',
        `<h2>Xin chào ${fullName},</h2>
         <p>Bạn vừa đăng ký tài khoản hoặc yêu cầu xác thực email trên hệ thống FieldNow. Vui lòng nhập mã OTP dưới đây để hoàn tất:</p>
         <div class="otp-box"><p class="otp-code">${data.otpCode}</p></div>
         <p>Mã này sẽ hết hạn sau <span class="highlight">10 phút</span>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>`
      );
      break;
    case 'email.password_reset_otp':
      subject = 'FieldNow - Yêu Cầu Khôi Phục Mật Khẩu';
      text = `Hi ${fullName},\n\nYour password reset OTP is: ${data.otpCode}`;
      htmlBody = createHtmlEmail(
        'Khôi Phục Mật Khẩu',
        `<h2>Xin chào ${fullName},</h2>
         <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Đây là mã xác nhận của bạn:</p>
         <div class="otp-box"><p class="otp-code">${data.otpCode}</p></div>
         <p>Mã này sẽ hết hạn sau <span class="highlight">10 phút</span>.</p>
         <p>Nếu bạn không thực hiện yêu cầu này, có thể ai đó đang cố truy cập tài khoản của bạn. Vui lòng bảo mật thông tin cẩn thận.</p>`
      );
      break;
    case 'email.change_password_otp':
      subject = 'FieldNow - Yêu Cầu Đổi Mật Khẩu';
      text = `Hi ${fullName},\n\nYour change password OTP is: ${data.otpCode}`;
      htmlBody = createHtmlEmail(
        'Xác Nhận Đổi Mật Khẩu',
        `<h2>Xin chào ${fullName},</h2>
         <p>Bạn đang thực hiện thao tác đổi mật khẩu tài khoản. Vui lòng sử dụng mã OTP dưới đây để xác nhận:</p>
         <div class="otp-box"><p class="otp-code">${data.otpCode}</p></div>
         <p>Mã này sẽ hết hạn sau <span class="highlight">10 phút</span>. Nếu không phải bạn đang thực hiện đổi mật khẩu, vui lòng liên hệ ngay với ban quản trị.</p>`
      );
      break;
    default:
      logger.warn(`[Email Worker] Unknown email job name: ${name}`);
      return;
  }

  const mailOptions = {
    from: process.env.MAIL_FROM || '"FieldNow System" <noreply@fieldnow.dev>',
    to: user.email,
    subject,
    text,
    html: htmlBody,
  };

  const info = await transport.sendMail(mailOptions);

  logger.info(`[Email Worker] Email sent: ${info.messageId}`);

  try {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) logger.info(`[Email Worker] Preview URL: ${preview}`);
  } catch (err) {
    // getTestMessageUrl throws if not ethereal; ignore
  }
};

const emailWorker = new Worker(
  'notification-email',
  processEmailJob,
  defaultQueueOptions
);

emailWorker.on('completed', (job) => {
  logger.info(`[Email Worker] Job ${job.id} completed.`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`[Email Worker] Job ${job.id} failed:`, err);
});

module.exports = {
  emailWorker,
  processEmailJob,
};
