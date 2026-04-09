const { verifyToken } = require('../utils/jwtHelper');
const logger = require('../config/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    logger.warn('Token is missing / not provided.', { path: req.path });
    return res.status(401).json({ 
      error: 'Access denied', 
      message: 'Token is missing / not provided.' 
    });
  }
  
  const { valid, expired, decoded } = verifyToken(token);
  
  if (!valid) {
    if (expired) {
      return res.status(401).json({ 
        error: 'Token expired', 
        message: 'Please refresh your token or provide a valid token.' 
      });
    }
    
    return res.status(403).json({ 
      error: 'Invalid token', 
      message: 'Token verification failed.' 
    });
  }
  
  req.user = decoded;
  next();
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn(`User ${req.user.userId} attempted unauthorized access.`, {
        role: req.user.role,
        requiredRoles: roles,
      });
      
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Insufficient permissions.' 
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};