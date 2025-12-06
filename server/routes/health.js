import express from 'express';
import db from '../database.js';
import logger from '../services/logger.js';

const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Detailed health check with dependency status
router.get('/detailed', async (req, res) => {
  const startTime = Date.now();
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    const result = db.prepare('SELECT COUNT(*) as count FROM assets').get();
    health.checks.database = {
      status: 'ok',
      responseTime: Date.now() - dbStart,
      details: {
        type: 'sqlite',
        assetCount: result.count
      }
    };
  } catch (error) {
    health.status = 'degraded';
    health.checks.database = {
      status: 'error',
      error: error.message
    };
    logger.error({ error }, 'Database health check failed');
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  health.checks.memory = {
    status: 'ok',
    details: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
    }
  };

  // Check if heap usage is too high (>90%)
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  if (heapPercent > 90) {
    health.checks.memory.status = 'warning';
    health.checks.memory.warning = 'High memory usage';
  }

  // Check email configuration
  health.checks.email = {
    status: process.env.SMTP_HOST ? 'configured' : 'using-ethereal',
    details: {
      adminEmail: process.env.ADMIN_EMAIL ? 'configured' : 'not-configured'
    }
  };

  // Check Sentry configuration
  health.checks.errorTracking = {
    status: process.env.SENTRY_DSN ? 'enabled' : 'disabled'
  };

  // Total response time
  health.responseTime = Date.now() - startTime;

  // Set appropriate status code
  const statusCode = health.status === 'ok' ? 200 : 503;

  res.status(statusCode).json(health);
});

// Liveness probe (Kubernetes-style)
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Readiness probe (Kubernetes-style)
router.get('/ready', (req, res) => {
  try {
    // Quick DB check
    db.prepare('SELECT 1').get();
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    logger.error({ error }, 'Readiness check failed');
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

export default router;
