const express = require('express');
const chatbotController = require('../controllers/chatbot.controller');
const { optionalAuthMiddleware } = require('../middlewares/auth.middleware');
const { chatbotLimiter } = require('../middlewares/rate-limit.middleware');

const router = express.Router();

router.post('/message', chatbotLimiter, optionalAuthMiddleware, chatbotController.sendMessage);

module.exports = router;
