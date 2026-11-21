import { Router, Request, Response, NextFunction } from 'express';
import { AssignmentService } from '../services/assignment.service.js';
import { QuotationService } from '../services/quotation.service.js';
import { BookingService } from '../services/booking.service.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { sendSuccess } from '../utils/response.js';
import { validateBody } from '../middleware/validate.js';
import { createQuotationSchema } from '@ghar-design/shared';
import { mockStore } from '../services/store.js';

const router = Router();

// Professional only access
router.use(authenticate, requireRole('PROFESSIONAL', 'ADMIN'));

// Get all assigned requests for professional
router.get('/assignments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignments = AssignmentService.getProfessionalAssignments(req.user!.id);
    return sendSuccess(res, assignments);
  } catch (err) {
    next(err);
  }
});

// Accept or decline assignment
router.post('/assignments/:id/respond', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, declineReason } = req.body;
    const result = AssignmentService.respondToAssignment(
      req.params.id,
      req.user!.id,
      status,
      declineReason
    );
    return sendSuccess(res, result, `Assignment ${status.toLowerCase()}ed successfully.`);
  } catch (err) {
    next(err);
  }
});

// Submit/Draft quotation
router.post('/quotations', validateBody(createQuotationSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quotation = QuotationService.createOrUpdateQuotation(req.user!.id, req.body);
    return sendSuccess(res, quotation, 'Quotation submitted for administrator review.');
  } catch (err) {
    next(err);
  }
});

// Get professional's quotations
router.get('/quotations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quotes = mockStore.quotations.filter((q) => q.professionalId === req.user!.id);
    return sendSuccess(res, quotes);
  } catch (err) {
    next(err);
  }
});

// Get bookings won by professional
router.get('/bookings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = BookingService.getProfessionalBookings(req.user!.id);
    return sendSuccess(res, bookings);
  } catch (err) {
    next(err);
  }
});

// Get professional profile
router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = mockStore.professionalProfiles.find((p) => p.userId === req.user!.id);
    return sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
});

export default router;
