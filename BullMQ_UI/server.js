require('dotenv').config();
const express = require('express');
const { createBullBoard } = require('@bull-board/api');
const { ExpressAdapter } = require('@bull-board/express');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { Queue } = require('bullmq');

const app = express();

/**
 * Build Redis connection options
 * Supports: local Redis, Upstash, or any Redis with REDIS_URL
 */
const buildRedisConnectionOptions = () => {
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl) {
    // For Upstash or any custom Redis URL
    return { url: redisUrl };
  }

  // Fallback to local Redis
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  };
};

/**
 * Initialize BullMQ queues with same config as backend
 */
const queueConfig = {
  connection: buildRedisConnectionOptions(),
};

const bookingEventsQueue = new Queue('booking-events', queueConfig);
const bookingExpirationQueue = new Queue('booking-expiration', queueConfig);
const emailQueue = new Queue('notification-email', queueConfig);

console.log(`🔌 Redis connection: ${process.env.REDIS_URL || `${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`}`);

/**
 * Setup BullBoard UI (current API: createBullBoard + ExpressAdapter)
 */
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullAdapter(bookingEventsQueue),
    new BullAdapter(bookingExpirationQueue),
    new BullAdapter(emailQueue),
  ],
  serverAdapter,
  uiConfig: {
    defaultLanguage: 'en',
    title: '📊 FieldNow - BullMQ Dashboard',
  },
});

app.use('/admin/queues', serverAdapter.getRouter());

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: process.env.REDIS_URL ? 'Upstash' : 'Local',
  });
});

/**
 * Root endpoint with info
 */
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>FieldNow - BullMQ Dashboard</title>
      <style>
        body { font-family: sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #022c22; }
        .link { display: inline-block; margin: 20px 0; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .link:hover { background: #059669; }
        .status { background: #f0fdf4; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 FieldNow - BullMQ Queue Dashboard</h1>
        <p>Real-time monitoring for background jobs (booking expiration, email notifications, etc.)</p>
        
        <div class="status">
          <strong>✅ Dashboard is running!</strong><br>
          Redis: <code>${process.env.REDIS_URL ? 'Upstash' : 'Local'}</code>
        </div>
        
        <a href="/admin/queues" class="link">📊 Open Dashboard</a>
        
        <h2>Queue Monitoring</h2>
        <ul>
          <li><strong>booking-events</strong> - Immediate post-booking tasks</li>
          <li><strong>booking-expiration</strong> - Delayed jobs to cancel unpaid bookings (15min)</li>
          <li><strong>notification-email</strong> - Email notifications (OTP, booking confirmations, cancellations)</li>
        </ul>
        
        <h2>Features</h2>
        <ul>
          <li>View pending, active, completed, and failed jobs</li>
          <li>Inspect job details and execution logs</li>
          <li>Retry failed jobs</li>
          <li>Delete jobs</li>
          <li>Real-time updates</li>
        </ul>
        
        <h2>API</h2>
        <ul>
          <li><code>GET /health</code> - Health check</li>
          <li><code>GET /admin/queues</code> - Dashboard</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

/**
 * Start server
 */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n✨ BullMQ Dashboard running at http://localhost:${PORT}`);
  console.log(`📊 Open dashboard: http://localhost:${PORT}/admin/queues\n`);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Closing connections...');
  await bookingEventsQueue.close();
  await bookingExpirationQueue.close();
  await emailQueue.close();
  process.exit(0);
});
