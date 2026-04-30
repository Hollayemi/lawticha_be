import crypto from 'crypto';
import { OtpModel } from '../models';
import { AppError } from '../middleware/error';

const OTP_TTL_MINUTES   = 10;
const MAX_ATTEMPTS      = 5;

// ─── Generate a 6-digit OTP ───────────────────────────────────────────────────

export function generateOtpCode(): string {
  // Cryptographically random 6-digit string
  return String(crypto.randomInt(100000, 999999));
}

// ─── Save OTP to DB (invalidates previous unused ones for this phone) ─────────

export async function createOtp(phone: string): Promise<string> {
  // Mark any existing unused OTPs as used so old codes can't be replayed
  await OtpModel.updateMany({ phone, used: false }, { used: true });

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await OtpModel.create({ phone, code, expiresAt, used: false, attempts: 0 });

  return code;
}

// ─── Deliver OTP (Twilio stub — swap in real SDK call here) ──────────────────

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[OTP] ${phone} → ${code}`);
    return;
  }

  // ── Production: Twilio / Termii / any SMS provider ───────────────────────
  // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  // await client.messages.create({
  //   body: `Your NURTW verification code is ${code}. Valid for ${OTP_TTL_MINUTES} minutes.`,
  //   from: process.env.TWILIO_FROM,
  //   to: `+234${phone.replace(/^0/, '')}`,
  // });
  //
  // Alternatively — Termii:
  // await axios.post('https://api.ng.termii.com/api/sms/send', {
  //   to: phone, from: 'NURTW', sms: `Your code: ${code}`,
  //   type: 'plain', channel: 'generic', api_key: process.env.TERMII_KEY,
  // });

  console.warn('[OTP] SMS provider not configured — code:', code);
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export async function verifyOtpCode(
  phone: string,
  code: string
): Promise<void> {
  const otp = await OtpModel.findOne({ phone, used: false }).sort({ createdAt: -1 });

  if (!otp) {
    throw new AppError('No active OTP found for this number. Please request a new one.', 400, 'OTP_NOT_FOUND');
  }

  if (otp.expiresAt < new Date()) {
    await OtpModel.updateOne({ _id: otp._id }, { used: true });
    throw new AppError('OTP has expired. Please request a new one.', 400, 'OTP_EXPIRED');
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    await OtpModel.updateOne({ _id: otp._id }, { used: true });
    throw new AppError('Too many incorrect attempts. Please request a new OTP.', 429, 'OTP_MAX_ATTEMPTS');
  }

  if (otp.code !== code) {
    await OtpModel.updateOne({ _id: otp._id }, { $inc: { attempts: 1 } });
    const remaining = MAX_ATTEMPTS - (otp.attempts + 1);
    throw new AppError(
      `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      400,
      'OTP_INVALID'
    );
  }

  // Mark as used
  await OtpModel.updateOne({ _id: otp._id }, { used: true });
}
