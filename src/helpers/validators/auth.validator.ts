import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/error';
import { UserRole } from '../../models/types';

// ─── Utility ─────────────────────────────────────────────────────────────────

const NIGERIAN_PHONE_RE = /^(\+234|0)[789][01]\d{8}$/;
const PLATE_RE = /^[A-Z]{2,3}[-\s]?\d{3}[A-Z]{2,3}$/i;

function isValidPhone(phone: string): boolean {
  return NIGERIAN_PHONE_RE.test(phone.replace(/\s/g, ''));
}

function collectErrors(errors: string[]): string | null {
  return errors.length ? errors.join('; ') : null;
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function validatePassword(password: unknown, errors: string[]): void {
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.push('Password must contain uppercase, lowercase and a number');
  }
}

function validatePhone(phone: unknown, errors: string[], label = 'Phone'): void {
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    errors.push(`${label} number is required`);
  } else if (!isValidPhone(phone.trim())) {
    errors.push(`${label} must be a valid Nigerian number (e.g. 08012345678)`);
  }
}

function validateFullName(name: unknown, errors: string[]): void {
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Full name is required');
  } else if (name.trim().length < 3) {
    errors.push('Full name must be at least 3 characters');
  } else if (name.trim().length > 120) {
    errors.push('Full name must not exceed 120 characters');
  }
}

// ─── Login ───────────────────────────────────────────────────────────────────

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: string[] = [];
  const { phone, password } = req.body;

  validatePhone(phone, errors);
  validatePassword(password, errors);

  const msg = collectErrors(errors);
  if (msg) return next(new AppError(msg, 400, 'VALIDATION_ERROR'));
  next();
};

// ─── Government Onboarding ───────────────────────────────────────────────────

export const validateGovernmentRegister = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: string[] = [];
  const { fullName, phone, password, stateName, govBaseTicketPrice } = req.body;

  validateFullName(fullName, errors);
  validatePhone(phone, errors);
  validatePassword(password, errors);

  if (!stateName || typeof stateName !== 'string' || !stateName.trim()) {
    errors.push('State name is required');
  } else if (stateName.trim().length > 80) {
    errors.push('State name is too long');
  }

  if (govBaseTicketPrice !== undefined) {
    const price = Number(govBaseTicketPrice);
    if (isNaN(price) || price <= 0) {
      errors.push('Government base ticket price must be a positive number');
    }
  }

  const msg = collectErrors(errors);
  if (msg) return next(new AppError(msg, 400, 'VALIDATION_ERROR'));
  next();
};

// ─── LGA Onboarding ──────────────────────────────────────────────────────────

export const validateLGARegister = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: string[] = [];
  const { fullName, phone, password, lgaName, govId } = req.body;

  validateFullName(fullName, errors);
  validatePhone(phone, errors);
  validatePassword(password, errors);

  if (!lgaName || typeof lgaName !== 'string' || !lgaName.trim()) {
    errors.push('LGA name is required');
  } else if (lgaName.trim().length > 100) {
    errors.push('LGA name is too long');
  }

  if (!govId || typeof govId !== 'string' || !govId.trim()) {
    errors.push('Government ID (govId) is required');
  }

  const msg = collectErrors(errors);
  if (msg) return next(new AppError(msg, 400, 'VALIDATION_ERROR'));
  next();
};

// ─── Union Onboarding ────────────────────────────────────────────────────────

export const validateUnionRegister = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: string[] = [];
  const {
    fullName,
    phone,
    password,
    unionName,
    unionCode,
    lgaId,
    govBasePrice,
    unionLevy,
  } = req.body;

  validateFullName(fullName, errors);
  validatePhone(phone, errors);
  validatePassword(password, errors);

  if (!unionName || typeof unionName !== 'string' || !unionName.trim()) {
    errors.push('Union name is required');
  }

  if (!unionCode || typeof unionCode !== 'string') {
    errors.push('Union code is required (4 uppercase letters, e.g. IKJA)');
  } else if (!/^[A-Z]{4}$/.test(unionCode.trim().toUpperCase())) {
    errors.push('Union code must be exactly 4 uppercase letters');
  }

  if (!lgaId || typeof lgaId !== 'string' || !lgaId.trim()) {
    errors.push('LGA ID (lgaId) is required');
  }

  if (govBasePrice !== undefined) {
    const price = Number(govBasePrice);
    if (isNaN(price) || price < 0) {
      errors.push('Government base price must be a non-negative number');
    }
  }

  if (unionLevy !== undefined) {
    const levy = Number(unionLevy);
    if (isNaN(levy) || levy < 0) {
      errors.push('Union levy must be a non-negative number');
    }
  }

  const msg = collectErrors(errors);
  if (msg) return next(new AppError(msg, 400, 'VALIDATION_ERROR'));
  next();
};

// ─── Ticket Seller Onboarding ────────────────────────────────────────────────

export const validateSellerRegister = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: string[] = [];
  const { fullName, phone, password, unionId } = req.body;

  validateFullName(fullName, errors);
  validatePhone(phone, errors);
  validatePassword(password, errors);

  if (!unionId || typeof unionId !== 'string' || !unionId.trim()) {
    errors.push('Union ID (unionId) is required to register a seller');
  }

  const msg = collectErrors(errors);
  if (msg) return next(new AppError(msg, 400, 'VALIDATION_ERROR'));
  next();
};

// ─── Rider Onboarding ────────────────────────────────────────────────────────

export const validateRiderRegister = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: string[] = [];
  const { fullName, phone, password, unionId, vehicleType, vehicleNumber } =
    req.body;

  validateFullName(fullName, errors);
  validatePhone(phone, errors);
  validatePassword(password, errors);

  if (!unionId || typeof unionId !== 'string' || !unionId.trim()) {
    errors.push('Union ID (unionId) is required');
  }

  const allowedVehicleTypes = ['okada', 'tricycle'];
  if (!vehicleType || !allowedVehicleTypes.includes(vehicleType)) {
    errors.push(`Vehicle type must be one of: ${allowedVehicleTypes.join(', ')}`);
  }

  if (!vehicleNumber || typeof vehicleNumber !== 'string' || !vehicleNumber.trim()) {
    errors.push('Vehicle number is required');
  }

  const msg = collectErrors(errors);
  if (msg) return next(new AppError(msg, 400, 'VALIDATION_ERROR'));
  next();
};

// ─── Change Password ──────────────────────────────────────────────────────────

export const validateChangePassword = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: string[] = [];
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword) errors.push('Current password is required');

  validatePassword(newPassword, errors);

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push('New password must be different from current password');
  }

  const msg = collectErrors(errors);
  if (msg) return next(new AppError(msg, 400, 'VALIDATION_ERROR'));
  next();
};
