const config = require('../config');
const { AppError } = require('../utils/errors');

const createTimeoutSignal = (timeoutMs) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
};

const createChatCompletion = async ({ messages, responseFormat }) => {
  if (!config.ai.groqApiKey) {
    throw new AppError(
      'AI_NOT_CONFIGURED',
      'Groq API key is not configured. Set GROQ_API_KEY before using chatbot.',
      503
    );
  }

  const timeout = createTimeoutSignal(config.ai.timeoutMs);

  try {
    const response = await fetch(`${config.ai.groqBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.ai.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.ai.modelName,
        messages,
        temperature: config.ai.temperature,
        max_tokens: config.ai.maxTokens,
        ...(responseFormat ? { response_format: responseFormat } : {}),
      }),
      signal: timeout.signal,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new AppError(
        'AI_PROVIDER_ERROR',
        payload?.error?.message || 'Groq chatbot request failed',
        response.status >= 500 ? 502 : response.status
      );
    }

    return payload?.choices?.[0]?.message?.content || '';
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new AppError('AI_TIMEOUT', 'Chatbot request timed out. Please try again.', 504);
    }
    if (error instanceof AppError) throw error;
    throw new AppError('AI_PROVIDER_ERROR', 'Unable to reach Groq chatbot provider.', 502);
  } finally {
    timeout.clear();
  }
};

module.exports = { createChatCompletion };
