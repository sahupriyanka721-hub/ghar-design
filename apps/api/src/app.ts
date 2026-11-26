import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import docsRouter from './routes/docs.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow mobile apps, curl, postman or same-origin
        if (!origin) return callback(null, true);
        if (
          origin === config.webOrigin ||
          origin.includes('pages.dev') ||
          origin.includes('vercel.app') ||
          origin.includes('localhost')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Root health check for Cloud hosting (Render / Railway / AWS)
  app.get('/', (req, res) => {
    res.json({
      status: 'online',
      service: 'GharDesign Marketplace API',
      database: 'MongoDB Atlas',
      version: '1.0.0',
    });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', database: 'MongoDB Atlas' });
  });

  // Logging
  if (config.env !== 'test') {
    app.use(morgan('dev'));
  }

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(config.sessionSecret));

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
