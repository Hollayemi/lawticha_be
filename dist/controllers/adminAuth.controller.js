"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMeHandler = exports.adminLogoutHandler = exports.adminLoginHandler = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_1 = require("../middleware/error");
const Admin_model_1 = require("../models/Admin.model");
//  Helpers 
const COOKIE_NAME = 'admin_token';
function signToken(id, role) {
    return jsonwebtoken_1.default.sign({ id, role }, process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET, { expiresIn: process.env.ADMIN_JWT_EXPIRE ?? '8h' });
}
function setCookie(res, token) {
    const maxAge = 8 * 60 * 60 * 1000; // 8 hours
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge,
    });
}
//  POST /api/v1/auth/admin/login 
exports.adminLoginHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { email, password } = req.body;
    console.log(req.body);
    if (!email?.trim())
        return next(new error_1.AppError('Email is required', 400, 'VALIDATION_ERROR'));
    if (!password?.trim())
        return next(new error_1.AppError('Password is required', 400, 'VALIDATION_ERROR'));
    const admin = await Admin_model_1.AdminUserModel.findOne({
        email: email.toLowerCase().trim(),
        removedAt: null,
    }).select('+passwordHash');
    if (!admin || !admin.isActive) {
        return next(new error_1.AppError('Invalid credentials', 401, 'UNAUTHORIZED'));
    }
    const match = await bcryptjs_1.default.compare(password, admin.passwordHash);
    if (!match)
        return next(new error_1.AppError('Invalid credentials', 401, 'UNAUTHORIZED'));
    // Stamp lastLogin
    Admin_model_1.AdminUserModel.updateOne({ _id: admin._id }, { lastLogin: new Date() }).exec();
    const token = signToken(String(admin._id), admin.role);
    setCookie(res, token);
    return res.data({
        admin: {
            id: String(admin._id),
            name: admin.name,
            email: admin.email,
            role: admin.role,
        },
        accessToken: token,
    }, 'Login successful');
});
//  POST /api/v1/auth/admin/logout 
exports.adminLogoutHandler = (0, error_1.asyncHandler)(async (_req, res, _next) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    return res.success('Logged out successfully');
});
//  GET /api/v1/auth/admin/me 
exports.adminMeHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const admin = req.admin;
    const doc = await Admin_model_1.AdminUserModel.findById(admin.id).select('-passwordHash');
    if (!doc)
        return res.data(null, 'Not found');
    return res.data({
        id: String(doc._id),
        name: doc.name,
        email: doc.email,
        role: doc.role,
        lastLogin: doc.lastLogin,
    }, 'Profile fetched');
});
//# sourceMappingURL=adminAuth.controller.js.map