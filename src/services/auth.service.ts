import crypto from 'crypto';
import { Response } from 'express';
import { Types } from 'mongoose';
import { IUserDocument, UserModel } from '../models/User.model';
import { CitizenProfileModel } from '../models/CitizenProfile.model';
import { LawyerProfileModel }  from '../models/LawyerProfile.model';
import { AppError } from '../middleware/error';
import { UserRole } from '../models/types';

//  Cookie config 

const BASE_COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path:     '/',
};

const REFRESH_TTL_MS =
  Number(process.env.JWT_REFRESH_COOKIE_DAYS ?? 30) * 24 * 60 * 60 * 1000;

//  sendTokenResponse 
/**
 * Signs both tokens, sets the httpOnly refresh cookie, and returns the
 * standardised JSON response. Used by: register, signIn, refreshToken,
 * resetPassword, updatePassword.
 */
export function sendTokenResponse(
  res:        Response,
  user:       IUserDocument,
  statusCode: number = 200,
  message:    string = 'Success'
): Response {
  const accessToken  = user.signAccessToken();
  const refreshToken = user.signRefreshToken(); // also mutates user.refreshToken

  // Persist the stored refresh token (fire-and-forget,  don't block response)
  user.save({ validateBeforeSave: false }).catch(console.error);

  res.cookie('refreshToken', refreshToken, {
    ...BASE_COOKIE_OPTS,
    expires: new Date(Date.now() + REFRESH_TTL_MS),
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
    ...BASE_COOKIE_OPTS,
    expires: new Date(0),
  });
}

//  hashToken 
/** Hash a raw token before comparing against the stored hash in DB */
export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

//  findActiveUser 

export async function findActiveUser(id: string | Types.ObjectId): Promise<IUserDocument> {
  const user = await UserModel.findById(id);
  if (!user)          throw new AppError('User not found.', 404, 'NOT_FOUND');
  if (!user.isActive) throw new AppError('Your account has been deactivated.', 403, 'FORBIDDEN');
  return user;
}

//  createProfileAfterRegister 
/**
 * After a new User is created, spin up their role-specific profile record.
 *
 * Citizen → CitizenProfile (XP, gamification, preferences)
 * Lawyer  → LawyerProfile skeleton (verification status: pending)
 *           The lawyer still needs to complete onboarding (SCN number, docs, etc.)
 */
export async function createProfileAfterRegister(user: IUserDocument): Promise<void> {
  if (user.role === UserRole.CITIZEN) {
    await CitizenProfileModel.create({ userId: user._id });
  }

  if (user.role === UserRole.LAWYER) {
    await LawyerProfileModel.create({
      userId: user._id,
      fees:   { message: 0, call: 0, video: 0 },
      // verificationStatus defaults to 'pending' in the schema
    });
  }
}

//  loadUserProfile 
/**
 * Load the role-specific profile for a user.
 * Returns null when no profile is found (shouldn't happen post-registration).
 */
export async function loadUserProfile(user: IUserDocument) {
  if (user.role === UserRole.CITIZEN) {
    return CitizenProfileModel.findOne({ userId: user._id });
  }
  if (user.role === UserRole.LAWYER) {
    return LawyerProfileModel.findOne({ userId: user._id });
  }
  return null;
}