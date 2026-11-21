import crypto from 'crypto';
import { config } from '../config/index.js';
import { mockStore } from './store.js';
import { PaymentRecord, PaymentStatus } from '@ghar-design/shared';
import { logger } from '../utils/logger.js';
import { RequestService } from './request.service.js';

export class PaymentService {
  // Create payment order for Request Fee (e.g. ₹499 = 49900 paise)
  static async createRequestFeeOrder(userId: string, requestId: string) {
    const request = mockStore.requests.find((r) => r.id === requestId);
    if (!request) {
      throw { statusCode: 404, message: 'Project request not found.' };
    }

    if (request.customerId !== userId) {
      throw { statusCode: 403, message: 'Unauthorized: You can only pay for your own request.' };
    }

    if (request.isFeePaid) {
      throw { statusCode: 400, message: 'Quotation request fee has already been paid for this project.' };
    }

    const amountPaise = request.quoteFeePaise || config.platform.defaultRequestFeePaise;
    const paymentCode = `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    let razorpayOrderId = `order_${Date.now()}`;

    // If real Razorpay credentials exist, call Razorpay SDK
    if (config.razorpay.isConfigured) {
      try {
        // Dynamic import / Razorpay instance
        const Razorpay = (await import('razorpay')).default;
        const rzp = new Razorpay({
          key_id: config.razorpay.keyId,
          key_secret: config.razorpay.keySecret,
        });
        const order = await rzp.orders.create({
          amount: amountPaise,
          currency: 'INR',
          receipt: paymentCode,
          notes: { requestId, userId },
        });
        razorpayOrderId = order.id;
      } catch (err: any) {
        logger.error('Razorpay order creation failed, falling back to sandbox mode:', err.message);
      }
    }

    const payment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      paymentCode,
      userId,
      requestId,
      bookingId: null,
      purpose: 'REQUEST_FEE',
      razorpayOrderId,
      amountPaise,
      currency: 'INR',
      status: 'PAYMENT_PENDING',
      createdAt: new Date().toISOString(),
    };

    mockStore.payments.push(payment);

    return {
      paymentId: payment.id,
      razorpayOrderId,
      amountPaise,
      currency: 'INR',
      keyId: config.razorpay.keyId || 'rzp_test_SANDBOX_DEMO_KEY',
      isSandbox: !config.razorpay.isConfigured,
    };
  }

  // Verify payment signature
  static async verifyPayment(
    userId: string,
    paymentId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    const payment = mockStore.payments.find((p) => p.id === paymentId);
    if (!payment) {
      throw { statusCode: 404, message: 'Payment record not found.' };
    }

    // Idempotency: If already successful, return it directly
    if (payment.status === 'PAYMENT_SUCCESSFUL') {
      return { success: true, payment, message: 'Payment already verified.' };
    }

    // If real credentials are used, verify signature with HMAC SHA256
    if (config.razorpay.isConfigured) {
      const generatedSignature = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        payment.status = 'PAYMENT_FAILED';
        payment.failureReason = 'Signature verification failed';
        throw { statusCode: 400, message: 'Invalid payment signature. Verification failed.' };
      }
    }

    // Mark payment successful
    payment.status = 'PAYMENT_SUCCESSFUL';
    payment.razorpayPaymentId = razorpayPaymentId;

    // Atomically update project request state to SUBMITTED
    if (payment.requestId) {
      const request = mockStore.requests.find((r) => r.id === payment.requestId);
      if (request) {
        request.isFeePaid = true;
        if (request.status === 'AWAITING_PAYMENT') {
          RequestService.transitionStatus(request.id, 'SUBMITTED', userId, 'Fee paid via Razorpay');
        }
      }
    }

    logger.info(`💰 Payment ${payment.paymentCode} successfully verified for amount ₹${payment.amountPaise / 100}`);
    return { success: true, payment };
  }

  // Handle Razorpay Webhooks idempotently
  static async handleWebhook(signature: string, payload: any) {
    if (config.razorpay.webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', config.razorpay.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (expectedSignature !== signature) {
        throw { statusCode: 400, message: 'Invalid webhook signature' };
      }
    }

    const event = payload.event;
    logger.info(`Received Razorpay webhook event: ${event}`);

    if (event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const payment = mockStore.payments.find((p) => p.razorpayOrderId === orderId);
      if (payment && payment.status !== 'PAYMENT_SUCCESSFUL') {
        payment.status = 'PAYMENT_SUCCESSFUL';
        payment.razorpayPaymentId = paymentEntity.id;
        if (payment.requestId) {
          const req = mockStore.requests.find((r) => r.id === payment.requestId);
          if (req) {
            req.isFeePaid = true;
            req.status = 'SUBMITTED';
          }
        }
      }
    }

    return { received: true };
  }
}
