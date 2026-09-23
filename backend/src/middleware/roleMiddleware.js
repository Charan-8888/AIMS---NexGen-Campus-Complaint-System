const { sendError } = require('../utils/apiResponse');

/**
 * Restrict access to specific roles.
 * Usage: router.get('/admin-only', authenticate, authorize('ADMIN'), handler)
 *        router.get('/multi-role', authenticate, authorize('ADMIN', 'MANAGER'), handler)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

/**
 * Alias shortcuts for common role checks.
 */
const isAdmin = authorize('ADMIN');
const isAdminOrManager = authorize('ADMIN', 'MANAGER');
const isStaff = authorize('ADMIN', 'MANAGER', 'STAFF');
const isAuthenticated = authorize('ADMIN', 'MANAGER', 'STAFF', 'USER');

/**
 * Allow access only if the requesting user owns the resource OR is an admin.
 * Checks req.params.userId or a custom field.
 */
const isOwnerOrAdmin = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const targetId = req.params[userIdField] || req.body[userIdField];

    if (req.user.role === 'ADMIN' || req.user._id.toString() === targetId) {
      return next();
    }

    return sendError(res, 'You can only access your own resources', 403);
  };
};

module.exports = { authorize, isAdmin, isAdminOrManager, isStaff, isAuthenticated, isOwnerOrAdmin };
