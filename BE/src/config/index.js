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
  refreshTokenTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS, 10) || 30,
  refreshTokenMaxPerUser: parseInt(process.env.REFRESH_TOKEN_MAX_PER_USER, 10) || 5,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || null, // null = allow all in dev
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: process.env.SUPABASE_STORAGE_BUCKET || 'field-images',
  },
  paymentProvider: process.env.PAYMENT_PROVIDER || 'sepay',
  ai: {
    groqApiKey: process.env.GROQ_API_KEY || null,
    groqBaseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    modelName: process.env.AI_MODEL_NAME || 'llama-3.1-8b-instant',
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.2'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS, 10) || 1024,
    timeoutMs: parseInt(process.env.GROQ_TIMEOUT_MS, 10) || 15000,
    maxContextDocs: parseInt(process.env.CHATBOT_MAX_CONTEXT_DOCS, 10) || 5,
  },
};

module.exports = config;
