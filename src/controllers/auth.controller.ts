import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';
import { UserModel, IUserDocument } from '../User.model';
import { UserRole } from '../types';
import {
  sendTokenResponse,
  clearAuthCookies,
  hashToken,
  findActiveUser,
  createProfileAfterRegister,
} from '../services/auth.service';

// 
// POST /api/v1/auth/register
// 
// Creates a new citizen or lawyer account.
// On success: creates the role-specific profile, sends verification email,
// and returns tokens so the user is logged in immediately.
//
// Body: { firstName, lastName, email, password, phone?, role? }
// 

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

    //  Guard: block admin self-registration 
    if (role === UserRole.ADMIN) {
      return next(new AppError('Admin accounts cannot be created via this endpoint.', 403, 'FORBIDDEN'));
    }

    //  Create user (pre-save hook hashes password) 
    const user = await UserModel.create({
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      email:     email.toLowerCase().trim(),
      password,
      phone:     phone?.trim(),
      role,
      authProvider: 'email',
    });

    //  Send email verification 
    const rawToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // TODO: plug in your email service here
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Verify your LawTicha account',
    //   html: verificationEmailTemplate(rawToken, user.firstName),
    // });
    console.log(`[Auth] Email verification token for ${user.email}: ${rawToken}`);

    //  Create role-specific profile (CitizenProfile or LawyerProfile skeleton)
    await createProfileAfterRegister(user);

    //  Issue tokens & respond 
    return sendTokenResponse(res, user, 201, 'Account created. Please verify your email.');
  }
);

// 
// POST /api/v1/auth/signin
// 
// Email + password sign-in.
//
// Body: { email, password }
// 

export const signIn = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    //  Fetch user with password (select: false by default) 
    const user = await UserModel.findByEmailWithPassword(email);

    if (!user) {
      // Generic message — don't confirm whether email exists
      return next(new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    //  Check password 
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    //  Account guards 
    if (!user.isActive) {
      return next(
        new AppError('Your account has been deactivated. Please contact support.', 403, 'FORBIDDEN')
      );
    }

    //  Stamp last login (fire-and-forget) 
    user.lastLoginAt = new Date();

    //  Issue tokens 
    return sendTokenResponse(res, user, 200, 'Signed in successfully.');
  }
);

// 
// POST /api/v1/auth/logout
// 
// Clears the refresh cookie and invalidates the stored refresh token in DB.
// Protected route — user must be signed in.
// 

export const logout = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    // Invalidate the stored refresh token so it can't be reused even if
    // the client somehow retains the cookie value
    if (req.user) {
      await UserModel.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: '' },
      });
    }

    clearAuthCookies(res);

    return (res as AppResponse).success('Logged out successfully.');
  }
);

// 
// POST /api/v1/auth/refresh-token
// 
// Issues a new access token using the httpOnly refresh token cookie.
// Implements refresh token rotation — old token is replaced on every use.
//
// No body needed — token is read from cookie.
// 

export const refreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const incomingToken: string | undefined = req.cookies?.refreshToken;

    if (!incomingToken) {
      return next(new AppError('No refresh token provided. Please sign in.', 401, 'UNAUTHORIZED'));
    }

    //  Verify the JWT signature 
    let decoded: { id: string };
    try {
      decoded = jwt.verify(
        incomingToken,
        process.env.JWT_REFRESH_SECRET as string
      ) as typeof decoded;
    } catch {
      clearAuthCookies(res);
      return next(
        new AppError('Invalid or expired refresh token. Please sign in again.', 401, 'UNAUTHORIZED')
      );
    }

    //  Fetch user and verify the token matches what's stored 
    // select: false fields must be explicitly requested
    const user = await UserModel.findById(decoded.id).select('+refreshToken +passwordChangedAt');

    if (!user || !user.isActive) {
      clearAuthCookies(res);
      return next(new AppError('Session invalid. Please sign in again.', 401, 'UNAUTHORIZED'));
    }

    // Rotation check: the stored token must match the incoming one
    if (user.refreshToken !== incomingToken) {
      // Token reuse detected — possible token theft. Invalidate everything.
      await UserModel.findByIdAndUpdate(user._id, { $unset: { refreshToken: '' } });
      clearAuthCookies(res);
      return next(
        new AppError(
          'Session conflict detected. Please sign in again.',
          401,
          'TOKEN_REUSE'
        )
      );
    }

    //  Rotate: issue new access + refresh tokens 
    return sendTokenResponse(res, user, 200, 'Token refreshed.');
  }
);

