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

const parseOptionalCredential = (value) => {
  if (!value) {
    return undefined;
  }

  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return value;
  }
};

const buildRedisConnectionOptions = (redisUrl = config.redisUrl) => {
  const parsedUrl = new URL(redisUrl);
  const connectionOptions = {
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port) || 6379,
    ...redisOptions,
  };

  const username = parseOptionalCredential(parsedUrl.username);
  const password = parseOptionalCredential(parsedUrl.password);
  const db = Number(parsedUrl.pathname.replace('/', ''));

  if (username) {
    connectionOptions.username = username;
  }

  if (password) {
    connectionOptions.password = password;
  }

  if (Number.isInteger(db) && db >= 0) {
    connectionOptions.db = db;
  }

  if (parsedUrl.protocol === 'rediss:') {
    connectionOptions.tls = {
      servername: parsedUrl.hostname,
    };
  }

  return connectionOptions;
};

const redisClient = new Redis(buildRedisConnectionOptions());

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
const createRedisClient = () => new Redis(buildRedisConnectionOptions());

module.exports = {
  redisClient,
  createRedisClient,
  buildRedisConnectionOptions,
  redisOptions,
};
