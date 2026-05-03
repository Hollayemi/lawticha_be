import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler, AppError } from './error';
import { UserModel, IUserDocument } from '../models/User.model';
import { UserRole } from '../models/types';

//  Extend Express Request 

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}

//  Token extraction helper 

function extractToken(req: Request): string | null {
  // 1. Authorization: Bearer <token>
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  // 2. Cookie (for browser clients)
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
}

//  protect 
//
// Verifies the access JWT, loads the user, attaches to req.user.
// Checks:
//   ✓ Token present
//   ✓ Token valid & not expired
//   ✓ User still exists in DB
//   ✓ User account is active
//   ✓ Password not changed after token was issued

export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractToken(req);

    if (!token) {
      return next(
        new AppError('You are not logged in. Please sign in to continue.', 401, 'UNAUTHORIZED')
      );
    }

    // Verify token — throws if expired or tampered
    let decoded: { id: string; role: UserRole; iat: number };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as typeof decoded;
    } catch (err: any) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Your session has expired. Please sign in again.'
          : 'Invalid token. Please sign in again.';
      return next(new AppError(message, 401, 'UNAUTHORIZED'));
    }

    // Fetch user — select sensitive fields needed for checks
    const user = await UserModel.findById(decoded.id).select(
      '+passwordChangedAt +refreshToken'
    );

    if (!user) {
      return next(
        new AppError(
          'The account associated with this token no longer exists.',
          401,
          'UNAUTHORIZED'
        )
      );
    }

    if (!user.isActive) {
      return next(
        new AppError(
          'Your account has been deactivated. Please contact support.',
          403,
          'FORBIDDEN'
        )
      );
    }

    // Invalidate tokens issued before a password change
    if (user.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          'Your password was recently changed. Please sign in again.',
          401,
          'UNAUTHORIZED'
        )
      );
    }

    req.user = user;
    next();
  }
);

//  optionalAuth 
//
// Like protect, but never throws. Attaches user if token is valid,
// continues anonymously if not. Useful for public endpoints that have
// richer responses for authenticated users (e.g. bookmarked acts).

export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) return next();

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        iat: number;
      };
      const user = await UserModel.findById(decoded.id).select('+passwordChangedAt');
      if (user && user.isActive && !user.changedPasswordAfter(decoded.iat)) {
        req.user = user;
      }
    } catch {
      // Silently ignore — anonymous access continues
    }

    next();
  }
);

//  authorizeRoles 
//
// Must be used AFTER protect. Restricts the route to specific roles.
//
// Usage:
//   router.get('/admin/stats', protect, authorizeRoles(UserRole.ADMIN), handler)

export const authorizeRoles = (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401, 'UNAUTHORIZED'));
    }
    if (!roles.includes(req.user.role as UserRole)) {
      return next(
        new AppError(
          `Access denied. This route is restricted to: ${roles.join(', ')}.`,
          403,
          'FORBIDDEN'
        )
      );
    }
    next();
  };

//  Convenience role guards 

/** Admin only */
export const adminOnly = authorizeRoles(UserRole.ADMIN);

/** Admin or Lawyer */
export const adminOrLawyer = authorizeRoles(UserRole.ADMIN, UserRole.LAWYER);

/** Verified lawyer only — also checks lawyerProfile.verificationStatus */
export const verifiedLawyerOnly = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== UserRole.LAWYER) {
      return next(
        new AppError('Access denied. Verified lawyers only.', 403, 'FORBIDDEN')
      );
    }
    // Lazy-load profile only when this guard is used
    const { LawyerProfileModel } = await import('../models/LawyerProfile.model');
    const profile = await LawyerProfileModel.findOne({ userId: req.user._id }).select(
      'verificationStatus'
    );
    if (!profile || profile.verificationStatus !== 'verified') {
      return next(
        new AppError(
          'Your lawyer profile has not been verified yet.',
          403,
          'FORBIDDEN'
        )
      );
    }
    next();
  }
);

/** Citizen only */
export const citizenOnly = authorizeRoles(UserRole.CITIZEN);