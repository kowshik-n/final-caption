const logger = require('../utils/logger');

let captionHistory = [];
const MAX_HISTORY = 100;

exports.procesCaption = (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Caption text is required' });
    }

    const timestamp = new Date().toISOString();
    const time = new Date(timestamp).toLocaleTimeString();

    captionHistory.push({ text, timestamp });

    if (captionHistory.length > MAX_HISTORY) {
      captionHistory.shift();
    }

    logger.info(`\n📢 Caption #${captionHistory.length} [${time}]: ${text}\n`);

    const response = generateResponse(text);

    res.json({
      success: true,
      caption: text,
      response: response,
      timestamp: timestamp,
      isSystemResponse: true,
    });
  } catch (error) {
    logger.error('Error processing caption:', error.message);
    res.status(500).json({ error: 'Failed to process caption' });
  }
};

exports.getHistory = (req, res) => {
  res.json({
    total: captionHistory.length,
    captions: captionHistory,
  });
};

exports.clearHistory = (req, res) => {
  captionHistory = [];
  res.json({ success: true, message: 'History cleared' });
};

function generateResponse(caption) {
  const responses = [
    "Understood",
    "Got it",
    "Thanks for that",
    "I hear you",
    "Message received",
    "Noted"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}
