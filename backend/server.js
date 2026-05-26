require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./src/config/config');
const logger = require('./src/utils/logger');
const authMiddleware = require('./src/middleware/auth');
const captionRoutes = require('./src/routes/captionRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API key authentication
app.use(authMiddleware);

// Routes
app.use('/api/caption', captionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
const PORT = config.PORT;
const server = app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
    // Try alternate port (3000+100 = 3100)
    const altPort = 3100;
    const altServer = app.listen(altPort, () => {
      logger.info(`Server running on http://localhost:${altPort} (alternate)`);
    });
  } else {
    logger.error('Server error:', err);
  }
});