// 
// GET /api/v1/auth/verify-email/:token
// 
// Verifies the user's email address using the token sent on registration.
//
// Params: token (raw token from email link)
// 

export const verifyEmail = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const hashedToken = hashToken(req.params.token);

    const user = await UserModel.findOne({
      emailVerificationToken:   hashedToken,
      emailVerificationExpires: { $gt: new Date() }, // not expired
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return next(
        new AppError(
          'Verification link is invalid or has expired. Please request a new one.',
          400,
          'INVALID_TOKEN'
        )
      );
    }

    //  Mark verified & clear token fields 
    user.isVerified                = true;
    user.emailVerificationToken    = undefined;
    user.emailVerificationExpires  = undefined;
    await user.save({ validateBeforeSave: false });

    return (res as AppResponse).success('Email verified successfully. You can now sign in.');
  }
);

// 
// POST /api/v1/auth/resend-verification
// 
// Resends the email verification link. Rate-limited by checking if a token
// was recently issued.
//
// Body: { email }
// 

export const resendVerification = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserModel.findByEmail(req.body.email).select(
      '+emailVerificationToken +emailVerificationExpires'
    );

    // Don't confirm whether email exists — just say "if registered, email sent"
    if (!user) {
      return (res as AppResponse).success(
        'If that email is registered, a verification link has been sent.'
      );
    }

    if (user.isVerified) {
      return next(new AppError('This email is already verified.', 400, 'ALREADY_VERIFIED'));
    }

    //  Basic cooldown: block if a valid token was issued within the last 5 min
    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires.getTime() - Date.now() > 23.9 * 60 * 60 * 1000
    ) {
      return next(
        new AppError(
          'A verification email was recently sent. Please check your inbox or wait 5 minutes.',
          429,
          'RATE_LIMIT'
        )
      );
    }

    const rawToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // TODO: plug email service
    console.log(`[Auth] Resend verification token for ${user.email}: ${rawToken}`);

    return (res as AppResponse).success(
      'If that email is registered, a verification link has been sent.'
    );
  }
);

// 
// POST /api/v1/auth/forgot-password
// 
// Sends a password reset link to the user's email.
// Always returns the same message regardless of whether email exists.
//
// Body: { email }
// 

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = await UserModel.findByEmail(req.body.email).select(
      '+passwordResetToken +passwordResetExpires'
    );

    // Always respond the same — never expose account existence
    const GENERIC_MESSAGE =
      'If an account with that email exists, a password reset link has been sent.';

    if (!user || !user.isActive) {
      return (res as AppResponse).success(GENERIC_MESSAGE);
    }

    //  Generate reset token (mutates user, does not save yet) 
    const rawToken = user.getPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    //  Build reset URL 
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    // TODO: plug email service
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Reset your LawTicha password',
    //   html: resetPasswordEmailTemplate(resetUrl, user.firstName),
    // });
    console.log(`[Auth] Password reset URL for ${user.email}: ${resetUrl}`);

    return (res as AppResponse).success(GENERIC_MESSAGE);
  }
);

// 
// PATCH /api/v1/auth/reset-password/:token
// 
// Resets the password using the token from the email link.
// Signs the user in immediately after reset.
//
// Params: token (raw token from email link)
// Body:   { password, confirmPassword }
// 

