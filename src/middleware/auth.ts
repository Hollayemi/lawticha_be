import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError } from './error';
import { verifyToken, JwtPayload } from '../helpers/jwt.helper';
import { UserModel } from '../models';
import { UserRole } from '../models/types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        fullName: string;
        phone: string;
        role: UserRole;
        isActive: boolean;
      };
    }
  }
}

// ─── protect ─────────────────────────────────────────────────────────────────

export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to continue.', 401, 'UNAUTHORIZED'));
    }

    let decoded: JwtPayload;
    try {
      decoded = verifyToken(token, process.env.JWT_SECRET!);
    } catch (err: any) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Your session has expired. Please log in again.'
          : 'Invalid token. Please log in again.';
      return next(new AppError(message, 401, 'UNAUTHORIZED'));
    }

    const user = await UserModel.findById(decoded.id).select('fullName phone role isActive');
    if (!user) return next(new AppError('The account belonging to this token no longer exists.', 401, 'UNAUTHORIZED'));
    if (!user.isActive) return next(new AppError('Your account has been deactivated. Please contact support.', 403, 'FORBIDDEN'));

    req.user = {
      id: user._id!.toString(),
      fullName: user.fullName,
      phone: user.phone,
      role: user.role as UserRole,
      isActive: user.isActive,
    };

    next();
  }
);

// ─── authorizeRoles ───────────────────────────────────────────────────────────

export const authorizeRoles = (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError('Not authenticated', 401, 'UNAUTHORIZED'));
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Access denied. Restricted to: ${roles.join(', ')}`, 403, 'FORBIDDEN')
      );
    }
    next();
  };

// ─── Convenience guards ───────────────────────────────────────────────────────

/** Super admin only */
export const superAdminOnly = authorizeRoles(UserRole.SUPER_ADMIN);

/** Super admin or Government */
export const superAdminOrGov = authorizeRoles(UserRole.SUPER_ADMIN, UserRole.GOVERNMENT);

/** Super admin, Government, or LGA */
export const managementTier = authorizeRoles(UserRole.SUPER_ADMIN, UserRole.GOVERNMENT, UserRole.LGA);

/** Super admin, Government, LGA, or Union — can read downwards */
export const seniorStaff = authorizeRoles(
  UserRole.SUPER_ADMIN,
  UserRole.GOVERNMENT,
  UserRole.LGA,
  UserRole.UNION
);

/** Union or Seller */
export const operationalStaff = authorizeRoles(UserRole.UNION, UserRole.SELLER);

/** Union only */
export const unionOnly = authorizeRoles(UserRole.UNION);

/** Seller only */
export const sellerOnly = authorizeRoles(UserRole.SELLER);

/** Rider only */
export const riderOnly = authorizeRoles(UserRole.RIDER);
