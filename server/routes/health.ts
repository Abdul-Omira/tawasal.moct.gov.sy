import express from 'express';
import { storage } from '../database/storage.js';
import { redisService } from '../services/redisService.js';

const router = express.Router();

// Basic health check
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unknown',
        redis: 'unknown',
        memory: 'unknown',
        disk: 'unknown'
      }
    };

    // Check database connectivity
    try {
      await storage.getHealth();
      health.services.database = 'connected';
    } catch (error) {
      health.services.database = 'disconnected';
      health.status = 'unhealthy';
    }

    // Check Redis connectivity
    try {
      await redisService.ping();
      health.services.redis = 'connected';
    } catch (error) {
      health.services.redis = 'disconnected';
      health.status = 'unhealthy';
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    health.services.memory = {
      status: memUsageMB.heapUsed > 500 ? 'high' : 'normal',
      usage: memUsageMB
    };

    // Check disk space (simplified)
    health.services.disk = {
      status: 'normal',
      message: 'Disk space check not implemented'
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Database health check
router.get('/db', async (req, res) => {
  try {
    await storage.getHealth();
    res.json({
      status: 'connected',
      timestamp: new Date().toISOString(),
      message: 'Database connection successful'
    });
  } catch (error) {
    res.status(503).json({
      status: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Database connection failed'
    });
  }
});

// Redis health check
router.get('/redis', async (req, res) => {
  try {
    await redisService.ping();
    res.json({
      status: 'connected',
      timestamp: new Date().toISOString(),
      message: 'Redis connection successful'
    });
  } catch (error) {
    res.status(503).json({
      status: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Redis connection failed'
    });
  }
});

// Detailed system metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: process.memoryUsage().rss,
        heapTotal: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed,
        external: process.memoryUsage().external
      },
      cpu: {
        usage: process.cpuUsage()
      },
      platform: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT || 3000
      }
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get metrics'
    });
  }
});

// Readiness probe
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are available
    const dbHealthy = await storage.getHealth().then(() => true).catch(() => false);
    const redisHealthy = await redisService.ping().then(() => true).catch(() => false);

    if (dbHealthy && redisHealthy) {
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealthy ? 'ready' : 'not ready',
          redis: redisHealthy ? 'ready' : 'not ready'
        }
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Readiness check failed'
    });
  }
});

// Liveness probe
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
