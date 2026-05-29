const chatbotService = require('./chatbot.service');

const sendMessage = async (req, res, next) => {
  try {
    const result = await chatbotService.handleMessage({
      message: req.body?.message,
      user: req.user,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage };
