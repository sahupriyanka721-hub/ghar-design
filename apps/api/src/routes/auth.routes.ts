import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { authenticate } from '../middleware/auth.js';
import { otpLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import { requestOtpSchema, verifyOtpSchema } from '@ghar-design/shared';

const router = Router();

// Request OTP with rate limiter
router.post(
  '/otp/request',
  otpLimiter,
  validateBody(requestOtpSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, name, role } = req.body;
      const result = await AuthService.requestOtp(phone, name, role);
      return sendSuccess(res, result, 'OTP sent successfully to your mobile number.');
    } catch (err) {
      next(err);
    }
  }
);

// Verify OTP
router.post(
  '/otp/verify',
  validateBody(verifyOtpSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, otp } = req.body;
      const result = await AuthService.verifyOtp(phone, otp);

      // Set cookie for browser sessions
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return sendSuccess(res, result, 'Login successful.');
    } catch (err) {
      next(err);
    }
  }
);

// Get authenticated user info
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, req.user);
  } catch (err) {
    next(err);
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  return sendSuccess(res, null, 'Logged out successfully.');
});

// Quick demo login for role testing
router.post('/demo-login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = (req.body.role || 'CUSTOMER') as any;
    const result = await AuthService.demoLoginAs(role);

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(res, result, `Switched to demo ${role} account.`);
  } catch (err) {
    next(err);
  }
});

export default router;
