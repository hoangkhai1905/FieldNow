const express = require('express');
const chatbotController = require('../controllers/chatbot.controller');
const { optionalAuthMiddleware } = require('../middlewares/auth.middleware');
const { chatbotLimiter } = require('../middlewares/rate-limit.middleware');

const router = express.Router();

router.post('/message', optionalAuthMiddleware, chatbotLimiter, chatbotController.sendMessage);

module.exports = router;
