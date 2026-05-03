import { Request, Response, NextFunction } from 'express';

//  AppError 

export class AppError extends Error {
  statusCode: number;
  status: string;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.status     = statusCode >= 500 ? 'error' : 'fail';
    this.code       = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

//  asyncHandler 

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

//  Response helpers (attached to res in extendResponse middleware) 

export interface AppResponse extends Response {
  data: (data: unknown, message?: string, statusCode?: number) => Response;
  success: (message?: string, statusCode?: number) => Response;
  fail: (message: string, statusCode?: number) => Response;
}

export const extendResponse = (_req: Request, res: Response, next: NextFunction): void => {
  (res as AppResponse).data = (data, message = 'Success', statusCode = 200) =>
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });

  (res as AppResponse).success = (message = 'Operation successful', statusCode = 200) =>
    res.status(statusCode).json({
      success: true,
      message,
      timestamp: new Date().toISOString(),
    });

  (res as AppResponse).fail = (message, statusCode = 400) =>
    res.status(statusCode).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });

  next();
};

//  Global error handler 

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;

  // Mongoose: bad ObjectId
  if (err.name === 'CastError') {
    err = new AppError('Resource not found.', 404, 'NOT_FOUND');
  }

  // Mongoose: duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    err = new AppError(
      `An account with this ${field} already exists.`,
      409,
      'DUPLICATE'
    );
  }

  // Mongoose: validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e: any) => e.message)
      .join('. ');
    err = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // JWT errors (shouldn't reach here if protect handles them, but safety net)
  if (err.name === 'JsonWebTokenError') {
    err = new AppError('Invalid token. Please sign in again.', 401, 'UNAUTHORIZED');
  }
  if (err.name === 'TokenExpiredError') {
    err = new AppError('Session expired. Please sign in again.', 401, 'UNAUTHORIZED');
  }

  const isDev = process.env.NODE_ENV === 'development';

  res.status(err.statusCode).json({
    success: false,
    message: err.message || 'Something went wrong.',
    code: err.code,
    ...(isDev && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};

export const handle404 = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
    code: 'NOT_FOUND',
  });
};