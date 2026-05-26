module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  API_KEY: process.env.API_KEY || 'localSecretKey',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
