const Redis = require('ioredis');
const config = require('../config');

// Shared redis options for BullMQ compatibility
const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

const redisClient = new Redis(config.redisUrl, redisOptions);

redisClient.on('connect', () => {
  console.log('[Redis] Connecting...');
});

redisClient.on('ready', () => {
  console.log('[Redis] Connection established');
});

redisClient.on('error', (err) => {
  console.error('[Redis] Error occurred', err);
});

// A factory to create new connections if needed for blocking operations (like workers)
const createRedisClient = () => new Redis(config.redisUrl, redisOptions);

module.exports = {
  redisClient,
  createRedisClient,
  redisOptions,
};