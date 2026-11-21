import { Router, Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service.js';
import { authenticate } from '../middleware/auth.js';
import { sendSuccess } from '../utils/response.js';
import { mockStore } from '../services/store.js';

const router = Router();

// Create Razorpay order for quotation request fee
router.post('/request-fee/order', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.body;
    const orderData = await PaymentService.createRequestFeeOrder(req.user!.id, requestId);
    return sendSuccess(res, orderData, 'Payment order initiated.');
  } catch (err) {
    next(err);
  }
});

// Verify payment
router.post('/verify', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const result = await PaymentService.verifyPayment(
      req.user!.id,
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );
    return sendSuccess(res, result, 'Payment verified successfully.');
  } catch (err) {
    next(err);
  }
});

// Razorpay Webhook endpoint (public with HMAC verification)
router.post('/webhooks/razorpay', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const result = await PaymentService.handleWebhook(signature, req.body);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get user payment history
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payments = mockStore.payments.filter((p) => p.userId === req.user!.id);
    return sendSuccess(res, payments);
  } catch (err) {
    next(err);
  }
});

export default router;
