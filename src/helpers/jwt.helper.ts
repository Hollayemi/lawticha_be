import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { Types } from 'mongoose';
import { UserRole } from '../models/types';

export interface JwtPayload {
  id: string;
  role: UserRole;
}

// ─── Sign access token ────────────────────────────────────────────────────────

export const signAccessToken = (id: Types.ObjectId, role: UserRole): string => {
  return jwt.sign(
    { id: id.toString(), role } as JwtPayload,
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRE || '15m' } as jwt.SignOptions
  );
};

// ─── Sign refresh token ───────────────────────────────────────────────────────

export const signRefreshToken = (id: Types.ObjectId, role: UserRole): string => {
  return jwt.sign(
    { id: id.toString(), role } as JwtPayload,
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' } as jwt.SignOptions
  );
};

// ─── Verify token ─────────────────────────────────────────────────────────────

export const verifyToken = (token: string, secret: string): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

// ─── Send tokens to client (access in body, refresh in httpOnly cookie) ───────

export const sendTokenResponse = (
  res: Response,
  userId: Types.ObjectId,
  role: UserRole,
  payload: Record<string, unknown>,
  statusCode = 200
): Response => {
  const accessToken = signAccessToken(userId, role);
  const refreshToken = signRefreshToken(userId, role);

  const cookieExpireDays = Number(process.env.JWT_COOKIE_EXPIRE ?? 7);
  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  return (res as any).data(
    { accessToken, ...payload },
    'Authentication successful',
    statusCode
  );
};
