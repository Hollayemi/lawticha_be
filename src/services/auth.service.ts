import {
  UserModel,
  OtpModel,
} from '../models';
import { UserRole } from '../models/types';
import { AppError } from '../middleware/error';
import { createOtp, sendOtpSms, verifyOtpCode } from '../helpers/otp.helper';

// ─── Send OTP ─────────────────────────────────────────────────────────────────

export async function sendOtp(phone: string) {
  const normalised = phone.trim();

  const user = await UserModel.findOne({ phone: normalised });
  if (!user) {
    throw new AppError(
      'No account found with this phone number. Please contact your administrator.',
      404,
      'NOT_FOUND'
    );
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403, 'FORBIDDEN');
  }

  const code = await createOtp(normalised);
  await sendOtpSms(normalised, code);

  return { phone: normalised, message: 'OTP sent successfully', expiresIn: 600 };
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export async function verifyOtp(phone: string, code: string) {
  const normalised = phone.trim();

  await verifyOtpCode(normalised, code);

  const user = await UserModel.findOne({ phone: normalised });
  if (!user) throw new AppError('Account not found', 404);

  // Stamp last login (fire-and-forget)
  UserModel.updateOne({ _id: user._id }, { lastLogin: new Date() }).exec();

  return { user };
}

// ─── Resend OTP ───────────────────────────────────────────────────────────────

export async function resendOtp(phone: string) {
  // 60-second cooldown
  const recent = await OtpModel.findOne({
    phone: phone.trim(),
    used: false,
    createdAt: { $gte: new Date(Date.now() - 60_000) },
  });

  if (recent) {
    throw new AppError('Please wait 60 seconds before requesting a new OTP.', 429, 'RATE_LIMIT');
  }

  return sendOtp(phone);
}

// ─── Get My Profile ───────────────────────────────────────────────────────────

export async function getMyProfile(userId: string, role: UserRole) {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  let profile: Record<string, unknown> | null = null;


  return { user, profile };
}
