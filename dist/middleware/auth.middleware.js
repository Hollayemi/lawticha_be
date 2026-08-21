"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.citizenOnly = exports.verifiedLawyerOnly = exports.adminOrLawyer = exports.adminOnly = exports.authorizeRoles = exports.optionalAuth = exports.protectBoth = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_1 = require("./error");
const User_model_1 = require("../models/User.model");
const types_1 = require("../models/types");
const models_1 = require("../models");
function extractToken(req) {
    if (req.headers.authorization?.startsWith('Bearer ')) {
        return req.headers.authorization.split(' ')[1];
    }
    if (req.cookies?.token) {
        return req.cookies.token;
    }
    return null;
}
//  protect 
//
// Verifies the access JWT, loads the user, attaches to req.user.
// Checks:
//   ✓ Token present
//   ✓ Token valid & not expired
//   ✓ User still exists in DB
//   ✓ User account is active
//   ✓ Password not changed after token was issued
exports.protect = (0, error_1.asyncHandler)(async (req, _res, next) => {
    const token = extractToken(req);
    console.log(token);
    if (!token) {
        return next(new error_1.AppError('You are not logged in. Please sign in to continue.', 401, 'UNAUTHORIZED'));
    }
    // Verify token,  throws if expired or tampered
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    }
    catch (err) {
        const message = err.name === 'TokenExpiredError'
            ? 'Your session has expired. Please sign in again.'
            : 'Invalid token. Please sign in again.';
        return next(new error_1.AppError(message, 401, 'UNAUTHORIZED'));
    }
    // Fetch user,  select sensitive fields needed for checks
    const user = await User_model_1.UserModel.findById(decoded.id).select('+passwordChangedAt +refreshToken');
    if (!user) {
        return next(new error_1.AppError('The account associated with this token no longer exists.', 401, 'UNAUTHORIZED'));
    }
    if (!user.isActive) {
        return next(new error_1.AppError('Your account has been deactivated. Please contact support.', 403, 'FORBIDDEN'));
    }
    // Invalidate tokens issued before a password change
    if (user.changedPasswordAfter(decoded.iat)) {
        return next(new error_1.AppError('Your password was recently changed. Please sign in again.', 401, 'UNAUTHORIZED'));
    }
    req.user = user;
    next();
});
exports.protectBoth = (0, error_1.asyncHandler)(async (req, _res, next) => {
    const token = extractToken(req);
    if (!token) {
        return next(new error_1.AppError("You are not logged in. Please sign in to continue.", 401, "UNAUTHORIZED"));
    }
    let decoded;
    let isAdminToken = false;
    let lastError;
    // Try user token first
    try {
        decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    }
    catch (err) {
        lastError = err;
        // Try admin token
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET);
            isAdminToken = true;
        }
        catch (adminErr) {
            lastError = adminErr;
        }
    }
    if (!decoded) {
        const message = lastError?.name === "TokenExpiredError"
            ? "Your session has expired. Please sign in again."
            : "Invalid token. Please sign in again.";
        return next(new error_1.AppError(message, 401, "UNAUTHORIZED"));
    }
    // ==========================
    // ADMIN
    // ==========================
    if (isAdminToken) {
        const admin = await models_1.AdminUserModel.findOne({
            _id: decoded.id,
            isActive: true,
            removedAt: null,
        });
        if (!admin) {
            return next(new error_1.AppError("Admin account not found or deactivated.", 401, "UNAUTHORIZED"));
        }
        req.admin = {
            id: String(admin._id),
            name: admin.name,
            email: admin.email,
            role: admin.role,
        };
        return next();
    }
    // ==========================
    // NORMAL USER
    // ==========================
    const user = await User_model_1.UserModel.findById(decoded.id).select("+passwordChangedAt +refreshToken");
    if (!user) {
        return next(new error_1.AppError("The account associated with this token no longer exists.", 401, "UNAUTHORIZED"));
    }
    if (!user.isActive) {
        return next(new error_1.AppError("Your account has been deactivated. Please contact support.", 403, "FORBIDDEN"));
    }
    if (user.changedPasswordAfter(decoded.iat)) {
        return next(new error_1.AppError("Your password was recently changed. Please sign in again.", 401, "UNAUTHORIZED"));
    }
    req.user = user;
    next();
});
//  optionalAuth 
//
// Like protect, but never throws. Attaches user if token is valid,
// continues anonymously if not. Useful for public endpoints that have
// richer responses for authenticated users (e.g. bookmarked acts).
exports.optionalAuth = (0, error_1.asyncHandler)(async (req, _res, next) => {
    const token = extractToken(req);
    if (!token)
        return next();
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_model_1.UserModel.findById(decoded.id).select('+passwordChangedAt');
        if (user && user.isActive && !user.changedPasswordAfter(decoded.iat)) {
            req.user = user;
        }
    }
    catch {
        // Silently ignore,  anonymous access continues
    }
    next();
});
//  authorizeRoles 
//
// Must be used AFTER protect. Restricts the route to specific roles.
//
// Usage:
//   router.get('/admin/stats', protect, authorizeRoles(UserRole.ADMIN), handler)
const authorizeRoles = (...roles) => (req, _res, next) => {
    if (!req.user) {
        return next(new error_1.AppError('Not authenticated.', 401, 'UNAUTHORIZED'));
    }
    if (!roles.includes(req.user.role)) {
        return next(new error_1.AppError(`Access denied. This route is restricted to: ${roles.join(', ')}.`, 403, 'FORBIDDEN'));
    }
    next();
};
exports.authorizeRoles = authorizeRoles;
//  Convenience role guards 
/** Admin only */
exports.adminOnly = (0, exports.authorizeRoles)(types_1.UserRole.ADMIN);
/** Admin or Lawyer */
exports.adminOrLawyer = (0, exports.authorizeRoles)(types_1.UserRole.ADMIN, types_1.UserRole.LAWYER);
/** Verified lawyer only,  also checks lawyerProfile.verificationStatus */
exports.verifiedLawyerOnly = (0, error_1.asyncHandler)(async (req, _res, next) => {
    if (!req.user || req.user.role !== types_1.UserRole.LAWYER) {
        return next(new error_1.AppError('Access denied. Verified lawyers only.', 403, 'FORBIDDEN'));
    }
    // Lazy-load profile only when this guard is used
    const { LawyerProfileModel } = await Promise.resolve().then(() => __importStar(require('../models/LawyerProfile.model')));
    const profile = await LawyerProfileModel.findOne({ userId: req.user._id }).select('verificationStatus');
    if (!profile || profile.verificationStatus !== 'verified') {
        return next(new error_1.AppError('Your lawyer profile has not been verified yet.', 403, 'FORBIDDEN'));
    }
    next();
});
/** Citizen only */
exports.citizenOnly = (0, exports.authorizeRoles)(types_1.UserRole.CITIZEN);
//# sourceMappingURL=auth.middleware.js.map