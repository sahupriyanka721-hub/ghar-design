import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { sendError } from '../utils/response.js';
import { mockStore } from '../services/store.js';
import { UserRole } from '@ghar-design/shared';

export interface AuthenticatedUser {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  email?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return sendError(res, 'Authentication required. Please log in.', 401, 'UNAUTHORIZED');
    }

    const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please log in again.', 401, 'TOKEN_EXPIRED');
    }
    return sendError(res, 'Invalid token. Access denied.', 401, 'INVALID_TOKEN');
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401, 'UNAUTHORIZED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`,
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
}

export function requireRequestOwnership() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401, 'UNAUTHORIZED');
    }

    // Admins have override access
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const requestId = req.params.requestId || req.params.id;
    const request = mockStore.requests.find((r) => r.id === requestId);

    if (!request) {
      return sendError(res, 'Project request not found.', 404, 'NOT_FOUND');
    }

    if (req.user.role === 'CUSTOMER' && request.customerId !== req.user.id) {
      return sendError(
        res,
        'Access denied: You do not own this project request.',
        403,
        'FORBIDDEN'
      );
    }

    if (req.user.role === 'PROFESSIONAL') {
      const isAssigned = mockStore.assignments.some(
        (a) => a.requestId === requestId && a.professionalId === req.user!.id
      );
      if (!isAssigned) {
        return sendError(
          res,
          'Access denied: This request has not been assigned to your firm.',
          403,
          'FORBIDDEN'
        );
      }
    }

    next();
  };
}
