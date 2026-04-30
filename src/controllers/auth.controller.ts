import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';
import { sendTokenResponse, verifyToken } from '../helpers/jwt.helper';
import { sendOtp, verifyOtp, resendOtp, getMyProfile } from '../services/auth.service';
import { UserRole } from '../models/types';
import { UserModel } from '../models';
import { Types } from 'mongoose';

// ─── POST /api/v1/auth/send-otp ───────────────────────────────────────────────

export const sendOtpHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { phone } = req.body;
    console.log('Received phone number for OTP:', phone);
    if (!phone) throw new AppError('Phone number is required', 400, 'VALIDATION_ERROR');

    const result = await sendOtp(phone);
    return (res as AppResponse).data(result, 'OTP sent successfully');
  }
);

// ─── POST /api/v1/auth/verify-otp ────────────────────────────────────────────

export const verifyOtpHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) throw new AppError('Phone and OTP are required', 400, 'VALIDATION_ERROR');

    const { user } = await verifyOtp(phone, otp);

    return sendTokenResponse(
      res,
      user._id as Types.ObjectId,
      user.role as UserRole,
      {
        user: {
          _id: user._id,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
        },
      }
    );
  }
);

// ─── POST /api/v1/auth/resend-otp ────────────────────────────────────────────

export const resendOtpHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { phone } = req.body;
    if (!phone) throw new AppError('Phone number is required', 400, 'VALIDATION_ERROR');

    const result = await resendOtp(phone);
    return (res as AppResponse).data(result, 'OTP resent successfully');
  }
);

// ─── POST /api/v1/auth/refresh-token ─────────────────────────────────────────

export const refreshTokenHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token: string | undefined = req.cookies?.refreshToken;
    if (!token) return next(new AppError('No refresh token provided', 401, 'UNAUTHORIZED'));

    let payload: { id: string; role: UserRole };
    try {
      payload = verifyToken(token, process.env.JWT_REFRESH_SECRET!) as { id: string; role: UserRole };
    } catch {
      return next(new AppError('Invalid or expired refresh token. Please log in again.', 401, 'UNAUTHORIZED'));
    }

    const user = await UserModel.findById(payload.id).select('isActive role');
    if (!user || !user.isActive) {
      return next(new AppError('Account not found or deactivated', 401, 'UNAUTHORIZED'));
    }

    return sendTokenResponse(res, user._id as Types.ObjectId, user.role as UserRole, {
      user: { id: user._id, role: user.role },
    });
  }
);

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────

export const logoutHandler = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 5000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
    return (res as AppResponse).success('Logged out successfully');
  }
);

// ─── GET /api/v1/auth/me ──────────────────────────────────────────────────────

export const getMeHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { id, role } = req.user as { id: string; role: UserRole };
    const data = await getMyProfile(id, role);
    return (res as AppResponse).data(data, 'Profile fetched');
  }
);
