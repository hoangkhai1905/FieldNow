const crypto = require('crypto');
const { redisClient } = require('../infrastructure/redis');

const cacheService = {
  async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (_error) {
      return null;
    }
  },

  async set(key, value, ttlSeconds = 300) {
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (_error) {
      // Intentionally ignore cache write errors
    }
  },

  async invalidate(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length) {
        await redisClient.del(...keys);
      }
    } catch (_error) {
      // Intentionally ignore cache invalidate errors
    }
  },

  hashKey(prefix, params) {
    const hash = crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
    return `${prefix}:${hash}`;
  },
};

module.exports = cacheService;
