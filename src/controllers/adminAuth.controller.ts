import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';
import { AdminUserModel } from '../models/Admin.model';
import { LawTichaRole } from '../models/types/lawticha.types';

//  Helpers 

const COOKIE_NAME = 'admin_token';

function signToken(id: string, role: string): string {
  return jwt.sign(
    { id, role },
    process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET!,
    { expiresIn: process.env.ADMIN_JWT_EXPIRE ?? '8h' } as any
  );
}

function setCookie(res: Response, token: string) {
  const maxAge = 8 * 60 * 60 * 1000; // 8 hours
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
  });
}

//  POST /api/v1/auth/admin/login 

export const adminLoginHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email?.trim())    return next(new AppError('Email is required', 400, 'VALIDATION_ERROR'));
    if (!password?.trim()) return next(new AppError('Password is required', 400, 'VALIDATION_ERROR'));

    const admin = await AdminUserModel.findOne({
      email: email.toLowerCase().trim(),
      removedAt: null,
    }).select('+passwordHash');


    if (!admin || !admin.isActive) {
      return next(new AppError('Invalid credentials', 401, 'UNAUTHORIZED'));
    }

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) return next(new AppError('Invalid credentials', 401, 'UNAUTHORIZED'));

    // Stamp lastLogin
    AdminUserModel.updateOne({ _id: admin._id }, { lastLogin: new Date() }).exec();

    const token = signToken(String(admin._id), admin.role);
    setCookie(res, token);

    return (res as AppResponse).data(
      {
        admin: {
          id:    String(admin._id),
          name:  admin.name,
          email: admin.email,
          role:  admin.role,
        },
        accessToken :token,
      },
      'Login successful'
    );
  }
);

//  POST /api/v1/auth/admin/logout 

export const adminLogoutHandler = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return (res as AppResponse).success('Logged out successfully');
  }
);

//  GET /api/v1/auth/admin/me 

export const adminMeHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const admin = req.admin!;
    const doc = await AdminUserModel.findById(admin.id).select('-passwordHash');
    if (!doc) return (res as AppResponse).data(null, 'Not found');

    return (res as AppResponse).data(
      {
        id:        String(doc._id),
        name:      doc.name,
        email:     doc.email,
        role:      doc.role,
        lastLogin: doc.lastLogin,
      },
      'Profile fetched'
    );
  }
);
