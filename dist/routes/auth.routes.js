"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const auth_validator_1 = require("../helpers/validators/auth.validator");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/v1/auth/register
 * @desc    Create a new citizen or lawyer account
 * @access  Public
 * @body    { firstName, lastName, email, password, phone?, role }
 */
router.post('/register', auth_validator_1.validateRegister, auth_controller_1.register);
/**
 * @route   POST /api/v1/auth/signin
 * @desc    Sign in with email + password → returns access token + sets refresh cookie
 * @access  Public
 * @body    { email, password }
 */
router.post('/signin', auth_validator_1.validateSignIn, auth_controller_1.signIn);
/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Issue new access token using httpOnly refresh cookie (also rotates refresh token)
 * @access  Public (uses cookie)
 */
router.post('/refresh-token', auth_controller_1.refreshToken);
/**
 * @route   GET /api/v1/auth/verify-email/:token
 * @desc    Verify email address from the link sent on registration
 * @access  Public
 * @param   token,  raw token from the email link
 */
router.get('/verify-email/:token', auth_controller_1.verifyEmail);
/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification link
 * @access  Public
 * @body    { email }
 */
router.post('/resend-verification', auth_controller_1.resendVerification);
/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send a password reset link to the user's email
 * @access  Public
 * @body    { email }
 */
router.post('/forgot-password', auth_validator_1.validateForgotPassword, auth_controller_1.forgotPassword);
/**
 * @route   PATCH /api/v1/auth/reset-password/:token
 * @desc    Set a new password using the token from the reset email
 * @access  Public
 * @param   token,  raw token from the email link
 * @body    { password, confirmPassword }
 */
router.patch('/reset-password/:token', auth_validator_1.validateResetPassword, auth_controller_1.resetPassword);
// 
// PROTECTED,  valid access token required
// 
router.use(auth_middleware_1.protect); // everything below this line is protected
/**
 * @route   GET /api/v1/auth/me
 * @desc    Get signed-in user's profile + role-specific profile
 * @access  Protected
 */
router.get('/me', auth_controller_1.getMe);
/**
 * @route   PATCH /api/v1/auth/update-profile
 * @desc    Update firstName, lastName, phone, avatarUrl
 * @access  Protected
 * @body    { firstName?, lastName?, phone?, avatarUrl? }
 */
router.patch('/update-profile', auth_validator_1.validateUpdateProfile, auth_controller_1.updateProfile);
/**
 * @route   PATCH /api/v1/auth/update-password
 * @desc    Change password (requires current password)
 * @access  Protected
 * @body    { currentPassword, newPassword, confirmNewPassword }
 */
router.patch('/update-password', auth_validator_1.validateUpdatePassword, auth_controller_1.updatePassword);
/**
 * @route   POST /api/v1/auth/logout
 * @desc    Clear refresh cookie + invalidate stored refresh token in DB
 * @access  Protected
 */
router.post('/logout', auth_controller_1.logout);
/**
 * @route   DELETE /api/v1/auth/deactivate
 * @desc    Soft-delete own account (requires password confirmation)
 * @access  Protected
 * @body    { password }
 */
router.delete('/deactivate', auth_controller_1.deactivateAccount);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map