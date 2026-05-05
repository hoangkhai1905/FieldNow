/**
 * Direct email test script — sends a test email without queue
 * Usage: node test-email-direct.js
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

const testEmail = async () => {
  const provider = (process.env.EMAIL_PROVIDER || 'ethereal').toLowerCase();
  let transporter;

  console.log(`[Test Email] Using provider: ${provider}`);

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

    console.log(`[Test Email] SMTP config:`);
    console.log(`  - Host: ${process.env.SMTP_HOST}`);
    console.log(`  - Port: ${process.env.SMTP_PORT}`);
    console.log(`  - Secure: ${process.env.SMTP_SECURE}`);
    console.log(`  - User: ${process.env.SMTP_USER}`);
  } else if (provider === 'sendgrid') {
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

    console.log('[Test Email] SendGrid SMTP config ready');
  } else {
    // ethereal
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log(`[Test Email] Ethereal test account created:`);
    console.log(`  - User: ${testAccount.user}`);
  }

  // Test connection
  console.log('[Test Email] Verifying SMTP connection...');
  await transporter.verify();
  console.log('[Test Email] SMTP connection verified!');

  // Send test email
  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.SMTP_USER || '"FieldNow System" <noreply@fieldnow.dev>',
    to: 'nhoangkhai195@gmail.com',
    subject: 'FieldNow Test Email',
    text: 'This is a test email from FieldNow. If you received this, email sending is working correctly!',
    html: `
      <h2>FieldNow Test Email</h2>
      <p>This is a test email from FieldNow.</p>
      <p>If you received this, email sending is working correctly!</p>
      <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
    `,
  };

  console.log('[Test Email] Sending email...');
  console.log(`  - From: ${mailOptions.from}`);
  console.log(`  - To: ${mailOptions.to}`);
  console.log(`  - Subject: ${mailOptions.subject}`);

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Test Email] ✓ Email sent successfully!');
    console.log(`  - Message ID: ${info.messageId}`);
    console.log(`  - Response: ${info.response}`);

    // If ethereal, show preview URL
    try {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) {
        console.log(`  - Preview URL: ${preview}`);
      }
    } catch (err) {
      // Not ethereal, no preview URL
    }

    process.exit(0);
  } catch (error) {
    console.error('[Test Email] ✗ Failed to send email:');
    console.error(error.message);
    process.exit(1);
  }
};

testEmail().catch((err) => {
  console.error('[Test Email] Error:', err.message);
  process.exit(1);
});
