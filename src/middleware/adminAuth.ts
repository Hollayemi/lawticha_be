import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler, AppError } from './error';
import { AdminUserModel } from '../models/Admin.model';
import { LawTichaRole } from '../models/types/lawticha.types';

//  Augment Express Request 

declare global {
  namespace Express {
    interface Request {
      admin?: {
        id:    string;
        name:  string;
        email: string;
        role:  LawTichaRole.SUPER_ADMIN | LawTichaRole.ADMIN;
      };
    }
  }
}

//  protectAdmin — verifies cookie or Bearer token 

export const protectAdmin = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.admin_token) {
      token = req.cookies.admin_token;
    }

    if (!token) {
      return next(new AppError('Not authenticated. Please log in.', 401, 'UNAUTHORIZED'));
    }

    let decoded: { id: string; role: string };
    try {
      decoded = jwt.verify(
        token,
        process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET!
      ) as any;
    } catch (err: any) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Session expired. Please log in again.'
          : 'Invalid token. Please log in again.';
      return next(new AppError(message, 401, 'UNAUTHORIZED'));
    }

    const admin = await AdminUserModel.findOne({
      _id: decoded.id,
      isActive: true,
      removedAt: null,
    });

    if (!admin) {
      return next(new AppError('Admin account not found or deactivated.', 401, 'UNAUTHORIZED'));
    }

    req.admin = {
      id:    String(admin._id),
      name:  admin.name,
      email: admin.email,
      role:  admin.role as LawTichaRole.SUPER_ADMIN | LawTichaRole.ADMIN,
    };

    next();
  }
);

//  requireSuperAdmin 

export const requireSuperAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.admin?.role !== LawTichaRole.SUPER_ADMIN) {
    return next(new AppError('Restricted to super admins only.', 403, 'FORBIDDEN'));
  }
  next();
};
