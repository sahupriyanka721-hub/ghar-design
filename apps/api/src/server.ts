import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { testDbConnection } from './services/db.js';

const app = createApp();

async function start() {
  logger.info(`🏗️ Starting ${config.platform.name} Marketplace Backend...`);
  await testDbConnection();

  const server = app.listen(config.port, () => {
    logger.info(`🚀 ${config.platform.name} API running on port ${config.port}`);
    logger.info(`📡 API Base URL: http://localhost:${config.port}${config.apiPrefix}`);
    logger.info(`📖 Interactive API Documentation (Swagger): http://localhost:${config.port}/api/docs`);
    logger.info(`🌐 Allowed Frontend Origin: ${config.webOrigin}`);
    logger.info(`💳 Payment Mode: ${config.razorpay.isConfigured ? 'Live/Test Razorpay Keys' : 'Interactive Sandbox Mode'}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn(`⚠️ Port ${config.port} is already in use! An instance of GharDesign API is already running on port ${config.port}.`);
      logger.info(`💡 To free port ${config.port}, close existing terminal or run: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${config.port}).OwningProcess -Force`);
    } else {
      logger.error('Server error:', err);
    }
  });

  const shutdown = () => {
    logger.info('Gracefully shutting down server...');
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();
