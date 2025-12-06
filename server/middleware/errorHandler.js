import logger, { logError } from '../services/logger.js';
import { captureException } from '../services/sentry.js';

const isProduction = process.env.NODE_ENV === 'production';

// Custom error class for operational errors
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found handler
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.method} ${req.url}`, 404, 'NOT_FOUND');
  next(error);
};

// Global error handler
export const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
  } else if (err.code === 'SQLITE_CONSTRAINT') {
    statusCode = 409;
    code = 'CONFLICT';
    message = 'A record with this value already exists';
  }

  // Log the error
  logError(err, {
    requestId: req.id,
    method: req.method,
    url: req.url,
    statusCode,
    code
  });

  // Send to Sentry for 5xx errors
  if (statusCode >= 500) {
    captureException(err, {
      tags: {
        statusCode,
        code,
        method: req.method,
        url: req.url
      },
      extra: {
        requestId: req.id,
        query: req.query,
        params: req.params
      }
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: isProduction && statusCode === 500 ? 'Internal Server Error' : message,
      code,
      ...(isProduction ? {} : { stack: err.stack })
    },
    requestId: req.id
  });
};

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
