import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { UserSessionData } from '@elearning/shared';

declare global {
  namespace Express {
    interface Request {
      user?: UserSessionData;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token =
    req.cookies?.access_token ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục.' });
    return;
  }

  const user = AuthService.verifyAccessToken(token);
  if (!user) {
    res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn.' });
    return;
  }

  req.user = user;
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập khu vực này.' });
      return;
    }
    next();
  });
};
