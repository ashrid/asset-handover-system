import * as Sentry from '@sentry/node';
import logger from './logger.js';

const isProduction = process.env.NODE_ENV === 'production';

// Initialize Sentry only if DSN is configured
export const initSentry = (app) => {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logger.info('Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',

    // Performance monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0,

    // Session tracking
    autoSessionTracking: true,

    // Filter out non-critical errors
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Don't send 404 errors
      if (error?.status === 404) {
        return null;
      }

      // Don't send validation errors
      if (error?.status === 400) {
        return null;
      }

      return event;
    },

    // Scrub sensitive data
    beforeSendTransaction(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },

    // Integration options
    integrations: [
      Sentry.httpIntegration({ tracing: true }),
      Sentry.expressIntegration({ app })
    ]
  });

  logger.info('Sentry error tracking initialized');
};

// Setup Express error handler for Sentry
export const setupSentryErrorHandler = (app) => {
  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }
};

// Capture exception with additional context
export const captureException = (error, context = {}) => {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.withScope((scope) => {
    // Add custom context
    if (context.user) {
      scope.setUser(context.user);
    }

    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureException(error);
  });
};

// Capture a message (for non-error alerts)
export const captureMessage = (message, level = 'info', context = {}) => {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setLevel(level);

    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    Sentry.captureMessage(message);
  });
};

// Add breadcrumb for debugging
export const addBreadcrumb = (category, message, data = {}) => {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info'
  });
};

export default Sentry;
