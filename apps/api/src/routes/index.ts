import { Router } from 'express';
import authRoutes from './auth.routes.js';
import requestRoutes from './request.routes.js';
import quotationRoutes from './quotation.routes.js';
import paymentRoutes from './payment.routes.js';
import professionalRoutes from './professional.routes.js';
import adminRoutes from './admin.routes.js';
import notificationRoutes from './notification.routes.js';
import customerRoutes from './customer.routes.js';
import calculatorRoutes from './calculator.routes.js';
import { syncRouter } from './sync.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/customer', customerRoutes);
apiRouter.use('/requests', requestRoutes);
apiRouter.use('/quotations', quotationRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/professional', professionalRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/calculator', calculatorRoutes);
apiRouter.use('/sync', syncRouter);

// Health check endpoint
apiRouter.get('/health', (req: any, res: any) => {
  res.json({
    status: 'healthy',
    platform: 'GharDesign API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default apiRouter;
