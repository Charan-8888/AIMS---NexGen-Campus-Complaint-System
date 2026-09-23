const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/environment');
const { sendError } = require('../utils/apiResponse');

/**
 * Verify JWT and attach user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Get user from DB (exclude password)
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return sendError(res, 'User not found. Token may be invalid.', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Your account has been deactivated. Please contact admin.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired. Please log in again.', 401);
    }
    next(error);
  }
};

/**
 * Optional auth — attach user if token present, but don't block if missing.
 */
const optionalAuth = async (req, res, next) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch {
    next(); // Silently ignore auth errors for optional routes
  }
};

module.exports = { authenticate, optionalAuth };
