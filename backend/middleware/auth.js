const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Professional = require('../models/Professional');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      if (decoded.role === 'PROFESSIONAL') {
        req.user = await Professional.findById(decoded.id).select('-password');
        if (req.user) {
          req.user.role = 'PROFESSIONAL';
        }
      } else {
        req.user = await User.findById(decoded.id).select('-password');
        if (req.user) {
          req.user.role = decoded.role || 'USER';
        }
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin only access
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// Professional only access (must be approved)
const professionalOnly = (req, res, next) => {
  if (req.user && req.user.role === 'PROFESSIONAL') {
    if (req.user.status === 'APPROVED' && req.user.isValidated) {
      next();
    } else {
      res.status(403).json({ 
        message: 'Access denied. Your account is pending approval.',
        status: req.user.status
      });
    }
  } else {
    res.status(403).json({ message: 'Access denied. Professional only.' });
  }
};

// User only access
const userOnly = (req, res, next) => {
  if (req.user && req.user.role === 'USER') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. User only.' });
  }
};

// Check if user is active
const activeOnly = (req, res, next) => {
  if (req.user && req.user.isActive) {
    next();
  } else {
    res.status(403).json({ message: 'Account is inactive. Please contact support.' });
  }
};

module.exports = {
  protect,
  adminOnly,
  professionalOnly,
  userOnly,
  activeOnly
};
