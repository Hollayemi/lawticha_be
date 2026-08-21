"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle404 = exports.errorHandler = exports.extendResponse = exports.asyncHandler = exports.AppError = void 0;
//  AppError 
class AppError extends Error {
    constructor(message, statusCode, code = 'ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode >= 500 ? 'error' : 'fail';
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
//  asyncHandler 
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
exports.asyncHandler = asyncHandler;
const extendResponse = (_req, res, next) => {
    res.data = (data, message = 'Success', statusCode = 200) => res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
    });
    res.success = (message = 'Operation successful', statusCode = 200) => res.status(statusCode).json({
        success: true,
        message,
        timestamp: new Date().toISOString(),
    });
    res.fail = (message, statusCode = 400) => res.status(statusCode).json({
        success: false,
        message,
        timestamp: new Date().toISOString(),
    });
    next();
};
exports.extendResponse = extendResponse;
//  Global error handler 
const errorHandler = (err, _req, res, _next) => {
    err.statusCode = err.statusCode || 500;
    // Mongoose: bad ObjectId
    if (err.name === 'CastError') {
        err = new AppError('Resource not found.', 404, 'NOT_FOUND');
    }
    // Mongoose: duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        err = new AppError(`An account with this ${field} already exists.`, 409, 'DUPLICATE');
    }
    // Mongoose: validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
            .map((e) => e.message)
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
exports.errorHandler = errorHandler;
const handle404 = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found.`,
        code: 'NOT_FOUND',
    });
};
exports.handle404 = handle404;
//# sourceMappingURL=error.js.map