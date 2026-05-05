import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';
import { UserModel } from '../models/User.model';
import { UserRole } from '../models/types';
import {
  sendTokenResponse,
  clearAuthCookies,
  hashToken,
  findActiveUser,
  createProfileAfterRegister,
  loadUserProfile,
} from '../services/auth.service';

//  POST /api/v1/auth/register 
/**
 * Creates a new citizen or lawyer account.
 * On success: creates the role-specific profile, sends verification email,
 * and returns tokens so the user is logged in immediately.
 *
 * Body: { firstName, lastName, email, password, phone?, role? }
 */
export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role = UserRole.CITIZEN,
    } = req.body;

    // Block admin self-registration
    if (role === UserRole.ADMIN) {
      return next(new AppError('Admin accounts cannot be self-registered.', 403, 'FORBIDDEN'));
    }

    const user = await UserModel.create({
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      email:     email?.toLowerCase().trim(),
      phone:     phone?.trim(),
      password,
      role,
      authProvider: 'email',
    });

    // Send email verification
    const rawToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // TODO: wire up email service
    console.log(`[Auth] Email verification token for ${user.email}: ${rawToken}`);

    // Spin up role-specific profile
    await createProfileAfterRegister(user);

    return sendTokenResponse(res, user, 201, 'Account created. Please verify your email.');
  }
);

//  POST /api/v1/auth/signin 
/**
 * Email + password sign-in.
 * Body: { email, password }
 */
export const signIn = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await UserModel.findByEmailWithPassword(email);

    if (!user) {
      return next(new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403, 'FORBIDDEN'));
    }

    // Stamp last login (fire-and-forget)
    UserModel.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).exec();

    return sendTokenResponse(res, user, 200, 'Signed in successfully.');
  }
);

//  POST /api/v1/auth/logout 

export const logout = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    if (req.user) {
      await UserModel.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: '' } });
    }
    clearAuthCookies(res);
    return (res as AppResponse).success('Logged out successfully.');
  }
);

//  POST /api/v1/auth/refresh-token 
/**
 * Issues a new access token using the httpOnly refresh cookie.
 * Implements refresh token rotation.
 */
export const refreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const incomingToken: string | undefined = req.cookies?.refreshToken;

    if (!incomingToken) {
      return next(new AppError('No refresh token. Please sign in.', 401, 'UNAUTHORIZED'));
    }

    let decoded: { id: string };
    try {
      decoded = jwt.verify(
        incomingToken,
        process.env.JWT_REFRESH_SECRET as string
      ) as typeof decoded;
    } catch {
      clearAuthCookies(res);
      return next(new AppError('Invalid or expired refresh token. Please sign in again.', 401, 'UNAUTHORIZED'));
    }

    const user = await UserModel.findById(decoded.id).select('+refreshToken +passwordChangedAt');

    if (!user || !user.isActive) {
      clearAuthCookies(res);
      return next(new AppError('Session invalid. Please sign in again.', 401, 'UNAUTHORIZED'));
    }

    // Rotation check,  detect token reuse
    if (user.refreshToken !== incomingToken) {
      await UserModel.findByIdAndUpdate(user._id, { $unset: { refreshToken: '' } });
      clearAuthCookies(res);
      return next(new AppError('Session conflict detected. Please sign in again.', 401, 'TOKEN_REUSE'));
    }

    return sendTokenResponse(res, user, 200, 'Token refreshed.');
  }
);

//  GET /api/v1/auth/verify-email/:token 

export const verifyEmail = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const hashedToken = hashToken(req.params.token);

    const user = await UserModel.findOne({
      emailVerificationToken:   hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return next(new AppError('Verification link is invalid or has expired.', 400, 'INVALID_TOKEN'));
    }

    user.isVerified               = true;
    user.emailVerificationToken   = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return (res as AppResponse).success('Email verified successfully. You can now sign in.');
  }
);

//  POST /api/v1/auth/resend-verification 

export const resendVerification = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const GENERIC = 'If that email is registered, a verification link has been sent.';

    const user = await UserModel
      .findByEmail(req.body.email)
      .select('+emailVerificationToken +emailVerificationExpires');

    if (!user) return (res as AppResponse).success(GENERIC);

    if (user.isVerified) {
      return next(new AppError('This email is already verified.', 400, 'ALREADY_VERIFIED'));
    }

    // Rate limit: block if a token was issued within the last 5 min
    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires.getTime() - Date.now() > 23.9 * 60 * 60 * 1000
    ) {
      return next(new AppError('A verification email was recently sent. Please wait a few minutes.', 429, 'RATE_LIMIT'));
    }

    const rawToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    console.log(`[Auth] Resend verification for ${user.email}: ${rawToken}`);

    return (res as AppResponse).success(GENERIC);
  }
);

//  POST /api/v1/auth/forgot-password 

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const GENERIC = 'If an account with that email exists, a password reset link has been sent.';

    const user = await UserModel
      .findByEmail(req.body.email)
      ?.select('+passwordResetToken +passwordResetExpires');

    if (!user || !user.isActive) return (res as AppResponse).success(GENERIC);

    const rawToken = user.getPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
    // TODO: plug email service
    console.log(`[Auth] Password reset URL for ${user.email}: ${resetUrl}`);

    return (res as AppResponse).success(GENERIC);
  }
);

//  PATCH /api/v1/auth/reset-password/:token 

export const resetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const hashedToken = hashToken(req.params.token);

    const user = await UserModel.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires +passwordChangedAt');

    if (!user) {
      return next(new AppError('Password reset link is invalid or has expired.', 400, 'INVALID_TOKEN'));
    }

    user.password             = req.body.password;
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return sendTokenResponse(res, user, 200, 'Password reset successfully.');
  }
);

//  PATCH /api/v1/auth/update-password 

export const updatePassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword } = req.body;

    const user = await UserModel.findById(req.user!._id).select('+password +passwordChangedAt');
    if (!user) return next(new AppError('User not found.', 404, 'NOT_FOUND'));

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Your current password is incorrect.', 401, 'INVALID_CREDENTIALS'));
    }

    user.password = newPassword;
    await user.save();

    return sendTokenResponse(res, user, 200, 'Password updated successfully.');
  }
);

//  GET /api/v1/auth/me 

export const getMe = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user    = await findActiveUser(req.user!._id.toString());
    const profile = await loadUserProfile(user);

    return (res as AppResponse).data(
      { user: user.toSafeObject(), profile },
      'Profile fetched successfully.'
    );
  }
);

//  PATCH /api/v1/auth/update-profile 
// Updates core User fields only (firstName, lastName, phone, avatarUrl).
// Role-specific profile fields go through their own routes.

export const updateProfile = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const ALLOWED = ['firstName', 'lastName', 'phone', 'avatarUrl'] as const;
    const updates: Record<string, unknown> = {};

    for (const field of ALLOWED) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const user = await UserModel.findByIdAndUpdate(
      req.user!._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return (res as AppResponse).data({ user: user!.toSafeObject() }, 'Profile updated.');
  }
);

//  DELETE /api/v1/auth/deactivate 

export const deactivateAccount = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserModel.findById(req.user!._id).select('+password');
    if (!user) return next(new AppError('User not found.', 404, 'NOT_FOUND'));

    if (!(await user.matchPassword(req.body.password))) {
      return next(new AppError('Password incorrect. Account was not deactivated.', 401, 'INVALID_CREDENTIALS'));
    }

    user.isActive     = false;
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });

    clearAuthCookies(res);

    return (res as AppResponse).success('Your account has been deactivated.');
  }
);
