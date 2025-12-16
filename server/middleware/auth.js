import { verifyAccessToken } from '../services/tokenService.js';
import { createModuleLogger } from '../services/logger.js';

const logger = createModuleLogger('auth-middleware');

/**
 * Middleware to authenticate JWT access token
 * Attaches decoded user info to req.user
 * Returns 401 if no token or invalid token
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }
    });
  }

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      }
    });
  }

  // Attach user info to request
  req.user = decoded;
  next();
};

/**
 * Middleware factory to require specific role(s)
 * Must be used AFTER authenticateToken middleware
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn({
        userId: req.user.userId,
        role: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path
      }, 'Access denied - insufficient permissions');

      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'ACCESS_DENIED'
        }
      });
    }

    next();
  };
};

/**
 * Middleware for optional authentication
 * Attaches user info if token is present and valid, but doesn't require it
 * Useful for endpoints that behave differently for authenticated users
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyAccessToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
};

/**
 * Convenience middleware combinations
 */

// Require admin role
export const requireAdmin = [authenticateToken, requireRole('admin')];

// Require staff or admin role
export const requireStaff = [authenticateToken, requireRole('admin', 'staff')];

// Require any authenticated user
export const requireAuth = [authenticateToken];

export default {
  authenticateToken,
  requireRole,
  optionalAuth,
  requireAdmin,
  requireStaff,
  requireAuth
};
