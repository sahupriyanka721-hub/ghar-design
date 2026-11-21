import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import { sendSuccess } from '../utils/response.js';
import { mockStore } from '../services/store.js';

const router = Router();

// Get notifications for current user
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = mockStore.notifications.filter((n) => n.userId === req.user!.id);
    return sendSuccess(res, notifications);
  } catch (err) {
    next(err);
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notif = mockStore.notifications.find(
      (n) => n.id === req.params.id && n.userId === req.user!.id
    );
    if (notif) {
      notif.isRead = true;
    }
    return sendSuccess(res, notif, 'Notification marked as read.');
  } catch (err) {
    next(err);
  }
});

export default router;
