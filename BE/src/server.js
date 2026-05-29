const config = require('./config/index');
const app = require('./app');
const { startWorkers, expirationWorker, emailWorker } = require('./jobs/index');
const registerBookingListeners = require('./modules/bookings/booking.listener');
const prisma = require('./infrastructure/prisma');
const { redisClient } = require('./infrastructure/redis');
const { logger } = require('./infrastructure/logger');

const PORT = config.port;

startWorkers();
registerBookingListeners();

const server = app.listen(PORT, () => {
  logger.info(`[FieldNow] Server running on port ${PORT} (${config.nodeEnv})`);
  console.log(`[FieldNow] API base: http://localhost:${PORT}/api/v1`);
  console.log(`[FieldNow] Health: http://localhost:${PORT}/health`);
  if (config.nodeEnv !== 'production') {
    console.log(`[FieldNow] API Docs: http://localhost:${PORT}/api-docs`);
  }
});

// --- Graceful Shutdown ---
const gracefulShutdown = async (signal) => {
  logger.info(`\n[${signal}] Starting graceful shutdown...`);
  
  try {
    // 1. Stop accepting new connections
    server.close(() => {
      logger.info('[Server] HTTP server closed');
    });

    // 2. Stop workers
    logger.info('[Workers] Closing background workers...');
    await Promise.all([
      expirationWorker.close(),
      emailWorker.close(),
    ]);

    // 3. Disconnect from DB
    await prisma.$disconnect();
    logger.info('[Prisma] Database connection closed');

    // 4. Disconnect from Redis
    await redisClient.quit();
    logger.info('[Redis] Connection closed');

    logger.info('[Shutdown] Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, '[Shutdown] Error during graceful shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
