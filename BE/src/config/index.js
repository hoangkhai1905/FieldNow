require('dotenv').config();

/**
 * Centralized configuration loader.
 * Validates all required environment variables at startup.
 * Crashes early with a clear message if any are missing.
 */

const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];

const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `[FATAL] Missing required environment variables: ${missing.join(', ')}`
  );
  console.error('Check your .env file or environment configuration.');
  process.exit(1);
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  nodeEnv: process.env.NODE_ENV || 'development',
};

module.exports = config;