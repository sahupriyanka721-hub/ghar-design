import { Router, Request, Response, NextFunction } from 'express';
import { RequestService } from '../services/request.service.js';
import { QuotationService } from '../services/quotation.service.js';
import { authenticate, requireRequestOwnership } from '../middleware/auth.js';
import { sendSuccess } from '../utils/response.js';
import { validateBody } from '../middleware/validate.js';
import { createProjectRequestSchema } from '@ghar-design/shared';

const router = Router();

// Create new project request
router.post(
  '/',
  authenticate,
  validateBody(createProjectRequestSchema as any),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await RequestService.createRequest(req.user!.id, req.body);
      return sendSuccess(res, request, 'Project request created successfully. Please pay the quotation request fee.', 201);
    } catch (err) {
      next(err);
    }
  }
);

// Get all requests for current customer
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await RequestService.getCustomerRequests(req.user!.id);
    return sendSuccess(res, requests);
  } catch (err) {
    next(err);
  }
});

// Get request details by ID
router.get(
  '/:id',
  authenticate,
  requireRequestOwnership(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await RequestService.getRequestById(req.params.id);
      return sendSuccess(res, request);
    } catch (err) {
      next(err);
    }
  }
);

// Get quotations for customer comparison
router.get(
  '/:id/quotations',
  authenticate,
  requireRequestOwnership(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quotations = QuotationService.getQuotationsForCustomer(req.user!.id, req.params.id);
      return sendSuccess(res, quotations);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
