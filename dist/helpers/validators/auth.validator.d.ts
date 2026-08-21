import { Request, Response, NextFunction } from 'express';
/**
 * Validate user registration data
 * Supports both email and phone registration
 */
export declare const validateRegister: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate user sign-in
 * Supports sign-in with email, phone, or email/phone + password
 */
export declare const validateSignIn: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate forgot password request
 * Requires email OR phone
 */
export declare const validateForgotPassword: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate password reset with token
 */
export declare const validateResetPassword: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate password update for authenticated users
 */
export declare const validateUpdatePassword: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate profile update
 * Allows partial updates to user profile fields
 */
export declare const validateUpdateProfile: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.validator.d.ts.map