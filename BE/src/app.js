const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());

// --- Routes ---
app.use('/api/auth', authRoutes);

// --- Health check ---
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'OK', timestamp: new Date() } });
});

// --- Global error handler (must be registered last) ---
app.use(errorHandler);

module.exports = app;