import { Router } from 'express';
import {
  register,
  signIn,
  logout,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  updatePassword,
  getMe,
  updateProfile,
  deactivateAccount,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import {
  validateRegister,
  validateSignIn,
  validateForgotPassword,
  validateResetPassword,
  validateUpdatePassword,
  validateUpdateProfile,
} from '../helpers/validators/auth.validator';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Create a new citizen or lawyer account
 * @access  Public
 * @body    { firstName, lastName, email, password, phone?, role }
 */
router.post('/register', validateRegister, register);

/**
 * @route   POST /api/v1/auth/signin
 * @desc    Sign in with email + password → returns access token + sets refresh cookie
 * @access  Public
 * @body    { email, password }
 */
router.post('/signin', validateSignIn, signIn);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Issue new access token using httpOnly refresh cookie (also rotates refresh token)
 * @access  Public (uses cookie)
 */
router.post('/refresh-token', refreshToken);

/**
 * @route   GET /api/v1/auth/verify-email/:token
 * @desc    Verify email address from the link sent on registration
 * @access  Public
 * @param   token,  raw token from the email link
 */
router.get('/verify-email/:token', verifyEmail);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification link
 * @access  Public
 * @body    { email }
 */
router.post('/resend-verification', resendVerification);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send a password reset link to the user's email
 * @access  Public
 * @body    { email }
 */
router.post('/forgot-password', validateForgotPassword, forgotPassword);

/**
 * @route   PATCH /api/v1/auth/reset-password/:token
 * @desc    Set a new password using the token from the reset email
 * @access  Public
 * @param   token,  raw token from the email link
 * @body    { password, confirmPassword }
 */
router.patch('/reset-password/:token', validateResetPassword, resetPassword);

// 
// PROTECTED,  valid access token required
// 

router.use(protect); // everything below this line is protected

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get signed-in user's profile + role-specific profile
 * @access  Protected
 */
router.get('/me', getMe);

/**
 * @route   PATCH /api/v1/auth/update-profile
 * @desc    Update firstName, lastName, phone, avatarUrl
 * @access  Protected
 * @body    { firstName?, lastName?, phone?, avatarUrl? }
 */
router.patch('/update-profile', validateUpdateProfile, updateProfile);

/**
 * @route   PATCH /api/v1/auth/update-password
 * @desc    Change password (requires current password)
 * @access  Protected
 * @body    { currentPassword, newPassword, confirmNewPassword }
 */
router.patch('/update-password', validateUpdatePassword, updatePassword);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Clear refresh cookie + invalidate stored refresh token in DB
 * @access  Protected
 */
router.post('/logout', logout);

/**
 * @route   DELETE /api/v1/auth/deactivate
 * @desc    Soft-delete own account (requires password confirmation)
 * @access  Protected
 * @body    { password }
 */
router.delete('/deactivate', deactivateAccount);

export default router;