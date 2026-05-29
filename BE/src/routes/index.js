const authRoutes = require('../modules/auth/auth.routes');
const otpRoutes = require('../modules/otp/otp.routes');
const passwordRoutes = require('../modules/password/password.routes');
const userRoutes = require('../modules/users/user.routes');
const ownerRoutes = require('../modules/owners/owner.routes');
const fieldRoutes = require('../modules/fields/field.routes');
const adminRoutes = require('../modules/admins/admin.routes');
const bookingRoutes = require('../modules/bookings/booking.routes');
const paymentRoutes = require('../modules/payments/payment.routes');
const uploadRoutes = require('../modules/upload/upload.routes');
const chatbotRoutes = require('../modules/chatbot/chatbot.routes');

const registerRoutes = (app) => {
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/otp', otpRoutes);
  app.use('/api/v1/password', passwordRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/owner', ownerRoutes);
  app.use('/api/v1', fieldRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/bookings', bookingRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/upload', uploadRoutes);
  app.use('/api/v1/chatbot', chatbotRoutes);
};

module.exports = registerRoutes;
