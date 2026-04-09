const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const generateToken = (userId, role = 'user') => {
  const payload = {
    userId,
    role,
    aud: 'aggregation-service',
    iss: 'auth-service'
  };

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required. Set it in .env file.');
  }
 
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    algorithm: 'HS256'
  });
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      aud: 'aggregation-service',
      iss: 'auth-service'
    });
    return { valid: true, expired: false, decoded };
  } catch (error) {
    logger.error('Token verification failed:', error.message);
    return {
      valid: false,
      expired: error.name === 'TokenExpiredError',
      decoded: null,
    };
  }
};

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Token decode failed:', error.message);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};