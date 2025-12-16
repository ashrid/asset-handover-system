import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDatabase } from './database.js';
import assetsRouter from './routes/assets.js';
import employeesRouter from './routes/employees.js';
import handoverRouter from './routes/handover.js';
import locationsRouter from './routes/locations.js';
import dashboardRouter from './routes/dashboard.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import { startReminderService, triggerManualReminder } from './services/reminderService.js';
import logger from './services/logger.js';
import { initSentry, setupSentryErrorHandler } from './services/sentry.js';
import requestLogger from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { securityHeaders, additionalSecurityHeaders } from './middleware/security.js';
import { validateContentType, validateOrigin } from './middleware/csrf.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Sentry (must be first)
initSentry(app);

// Security headers (early in middleware chain)
app.use(securityHeaders);
app.use(additionalSecurityHeaders);

// Core middleware
app.use(cors({
  credentials: true,
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || true
    : true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// CSRF-like protection for API
app.use(validateContentType);
app.use(validateOrigin);

// Request logging (after body parser, before routes)
app.use(requestLogger);

// Initialize database
try {
  initDatabase();
  logger.info('Database initialized successfully');
} catch (error) {
  logger.error({ error }, 'Failed to initialize database');
  process.exit(1);
}

// Start automated reminder service
try {
  startReminderService();
  logger.info('Reminder service started');
} catch (error) {
  logger.error({ error }, 'Failed to start reminder service');
}

// Health check routes (no auth needed)
app.use('/api/health', healthRouter);

// Auth routes (public endpoints for login)
app.use('/api/auth', authRouter);

// User management routes (admin only)
app.use('/api/users', usersRouter);

// API Routes
app.use('/api/assets', assetsRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/handover', handoverRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/dashboard', dashboardRouter);

// Manual reminder trigger endpoint (for testing/admin use)
app.post('/api/reminders/trigger', async (req, res) => {
  try {
    logger.info('Manual reminder trigger requested');
    const result = await triggerManualReminder();
    res.json({
      success: true,
      message: `Reminder check completed: ${result.sent} sent, ${result.failed} failed`,
      ...result
    });
  } catch (error) {
    logger.error({ error }, 'Error triggering reminders');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404 handler
app.use(notFoundHandler);

// Sentry error handler (must be before custom error handler)
setupSentryErrorHandler(app);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info({ signal }, 'Received shutdown signal, closing server...');

  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

const server = app.listen(PORT, () => {
  logger.info({
    port: PORT,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  }, `Server running on http://localhost:${PORT}`);
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception - shutting down');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled promise rejection');
});

export default app;
