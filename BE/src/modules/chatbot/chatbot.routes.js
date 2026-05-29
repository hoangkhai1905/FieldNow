const express = require('express');
const chatbotController = require('./chatbot.controller');
const { optionalAuthMiddleware } = require('../../common/middlewares/auth.middleware');
const { chatbotLimiter } = require('../../common/middlewares/rate-limit.middleware');

const router = express.Router();

router.post('/message', optionalAuthMiddleware, chatbotLimiter, chatbotController.sendMessage);

module.exports = router;
