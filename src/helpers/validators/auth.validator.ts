import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/error';
import { UserRole } from '../../models/types';

// ============ Utility Functions ============

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^(\+234|0)[789][01]\d{8}$/;

function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

function isValidPhone(phone: string): boolean {
  return PHONE_RE.test(phone.replace(/\s/g, ''));
}

function collectErrors(errors: string[]): string | null {
  return errors.length ? errors.join('; ') : null;
}

// ============ Validation Helpers ============

function validateEmail(email: unknown, errors: string[], required = false): void {
  if (required && (!email || typeof email !== 'string' || !email.trim())) {
    errors.push('Email is required');
  } else if (email && typeof email === 'string' && email.trim()) {
    if (!isValidEmail(email.trim())) {
      errors.push('Please provide a valid email address');
    }
  }
}

function validatePhone(phone: unknown, errors: string[], required = false): void {
  if (required && (!phone || typeof phone !== 'string' || !phone.trim())) {
    errors.push('Phone number is required');
  } else if (phone && typeof phone === 'string' && phone.trim()) {
    if (!isValidPhone(phone.trim())) {
      errors.push('Please provide a valid Nigerian phone number (e.g., 08012345678)');
    }
  }
}

function validatePassword(password: unknown, errors: string[], required = true): void {
  if (required && (!password || typeof password !== 'string')) {
    errors.push('Password is required');
  } else if (password && typeof password === 'string') {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.push('Password must contain uppercase letter, lowercase letter, and number');
    }
  }
}

function validateName(name: unknown, fieldName: string, errors: string[]): void {
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push(`${fieldName} is required`);
  } else if (name.trim().length < 2) {
    errors.push(`${fieldName} must be at least 2 characters`);
  } else if (name.trim().length > 50) {
    errors.push(`${fieldName} must not exceed 50 characters`);
  }
}

function validateRole(role: unknown, errors: string[]): void {
  if (!role || typeof role !== 'string') {
    errors.push('Role is required');
  } else if (!Object.values(UserRole).includes(role as UserRole)) {
    errors.push(`Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`);
  }
}

// ============ Validators ============

/**
 * Validate user registration data
 * Supports both email and phone registration
 */
export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: string[] = [];
  const { email, phone, firstName, lastName, password, role } = req.body;

  // At least one contact method (email or phone) is required
  const hasEmail = email && typeof email === 'string' && email.trim();
  const hasPhone = phone && typeof phone === 'string' && phone.trim();

  if (!hasEmail && !hasPhone) {
    errors.push('Either email or phone number is required');
  }

  // Validate provided contact methods
  validateEmail(email, errors, false);
  validatePhone(phone, errors, false);

  // Validate names
  validateName(firstName, 'First name', errors);
  validateName(lastName, 'Last name', errors);

  // Validate password
  validatePassword(password, errors, true);

  // Validate role (optional, defaults to CITIZEN)
  if (role) {
    validateRole(role, errors);
  }

  const msg = collectErrors(errors);
  if (msg) return next(new AppError(msg, 400, 'VALIDATION_ERROR'));
  next();
};

/**
 * Validate user sign-in
 * Supports sign-in with email, phone, or email/phone + password
 */
export const validateSignIn = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: string[] = [];
  const { email, phone, password } = req.body;

  const hasEmail = email && typeof email === 'string' && email.trim();
  const hasPhone = phone && typeof phone === 'string' && phone.trim();

  if (!hasEmail && !hasPhone) {
    errors.push('Please provide either email or phone number');
  }

  // Validate provided identifier
  if (hasEmail) {
    validateEmail(email, errors, true);
  }
  if (hasPhone) {
    validatePhone(phone, errors, true);
  }

  // Validate password
  validatePassword(password, errors, true);

  const msg = collectErrors(errors);
  if (msg) return next(new AppError(msg, 400, 'VALIDATION_ERROR'));
  next();
};

/**
 * Validate forgot password request
 * Requires email OR phone
 */
export const validateForgotPassword = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: string[] = [];
  const { email, phone } = req.body;

  const hasEmail = email && typeof email === 'string' && email.trim();
  const hasPhone = phone && typeof phone === 'string' && phone.trim();

  if (!hasEmail && !hasPhone) {
    errors.push('Please provide either email or phone number');
  }

  if (hasEmail) {
    validateEmail(email, errors, true);
  }
  if (hasPhone) {
    validatePhone(phone, errors, true);
  }

  const msg = collectErrors(errors);
  if (msg) return next(new AppError(msg, 400, 'VALIDATION_ERROR'));
  next();
};

/**
 * Validate password reset with token
 */
export const validateResetPassword = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: string[] = [];
  const { token, newPassword } = req.body;

  if (!token || typeof token !== 'string' || !token.trim()) {
    errors.push('Reset token is required');
  }

  validatePassword(newPassword, errors, true);

  const msg = collectErrors(errors);
  if (msg) return next(new AppError(msg, 400, 'VALIDATION_ERROR'));
  next();
};

/**
 * Validate password update for authenticated users
 */
export const validateUpdatePassword = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: string[] = [];
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.push('Current password is required');
  }

  validatePassword(newPassword, errors, true);

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push('New password must be different from current password');
  }

  const msg = collectErrors(errors);
  if (msg) return next(new AppError(msg, 400, 'VALIDATION_ERROR'));
  next();
};

/**
 * Validate profile update
 * Allows partial updates to user profile fields
 */
export const validateUpdateProfile = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: string[] = [];
  const { email, phone, firstName, lastName, avatarUrl } = req.body;

  // At least one field to update
  const hasUpdate = email || phone || firstName || lastName || avatarUrl;
  if (!hasUpdate) {
    errors.push('At least one field to update is required');
  }

  // Validate fields if provided
  if (email !== undefined) {
    validateEmail(email, errors, false);
    
    // Check if email is being cleared (not allowed)
    if (email === '' || email === null) {
      errors.push('Email cannot be removed');
    }
  }

  if (phone !== undefined) {
    validatePhone(phone, errors, false);
    
    // Check if phone is being cleared (not allowed if no email)
    if (phone === '' || phone === null) {
      errors.push('Phone number cannot be removed if it\'s your only contact method');
    }
  }

  if (firstName !== undefined) {
    if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
      errors.push('First name cannot be empty');
    } else if (firstName.trim().length < 2 || firstName.trim().length > 50) {
      errors.push('First name must be between 2 and 50 characters');
    }
  }

  if (lastName !== undefined) {
    if (!lastName || typeof lastName !== 'string' || !lastName.trim()) {
      errors.push('Last name cannot be empty');
    } else if (lastName.trim().length < 2 || lastName.trim().length > 50) {
      errors.push('Last name must be between 2 and 50 characters');
    }
  }

  if (avatarUrl !== undefined && avatarUrl !== null && typeof avatarUrl !== 'string') {
    errors.push('Avatar URL must be a string');
  }

  const msg = collectErrors(errors);
  if (msg) return next(new AppError(msg, 400, 'VALIDATION_ERROR'));
  next();
};