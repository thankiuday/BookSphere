const jwt = require('jsonwebtoken');
const Author = require('../models/Author');
const { config } = require('../config/env');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const author = await Author.findById(decoded.authorId).select('-passwordHash');
    
    if (!author) {
      return res.status(401).json({ 
        error: 'Invalid token. Author not found.' 
      });
    }

    req.author = author;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired.' 
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Internal server error during authentication.' 
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      const author = await Author.findById(decoded.authorId).select('-passwordHash');
      
      if (author) {
        req.author = author;
        req.token = token;
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we just continue without setting req.author
    next();
  }
};

module.exports = { auth, optionalAuth };
