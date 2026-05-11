const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const pinoHttp = require('pino-http');
const config = require('./config');
const swaggerSpec = require('./config/swagger');
const swaggerUi = require('swagger-ui-express');
const authRoutes = require('./routes/auth.routes');
const otpRoutes = require('./routes/otp.routes');
const passwordRoutes = require('./routes/password.routes');
const userRoutes = require('./routes/user.routes');
const ownerRoutes = require('./routes/owner.routes');
const publicRoutes = require('./routes/public.routes');
const adminRoutes = require('./routes/admin.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const uploadRoutes = require('./routes/upload.routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// --- Security headers ---
app.use(helmet());

// --- CORS (environment-aware) ---
const corsOptions = {
  origin: config.corsOrigin
    ? config.corsOrigin.split(',').map((o) => o.trim())
    : '*',
  credentials: true,
};
app.use(cors(corsOptions));

// --- Response compression ---
app.use(compression());

// --- Body parsing ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- Structured logging (pino-http) ---
app.use(
  pinoHttp({
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    transport:
      config.nodeEnv !== 'production'
        ? { target: 'pino/file', options: { destination: 1 } }
        : undefined,
    genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  })
);

// --- API Documentation (dev only) ---
if (config.nodeEnv !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'FieldNow API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  }));
  // Raw JSON spec endpoint
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// --- Routes (API v1) ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/otp', otpRoutes);
app.use('/api/v1/password', passwordRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/owner', ownerRoutes);
app.use('/api/v1', publicRoutes); // Public fields routes
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/upload', uploadRoutes);

// --- Health check ---
app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, data: { status: 'OK', timestamp: new Date() } });
});

const { redisClient } = require('./infrastructure/redis');
const prisma = require('./infrastructure/prisma');

app.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redisClient.ping();
    res.status(200).json({ success: true, data: { status: 'READY', db: 'OK', redis: 'OK' } });
  } catch (error) {
    res.status(503).json({ success: false, data: { status: 'UNAVAILABLE', error: error.message } });
  }
});

// --- Global error handler (must be registered last) ---
app.use(errorHandler);

module.exports = app;