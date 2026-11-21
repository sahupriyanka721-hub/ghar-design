import { Router, Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service.js';
import { AssignmentService } from '../services/assignment.service.js';
import { QuotationService } from '../services/quotation.service.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { mockStore } from '../services/store.js';

const router = Router();

// Strictly enforce ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// Get admin dashboard stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = AdminService.getDashboardStats();
    return sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
});

// Get all project requests
router.get('/requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = AdminService.getAllRequests();
    return sendSuccess(res, requests);
  } catch (err) {
    next(err);
  }
});

// Assign professionals to request
router.post('/requests/:id/assign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { professionalIds, responseDeadline, internalNotes } = req.body;
    const assignments = AssignmentService.assignProfessionals(
      req.params.id,
      professionalIds,
      responseDeadline,
      internalNotes,
      req.user!.id
    );
    return sendSuccess(res, assignments, 'Professionals assigned successfully.');
  } catch (err) {
    next(err);
  }
});

// Get all quotations
router.get('/quotations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quotations = AdminService.getAllQuotations();
    return sendSuccess(res, quotations);
  } catch (err) {
    next(err);
  }
});

// Review quotation (Approve, Request Changes, Reject, Publish)
router.post('/quotations/:id/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, adminFeedback } = req.body;
    const quote = QuotationService.reviewQuotation(
      req.user!.id,
      req.params.id,
      action,
      adminFeedback
    );
    return sendSuccess(res, quote, `Quotation ${action.toLowerCase()}ed successfully.`);
  } catch (err) {
    next(err);
  }
});

// Get all professionals
router.get('/professionals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const professionals = AdminService.getAllProfessionals();
    return sendSuccess(res, professionals);
  } catch (err) {
    next(err);
  }
});

// Verify or reject professional
router.post('/professionals/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body; // 'APPROVED' | 'REJECTED'
    const prof = mockStore.professionalProfiles.find((p) => p.id === req.params.id || p.userId === req.params.id);
    if (!prof) {
      return sendError(res, 'Professional profile not found.', 404);
    }
    prof.verificationStatus = status;
    prof.isVerified = status === 'APPROVED';
    return sendSuccess(res, prof, `Professional verification status set to ${status}.`);
  } catch (err) {
    next(err);
  }
});

// Get bookings
router.get('/bookings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = mockStore.bookings.map((b) => {
      const cust = mockStore.users.find((u) => u.id === b.customerId);
      const pro = mockStore.users.find((u) => u.id === b.professionalId);
      const req = mockStore.requests.find((r) => r.id === b.requestId);
      return {
        ...b,
        customerName: cust?.name,
        customerPhone: cust?.phone,
        professionalName: pro?.name,
        requestCode: req?.requestCode,
        city: req?.city,
      };
    });
    return sendSuccess(res, bookings);
  } catch (err) {
    next(err);
  }
});

// Get audit logs
router.get('/audit-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, mockStore.auditLogs);
  } catch (err) {
    next(err);
  }
});

// Get customers
router.get('/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = mockStore.users.filter((u) => u.role === 'CUSTOMER').map((c) => {
      const requests = mockStore.requests.filter((r) => r.customerId === c.id);
      const bookings = mockStore.bookings.filter((b) => b.customerId === c.id);
      return {
        ...c,
        requestsCount: requests.length,
        bookingsCount: bookings.length,
      };
    });
    return sendSuccess(res, customers);
  } catch (err) {
    next(err);
  }
});

// Get reports and analytics
router.get('/reports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = {
      avgTurnaroundHours: 28.4,
      bookingConversionRate: 68.2,
      totalEscrowAdvancePaise: 5162500,
      categoryDistribution: {
        'new-house-construction': 46,
        'house-map-planning': 28,
        'complete-construction-package': 16,
        'home-renovation': 10,
      },
    };
    return sendSuccess(res, reports);
  } catch (err) {
    next(err);
  }
});

// Get platform settings
router.get('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, {
      quoteRequestFeePaise: 49900,
      gstPercent: 18,
      platformName: 'GharDesign',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
