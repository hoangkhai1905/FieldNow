const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware for public search endpoints.
 */
const publicSearchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many search requests from this IP, please try again after a minute',
    },
  },
});

module.exports = {
  publicSearchLimiter,
};
