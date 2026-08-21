import { Response } from 'express';
import { Types } from 'mongoose';
import { IUserDocument } from '../models/User.model';
/**
 * Signs both tokens, sets the httpOnly refresh cookie, and returns the
 * standardised JSON response. Used by: register, signIn, refreshToken,
 * resetPassword, updatePassword.
 */
export declare function sendTokenResponse(res: Response, user: IUserDocument, statusCode?: number, message?: string): Response;
export declare function clearAuthCookies(res: Response): void;
/** Hash a raw token before comparing against the stored hash in DB */
export declare function hashToken(raw: string): string;
export declare function findActiveUser(id: string | Types.ObjectId): Promise<IUserDocument>;
/**
 * After a new User is created, spin up their role-specific profile record.
 *
 * Citizen → CitizenProfile (XP, gamification, preferences)
 * Lawyer  → LawyerProfile skeleton (verification status: pending)
 *           The lawyer still needs to complete onboarding (SCN number, docs, etc.)
 */
export declare function createProfileAfterRegister(user: IUserDocument): Promise<void>;
/**
 * Load the role-specific profile for a user.
 * Returns null when no profile is found (shouldn't happen post-registration).
 */
export declare function loadUserProfile(user: IUserDocument): Promise<any>;
//# sourceMappingURL=auth.service.d.ts.map