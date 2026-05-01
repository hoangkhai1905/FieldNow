const { Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const { defaultQueueOptions } = require('../infrastructure/queue');
const { logger } = require('../infrastructure/logger');
const prisma = require('../infrastructure/prisma');

// Lazy initialization of transporter
let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  // Setup ethereal email for testing
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
    default:
      logger.warn(`[Email Worker] Unknown email job name: ${name}`);
      return;
  }

  const info = await transport.sendMail({
    from: '"FieldNow System" <noreply@fieldnow.dev>',
    to: user.email,
    subject,
    text,
  });

  logger.info(`[Email Worker] Email sent: ${info.messageId}`);
  logger.info(`[Email Worker] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
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
