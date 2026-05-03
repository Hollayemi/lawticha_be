import crypto from 'crypto';
import { Response } from 'express';
import { UserModel, IUserDocument } from '../User.model';
import { AppError } from '../middleware/error';
import { UserRole } from '../types';

//  Cookie config 

const COOKIE_OPTIONS = {
  httpOnly: true,                                          // JS can't touch it
  secure: process.env.NODE_ENV === 'production',           // HTTPS only in prod
  sameSite: 'strict' as const,
  path: '/',
};

const REFRESH_COOKIE_TTL_MS =
  Number(process.env.JWT_REFRESH_COOKIE_DAYS ?? 30) * 24 * 60 * 60 * 1000;

//  sendTokenResponse 
// Single function that signs both tokens, sets the refresh cookie, and returns
// the standardised response shape. Called by register, signIn, refreshToken.

export function sendTokenResponse(
  res: Response,
  user: IUserDocument,
  statusCode = 200,
  message = 'Success'
): Response {
  const accessToken  = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken(); // also sets user.refreshToken

  // Persist the stored refresh token (getRefreshToken mutated the doc)
  // We call save() fire-and-forget — don't await in the response path
  user.save({ validateBeforeSave: false }).catch(console.error);

  // httpOnly cookie for refresh token
  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_OPTIONS,
    expires: new Date(Date.now() + REFRESH_COOKIE_TTL_MS),
  });

  return res.status(statusCode).json({
    success: true,
    message,
    data: {
      accessToken,
      user: user.toSafeObject(),
    },
  });
}

//  clearAuthCookies 

export function clearAuthCookies(res: Response): void {
  res.cookie('refreshToken', '', {
    ...COOKIE_OPTIONS,
    expires: new Date(0), // immediately expired
  });
}

//  hashToken 
// Hash a raw token before comparing against the stored hash.

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

//  findActiveUser 
// Shared lookup used across multiple service calls.

export async function findActiveUser(id: string): Promise<IUserDocument> {
  const user = await UserModel.findById(id);
  if (!user)       throw new AppError('User not found.', 404, 'NOT_FOUND');
  if (!user.isActive) throw new AppError('Your account has been deactivated.', 403, 'FORBIDDEN');
  return user;
}

//  createProfileAfterRegister 
// After a new user is created, spin up their role-specific profile.
// Imported lazily to avoid circular deps.

export async function createProfileAfterRegister(user: IUserDocument): Promise<void> {
  if (user.role === UserRole.CITIZEN) {
    const { CitizenProfileModel } = await import('../CitizenProfile.model');
    await CitizenProfileModel.create({ userId: user._id });
  }

  if (user.role === UserRole.LAWYER) {
    // LawyerProfile can't be fully created here — they still need to submit
    // their NBA number etc. via a separate onboarding flow.
    // We create a skeleton record so the profile endpoint always resolves.
    const { LawyerProfileModel } = await import('../LawyerProfile.model');
    await LawyerProfileModel.create({
      userId: user._id,
      nbaNumber:   'PENDING',
      yearOfCall:  0,
      fees:        { message: 0, call: 0, video: 0 },
      verificationStatus: 'pending',
    });
  }
}
