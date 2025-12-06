import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

// Create the logger with appropriate configuration
const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  // Base context added to all log entries
  base: {
    service: 'asset-handover',
    env: process.env.NODE_ENV || 'development'
  },

  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,

  // Pretty print in development
  transport: isProduction ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname,service,env'
    }
  },

  // Redact sensitive fields
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'signature_data',
      'email',
      '*.password',
      '*.token'
    ],
    censor: '[REDACTED]'
  }
});

// Create child loggers for different modules
export const createModuleLogger = (moduleName) => {
  return logger.child({ module: moduleName });
};

// Convenience methods for common log patterns
export const logRequest = (req, message, extra = {}) => {
  logger.info({
    ...extra,
    requestId: req.id,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  }, message);
};

export const logError = (error, context = {}) => {
  logger.error({
    ...context,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    }
  }, error.message);
};

export const logDatabaseQuery = (query, duration, rowCount) => {
  logger.debug({
    type: 'database',
    query: query.substring(0, 200), // Truncate long queries
    durationMs: duration,
    rowCount
  }, 'Database query executed');
};

export const logEmailSent = (type, recipient, success, error = null) => {
  const logFn = success ? logger.info : logger.error;
  logFn({
    type: 'email',
    emailType: type,
    recipient: recipient ? recipient.replace(/(.{2}).*(@.*)/, '$1***$2') : 'unknown', // Mask email
    success,
    error: error?.message
  }, success ? 'Email sent successfully' : 'Email sending failed');
};

export const logReminderService = (action, details = {}) => {
  logger.info({
    type: 'reminder-service',
    action,
    ...details
  }, `Reminder service: ${action}`);
};

export default logger;
