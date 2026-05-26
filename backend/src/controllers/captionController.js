const logger = require('../utils/logger');

// Store recent captions for demo purposes
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

    // Store in history
    captionHistory.push({
      text,
      timestamp,
    });

    if (captionHistory.length > MAX_HISTORY) {
      captionHistory.shift();
    }

    // Log prominently to terminal
    logger.info(`\n📢 Caption #${captionHistory.length} [${time}]: ${text}\n`);

    // Process caption and generate response
    const response = generateResponse(text);

    logger.debug(`Response generated: ${response}`);

    res.json({
      success: true,
      caption: text,
      response: response,
      timestamp: timestamp,
      isSystemResponse: true,  // Flag to prevent re-capture in Teams DOM
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

// Simple response generation - can be extended with AI/ML
function generateResponse(caption) {
  // Avoid repetitive echoing - just acknowledge
  const responses = [
    "Understood",
    "Got it",
    "Thanks for that",
    "I hear you",
    "Message received",
    "Noted"
  ];
  
  // Pick a random response instead of echoing
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  return randomResponse;
}