export const resetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const hashedToken = hashToken(req.params.token);

    const user = await UserModel.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: new Date() }, // not expired
    }).select('+passwordResetToken +passwordResetExpires +passwordChangedAt');

    if (!user) {
      return next(
        new AppError(
          'Password reset link is invalid or has expired. Please request a new one.',
          400,
          'INVALID_TOKEN'
        )
      );
    }

    //  Set new password & clear reset fields 
    // pre-save hook will hash the password
    user.password             = req.body.password;
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    // passwordChangedAt is stamped inside the pre-save hook
    await user.save();

    //  Log the user in immediately 
    return sendTokenResponse(res, user, 200, 'Password reset successfully.');
  }
);

// 
// PATCH /api/v1/auth/update-password
// 
// Allows a signed-in user to change their own password.
// Requires the current password for confirmation.
// Protected route.
//
// Body: { currentPassword, newPassword, confirmNewPassword }
// 

export const updatePassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword } = req.body;

    //  Re-fetch with password (not on req.user by default) 
    const user = await UserModel.findById(req.user!._id).select('+password +passwordChangedAt');

    if (!user) {
      return next(new AppError('User not found.', 404, 'NOT_FOUND'));
    }

    //  Verify current password 
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Your current password is incorrect.', 401, 'INVALID_CREDENTIALS'));
    }

    //  Set new password (pre-save hook hashes it & stamps passwordChangedAt) 
    user.password = newPassword;
    await user.save();

    //  Issue fresh tokens — old ones are now invalidated by changedPasswordAfter
    return sendTokenResponse(res, user, 200, 'Password updated successfully.');
  }
);

// 
// GET /api/v1/auth/me
// 
// Returns the signed-in user's profile, including their role-specific profile.
// Protected route.
// 

export const getMe = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    // req.user is already loaded by protect — just safe-strip and return
    const user = await findActiveUser(req.user!._id!.toString());

    //  Load role-specific profile 
    let profile = null;

    if (user.role === UserRole.CITIZEN) {
      const { CitizenProfileModel } = await import('../CitizenProfile.model');
      profile = await CitizenProfileModel.findOne({ userId: user._id });
    }

    if (user.role === UserRole.LAWYER) {
      const { LawyerProfileModel } = await import('../LawyerProfile.model');
      profile = await LawyerProfileModel.findOne({ userId: user._id });
    }

    return (res as AppResponse).data(
      { user: user.toSafeObject(), profile },
      'Profile fetched successfully.'
    );
  }
);

// 
// PATCH /api/v1/auth/update-profile
// 
// Updates firstName, lastName, phone, avatarUrl on the User record.
// Does NOT handle email change (that needs re-verification — separate flow).
// Protected route.
//
// Body: { firstName?, lastName?, phone?, avatarUrl? }
// 

export const updateProfile = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    // Whitelist only the fields citizens can change here
    const allowed: (keyof IUserDocument)[] = ['firstName', 'lastName', 'phone', 'avatarUrl'];
    const updates: Partial<IUserDocument> = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        (updates as any)[field] = req.body[field];
      }
    }

    const user = await UserModel.findByIdAndUpdate(
      req.user!._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return (res as AppResponse).data(
      { user: user!.toSafeObject() },
      'Profile updated successfully.'
    );
  }
);

// 
// DELETE /api/v1/auth/deactivate
// 
// Soft-deletes the user's own account. Requires password confirmation.
// Sets isActive = false. Does not delete data (GDPR export first).
// Protected route.
//
// Body: { password }
// 

export const deactivateAccount = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserModel.findById(req.user!._id).select('+password');

    if (!user) return next(new AppError('User not found.', 404, 'NOT_FOUND'));

    // Confirm password before deactivation
    if (!(await user.matchPassword(req.body.password))) {
      return next(
        new AppError('Password incorrect. Account was not deactivated.', 401, 'INVALID_CREDENTIALS')
      );
    }

    user.isActive     = false;
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });

    clearAuthCookies(res);

    return (res as AppResponse).success('Your account has been deactivated.');
  }
);
