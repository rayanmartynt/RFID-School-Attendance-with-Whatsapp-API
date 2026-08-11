const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.error('Token verification failed', { error: err.message });
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const authenticateDevice = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // Verify API key against database
  // This is a simplified version - in production, verify against devices table
  if (!apiKey.startsWith('gate') && !apiKey.includes('_api_key')) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  req.device = { apiKey };
  next();
};

module.exports = {
  authenticateToken,
  authenticateDevice
};
