const express = require('express');
const router = express.Router();
const db = require('../db');
const os = require('os');

router.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  const dbConnected = await db.testConnection();
  const responseTime = Date.now() - startTime;

  const health = {
    status: dbConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: dbConnected,
      responseTimeMs: responseTime
    },
    server: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      cpus: os.cpus().length
    },
    environment: process.env.NODE_ENV || 'development'
  };

  const statusCode = dbConnected ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
