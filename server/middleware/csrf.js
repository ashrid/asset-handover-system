import { createModuleLogger } from '../services/logger.js';

const logger = createModuleLogger('csrf');

/**
 * CSRF Protection Middleware for SPA APIs
 *
 * For Single Page Applications using JSON APIs, traditional cookie-based
 * CSRF tokens aren't necessary. Instead, we use:
 * 1. CORS restrictions (already configured)
 * 2. Content-Type validation (JSON only for mutations)
 * 3. Origin/Referer header validation in production
 *
 * This provides protection against:
 * - Cross-site form submissions (Content-Type check)
 * - Requests from other origins (CORS + Origin check)
 */

const isProduction = process.env.NODE_ENV === 'production';

// Allowed origins (configure in production)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

/**
 * Validate Content-Type for state-changing requests
 * Prevents cross-site form submissions
 */
export const validateContentType = (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Skip for public signing/dispute endpoints (they have token-based auth)
  const publicPaths = ['/api/handover/sign/', '/api/handover/submit-signature/', '/api/handover/dispute/'];
  if (publicPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  const contentType = req.headers['content-type'];

  // Require JSON content type for mutations
  if (!contentType || !contentType.includes('application/json')) {
    logger.warn({
      path: req.path,
      method: req.method,
      contentType
    }, 'Invalid Content-Type for mutation request');

    return res.status(415).json({
      success: false,
      error: {
        message: 'Content-Type must be application/json',
        code: 'INVALID_CONTENT_TYPE'
      }
    });
  }

  next();
};

/**
 * Validate Origin header in production
 * Prevents requests from unauthorized domains
 */
export const validateOrigin = (req, res, next) => {
  // Skip in development
  if (!isProduction) {
    return next();
  }

  // Skip for GET, HEAD, OPTIONS
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Skip for public endpoints with token-based auth
  const publicPaths = ['/api/handover/sign/', '/api/handover/submit-signature/', '/api/handover/dispute/'];
  if (publicPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  const origin = req.headers.origin || req.headers.referer;

  if (!origin) {
    logger.warn({
      path: req.path,
      method: req.method
    }, 'Missing Origin header on mutation request');

    return res.status(403).json({
      success: false,
      error: {
        message: 'Origin header required',
        code: 'MISSING_ORIGIN'
      }
    });
  }

  // Check if origin is allowed
  const originUrl = new URL(origin);
  const originBase = `${originUrl.protocol}//${originUrl.host}`;

  if (!ALLOWED_ORIGINS.includes(originBase)) {
    logger.warn({
      path: req.path,
      method: req.method,
      origin: originBase
    }, 'Unauthorized origin');

    return res.status(403).json({
      success: false,
      error: {
        message: 'Unauthorized origin',
        code: 'UNAUTHORIZED_ORIGIN'
      }
    });
  }

  next();
};

/**
 * Combined CSRF protection middleware
 */
export const csrfProtection = [validateContentType, validateOrigin];

export default csrfProtection;
