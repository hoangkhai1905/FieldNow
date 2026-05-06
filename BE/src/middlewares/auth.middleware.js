const jwt = require('jsonwebtoken');
const config = require('../config');
const userRepository = require('../repositories/user.repository');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing or malformed token' },
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await userRepository.findById(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Account is deactivated' },
      });
    }

    req.user = decoded; // Contains userId, role, email
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    });
  }
};

module.exports = { authMiddleware };