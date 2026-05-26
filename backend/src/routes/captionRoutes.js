const express = require('express');
const router = express.Router();
const captionController = require('../controllers/captionController');

// POST: Send caption
router.post('/', captionController.procesCaption);

// GET: Retrieve caption history
router.get('/history', captionController.getHistory);

// DELETE: Clear history
router.delete('/history', captionController.clearHistory);

module.exports = router;
