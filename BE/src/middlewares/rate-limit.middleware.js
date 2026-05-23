const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;

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

const createEmailLimiter = ({ windowMs, max, message }) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      if (req.user && req.user.userId) return `user:${req.user.userId}`;
      if (req.body && req.body.email) return `email:${String(req.body.email).toLowerCase()}`;
      return ipKeyGenerator(req);
    },
    message,
  });
};

const otpLimiter = createEmailLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many OTP requests. Please try again later.',
    },
  },
});

const passwordResetLimiter = createEmailLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many password reset requests. Please try again later.',
    },
  },
});

const passwordChangeLimiter = createEmailLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many password change requests. Please try again later.',
    },
  },
});

const chatbotLimiter = createEmailLimiter({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many chatbot requests. Please try again after a minute.',
    },
  },
});

module.exports = {
  publicSearchLimiter,
  otpLimiter,
  passwordResetLimiter,
  passwordChangeLimiter,
  chatbotLimiter,
};
