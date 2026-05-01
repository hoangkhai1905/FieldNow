const { expirationWorker } = require('./expiration.worker');
const { emailWorker } = require('./email.worker');
const { startCleanupCron } = require('./cleanup.cron');
const { logger } = require('../infrastructure/logger');

const startWorkers = () => {
  logger.info('[Workers] Starting BullMQ workers...');
  // Workers are automatically started when instantiated
  startCleanupCron();
};

module.exports = {
  startWorkers,
  expirationWorker,
  emailWorker,
  startCleanupCron,
};
