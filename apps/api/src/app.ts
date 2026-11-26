import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import docsRouter from './routes/docs.routes.js';
import { syncRouter } from './routes/sync.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

export function createApp() {
  const app = express();

  // Security headers (Allow cross-origin resource access for web & mobile)
  app.use(helmet({ crossOriginResourcePolicy: false }));

  // CORS configuration (Reflect origin so mobile & cloudflare pages always connect seamlessly)
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body parsers - MUST BE FIRST BEFORE ANY ROUTES!
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use(cookieParser(config.sessionSecret));

  // Logging
  if (config.env !== 'test') {
    app.use(morgan('dev'));
  }

  // Root health check for Cloud hosting (Render / Railway / AWS)
  app.get('/', (req: any, res: any) => {
    res.json({
      status: 'online',
      service: 'GharDesign Marketplace API',
      database: 'MongoDB Atlas',
      version: '1.0.0',
    });
  });

  app.get('/health', (req: any, res: any) => {
    res.json({ status: 'healthy', database: 'MongoDB Atlas' });
  });

  // Universal Cloud Database Sync Endpoint for Cross-Laptop & Mobile Synchronization
  app.use('/api/sync', syncRouter);
  app.use('/sync', syncRouter);

  // Global rate limiter
  app.use('/api', apiLimiter);

  // Interactive Swagger / OpenAPI Documentation Explorer
  app.use('/api/docs', docsRouter);

  // API Router
  app.use(config.apiPrefix, apiRouter);

  // 404 Handler
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
