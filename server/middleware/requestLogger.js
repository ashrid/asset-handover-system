import pinoHttp from 'pino-http';
import { nanoid } from 'nanoid';
import logger from '../services/logger.js';

const isProduction = process.env.NODE_ENV === 'production';

// Create pino-http middleware
export const requestLogger = pinoHttp({
  logger,

  // Generate unique request ID
  genReqId: (req) => {
    return req.headers['x-request-id'] || nanoid(12);
  },

  // Custom log level based on response status
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },

  // Custom success message
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} completed`;
  },

  // Custom error message
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} failed: ${err.message}`;
  },

  // Customize what gets logged
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      // Don't log body in production for security
      ...(isProduction ? {} : { body: sanitizeBody(req.raw.body) })
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  },

  // Don't log health check requests (too noisy)
  autoLogging: {
    ignore: (req) => {
      return req.url === '/api/health';
    }
  },

  // Custom attributes to add to each log
  customProps: (req, res) => ({
    responseTime: res.responseTime
  })
});

// Sanitize request body to remove sensitive data
function sanitizeBody(body) {
  if (!body) return undefined;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'signature_data', 'signatureData'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

export default requestLogger;
