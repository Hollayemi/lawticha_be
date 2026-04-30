import { Router } from 'express';
import {
  sendOtpHandler,
  verifyOtpHandler,
  resendOtpHandler,
  refreshTokenHandler,
  logoutHandler,
  getMeHandler,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth';

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

/** Step 1: request OTP */
router.post('/send-otp', sendOtpHandler);

/** Step 2: submit OTP → receive access + refresh tokens */
router.post('/verify-otp', verifyOtpHandler);

/** Resend OTP (60 s cooldown) */
router.post('/resend-otp', resendOtpHandler);

/** Issue new access token from httpOnly refresh cookie */
router.post('/refresh-token', refreshTokenHandler);

// ─── Protected ────────────────────────────────────────────────────────────────

router.use(protect);

router.post('/logout', logoutHandler);

/** Returns user + role profile */
router.get('/me', getMeHandler);

export default router;
