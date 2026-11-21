import { Router, Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service.js';
import { QuotationService } from '../services/quotation.service.js';
import { authenticate } from '../middleware/auth.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

// Select quotation and confirm booking
router.post('/:id/select', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.body;
    const booking = BookingService.selectAndBookQuotation(req.user!.id, requestId, req.params.id);
    return sendSuccess(res, booking, 'Quotation selected and booking confirmed successfully!');
  } catch (err) {
    next(err);
  }
});

// Get quotation details by ID
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quote = QuotationService.getQuotationById(req.params.id);
    return sendSuccess(res, quote);
  } catch (err) {
    next(err);
  }
});

export default router;
