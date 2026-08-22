"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateAccount = exports.updateProfile = exports.getMe = exports.updatePassword = exports.resetPassword = exports.verifyResetToken = exports.forgotPassword = exports.resendVerification = exports.verifyEmail = exports.refreshToken = exports.logout = exports.signIn = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_1 = require("../middleware/error");
const User_model_1 = require("../models/User.model");
const types_1 = require("../models/types");
const auth_service_1 = require("../services/auth.service");
const emailService_1 = __importDefault(require("../services/email/emailService"));
const types_2 = require("../services/email/types");
//  POST /api/v1/auth/register 
/**
 * Creates a new citizen or lawyer account.
 * On success: creates the role-specific profile, sends verification email,
 * and returns tokens so the user is logged in immediately.
 *
 * Body: { firstName, lastName, email, password, phone?, role? }
 */
exports.register = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { firstName, lastName, email, password, phone, role = types_1.UserRole.CITIZEN, } = req.body;
    // Block admin self-registration
    if (role === types_1.UserRole.ADMIN) {
        return next(new error_1.AppError('Admin accounts cannot be self-registered.', 403, 'FORBIDDEN'));
    }
    const user = await User_model_1.UserModel.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email?.toLowerCase().trim(),
        phone: phone?.trim(),
        password,
        role,
        authProvider: 'email',
    });
    // Send email verification
    const rawToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}`;
    emailService_1.default.send(user.email, types_2.EmailTemplateType.VERIFY_EMAIL, {
        name: user.firstName,
        verifyUrl,
        expiresInHours: 24,
    }).catch((err) => console.error('[Auth] Failed to send verification email:', err));
    // Spin up role-specific profile
    await (0, auth_service_1.createProfileAfterRegister)(user);
    return (0, auth_service_1.sendTokenResponse)(res, user, 201, 'Account created. Please verify your email.');
});
//  POST /api/v1/auth/signin 
/**
 * Email + password sign-in.
 * Body: { email, password }
 */
exports.signIn = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User_model_1.UserModel.findByEmailWithPassword(email);
    if (!user) {
        return next(new error_1.AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        return next(new error_1.AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    }
    if (!user.isActive) {
        return next(new error_1.AppError('Your account has been deactivated. Please contact support.', 403, 'FORBIDDEN'));
    }
    // Stamp last login (fire-and-forget)
    User_model_1.UserModel.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).exec();
    return (0, auth_service_1.sendTokenResponse)(res, user, 200, 'Signed in successfully.');
});
//  POST /api/v1/auth/logout 
exports.logout = (0, error_1.asyncHandler)(async (req, res, _next) => {
    if (req.user) {
        await User_model_1.UserModel.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: '' } });
    }
    (0, auth_service_1.clearAuthCookies)(res);
    return res.success('Logged out successfully.');
});
//  POST /api/v1/auth/refresh-token 
/**
 * Issues a new access token using the httpOnly refresh cookie.
 * Implements refresh token rotation.
 */
exports.refreshToken = (0, error_1.asyncHandler)(async (req, res, next) => {
    const incomingToken = req.cookies?.refreshToken;
    if (!incomingToken) {
        return next(new error_1.AppError('No refresh token. Please sign in.', 401, 'UNAUTHORIZED'));
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(incomingToken, process.env.JWT_REFRESH_SECRET);
    }
    catch {
        (0, auth_service_1.clearAuthCookies)(res);
        return next(new error_1.AppError('Invalid or expired refresh token. Please sign in again.', 401, 'UNAUTHORIZED'));
    }
    const user = await User_model_1.UserModel.findById(decoded.id).select('+refreshToken +passwordChangedAt');
    if (!user || !user.isActive) {
        (0, auth_service_1.clearAuthCookies)(res);
        return next(new error_1.AppError('Session invalid. Please sign in again.', 401, 'UNAUTHORIZED'));
    }
    // Rotation check,  detect token reuse
    if (user.refreshToken !== incomingToken) {
        await User_model_1.UserModel.findByIdAndUpdate(user._id, { $unset: { refreshToken: '' } });
        (0, auth_service_1.clearAuthCookies)(res);
        return next(new error_1.AppError('Session conflict detected. Please sign in again.', 401, 'TOKEN_REUSE'));
    }
    return (0, auth_service_1.sendTokenResponse)(res, user, 200, 'Token refreshed.');
});
//  GET /api/v1/auth/verify-email/:token 
exports.verifyEmail = (0, error_1.asyncHandler)(async (req, res, next) => {
    const hashedToken = (0, auth_service_1.hashToken)(req.params.token);
    const user = await User_model_1.UserModel.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');
    if (!user) {
        return next(new error_1.AppError('Verification link is invalid or has expired.', 400, 'INVALID_TOKEN'));
    }
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return res.success('Email verified successfully. You can now sign in.');
});
//  POST /api/v1/auth/resend-verification 
exports.resendVerification = (0, error_1.asyncHandler)(async (req, res, next) => {
    const GENERIC = 'If that email is registered, a verification link has been sent.';
    const user = await User_model_1.UserModel.findOne({ email: req.body.email }).select('+emailVerificationToken +emailVerificationExpires');
    if (!user)
        return res.success(GENERIC);
    if (user.isVerified) {
        return next(new error_1.AppError('This email is already verified.', 400, 'ALREADY_VERIFIED'));
    }
    // Rate limit: block if a token was issued within the last 5 min
    if (user.emailVerificationExpires &&
        user.emailVerificationExpires.getTime() - Date.now() > 23.9 * 60 * 60 * 1000) {
        return next(new error_1.AppError('A verification email was recently sent. Please wait a few minutes.', 429, 'RATE_LIMIT'));
    }
    const rawToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}`;
    emailService_1.default.send(user.email, types_2.EmailTemplateType.VERIFY_EMAIL, {
        name: user.firstName,
        verifyUrl,
        expiresInHours: 24,
    }).catch((err) => console.error('[Auth] Failed to send verification email:', err));
    return res.success(GENERIC);
});
//  POST /api/v1/auth/forgot-password 
exports.forgotPassword = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const GENERIC = 'If an account with that email exists, a password reset link has been sent.';
    const user = await User_model_1.UserModel
        .findOne({ email: req.body.email })
        ?.select('+passwordResetToken +passwordResetExpires');
    if (!user || !user.isActive)
        return res.success(GENERIC);
    const rawToken = user.getPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;
    console.log(`[Auth] Sending password reset email to ${user.email} with link: ${resetUrl}`);
    emailService_1.default.send(user.email, types_2.EmailTemplateType.FORGOT_PASSWORD, {
        name: user.firstName,
        resetUrl,
        expiresInMinutes: 10,
    }).catch((err) => console.error('[Auth] Failed to send password reset email:', err));
    return res.success(GENERIC);
});
//  PATCH /api/v1/auth/validate-reset-token/:token
exports.verifyResetToken = (0, error_1.asyncHandler)(async (req, res, next) => {
    const hashedToken = (0, auth_service_1.hashToken)(req.params.token);
    const user = await User_model_1.UserModel.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires +passwordChangedAt');
    if (!user) {
        return next(new error_1.AppError('Password reset link is invalid or has expired.', 400, 'INVALID_TOKEN'));
    }
    return res.success('Password reset token is valid.');
});
//  PATCH /api/v1/auth/reset-password/:token 
exports.resetPassword = (0, error_1.asyncHandler)(async (req, res, next) => {
    const hashedToken = (0, auth_service_1.hashToken)(req.params.token);
    const user = await User_model_1.UserModel.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires +passwordChangedAt');
    if (!user) {
        return next(new error_1.AppError('Password reset link is invalid or has expired.', 400, 'INVALID_TOKEN'));
    }
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    emailService_1.default.send(user.email, types_2.EmailTemplateType.PASSWORD_CHANGED, {
        name: user.firstName,
    }).catch((err) => console.error('[Auth] Failed to send password-changed email:', err));
    return (0, auth_service_1.sendTokenResponse)(res, user, 200, 'Password reset successfully.');
});
//  PATCH /api/v1/auth/update-password 
exports.updatePassword = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User_model_1.UserModel.findById(req.user._id).select('+password +passwordChangedAt');
    if (!user)
        return next(new error_1.AppError('User not found.', 404, 'NOT_FOUND'));
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
        return next(new error_1.AppError('Your current password is incorrect.', 401, 'INVALID_CREDENTIALS'));
    }
    user.password = newPassword;
    await user.save();
    return (0, auth_service_1.sendTokenResponse)(res, user, 200, 'Password updated successfully.');
});
//  GET /api/v1/auth/me 
exports.getMe = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const user = await (0, auth_service_1.findActiveUser)(req.user._id.toString());
    const profile = await (0, auth_service_1.loadUserProfile)(user);
    return res.data({ user: user.toSafeObject(), profile }, 'Profile fetched successfully.');
});
//  PATCH /api/v1/auth/update-profile 
// Updates core User fields only (firstName, lastName, phone, avatarUrl).
// Role-specific profile fields go through their own routes.
exports.updateProfile = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const ALLOWED = ['firstName', 'lastName', 'phone', 'avatarUrl'];
    const updates = {};
    for (const field of ALLOWED) {
        if (req.body[field] !== undefined)
            updates[field] = req.body[field];
    }
    const user = await User_model_1.UserModel.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    return res.data({ user: user.toSafeObject() }, 'Profile updated.');
});
//  DELETE /api/v1/auth/deactivate 
exports.deactivateAccount = (0, error_1.asyncHandler)(async (req, res, next) => {
    const user = await User_model_1.UserModel.findById(req.user._id).select('+password');
    if (!user)
        return next(new error_1.AppError('User not found.', 404, 'NOT_FOUND'));
    if (!(await user.matchPassword(req.body.password))) {
        return next(new error_1.AppError('Password incorrect. Account was not deactivated.', 401, 'INVALID_CREDENTIALS'));
    }
    user.isActive = false;
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });
    (0, auth_service_1.clearAuthCookies)(res);
    return res.success('Your account has been deactivated.');
});
//# sourceMappingURL=auth.controller.js.map