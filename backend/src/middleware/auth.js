const config = require('../config/config');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  // Skip auth for health check
  if (req.path === '/health') {
    return next();
  }

  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    logger.warn('Request without API key');
    return res.status(401).json({ error: 'Missing API key' });
  }

  if (apiKey !== config.API_KEY) {
    logger.warn(`Invalid API key attempt: ${apiKey}`);
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
};
