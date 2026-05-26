const config = require('../config/config');

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const getCurrentLevel = () => logLevels[config.LOG_LEVEL] || 2;

module.exports = {
  error: (...args) => {
    if (logLevels.error <= getCurrentLevel()) {
      console.error(`[ERROR] ${new Date().toISOString()}:`, ...args);
    }
  },
  warn: (...args) => {
    if (logLevels.warn <= getCurrentLevel()) {
      console.warn(`[WARN] ${new Date().toISOString()}:`, ...args);
    }
  },
  info: (...args) => {
    if (logLevels.info <= getCurrentLevel()) {
      console.log(`[INFO] ${new Date().toISOString()}:`, ...args);
    }
  },
  debug: (...args) => {
    if (logLevels.debug <= getCurrentLevel()) {
      console.log(`[DEBUG] ${new Date().toISOString()}:`, ...args);
    }
  },
};
