import { Request, Response, NextFunction } from 'express';
/**
 * Creates a new citizen or lawyer account.
 * On success: creates the role-specific profile, sends verification email,
 * and returns tokens so the user is logged in immediately.
 *
 * Body: { firstName, lastName, email, password, phone?, role? }
 */
export declare const register: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * Email + password sign-in.
 * Body: { email, password }
 */
export declare const signIn: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const logout: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * Issues a new access token using the httpOnly refresh cookie.
 * Implements refresh token rotation.
 */
export declare const refreshToken: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const verifyEmail: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const resendVerification: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const forgotPassword: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const verifyResetToken: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const resetPassword: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const updatePassword: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const getMe: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const updateProfile: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const deactivateAccount: (req: Request, res: Response, next: NextFunction) => Promise<any>;
//# sourceMappingURL=auth.controller.d.ts.map