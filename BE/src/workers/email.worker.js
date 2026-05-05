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

  switch (name) {
    case 'email.booking_created':
      subject = 'Your Booking is Pending';
      text = `Hi ${user.full_name || 'User'},\n\nYour booking (${bookingId}) has been created. Please complete payment within 15 minutes to confirm.`;
      break;
    case 'email.booking_confirmed':
      subject = 'Booking Confirmed!';
      text = `Hi ${user.full_name || 'User'},\n\nYour booking (${bookingId}) is confirmed!`;
      break;
    case 'email.booking_cancelled':
      subject = 'Booking Cancelled';
      text = `Hi ${user.full_name || 'User'},\n\nYour booking (${bookingId}) has been cancelled. Reason: ${data.reason || 'User requested or timeout'}.`;
      break;
    case 'email.otp_sent':
      subject = 'Your OTP for Email Verification';
      text = `Hi ${user.full_name || 'User'},\n\nYour One-Time Password (OTP) is: ${data.otpCode}\n\nThis code will expire in 10 minutes. Do not share this code with anyone.\n\nIf you didn't request this, please ignore this email.`;
      break;
    case 'email.password_reset_otp':
      subject = 'Password Reset Request';
      text = `Hi ${user.full_name || 'User'},\n\nWe received a request to reset your password. Your One-Time Password (OTP) is: ${data.otpCode}\n\nThis code will expire in 10 minutes. Do not share this code with anyone.\n\nIf you didn't request a password reset, please ignore this email.`;
      break;
    case 'email.change_password_otp':
      subject = 'Verify Password Change';
      text = `Hi ${user.full_name || 'User'},\n\nYou requested to change your password. Your One-Time Password (OTP) is: ${data.otpCode}\n\nThis code will expire in 10 minutes. Do not share this code with anyone.\n\nIf you didn't request this, please ignore this email.`;
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
