"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSuperAdmin = exports.protectAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_1 = require("./error");
const Admin_model_1 = require("../models/Admin.model");
const lawticha_types_1 = require("../models/types/lawticha.types");
//  protectAdmin,  verifies cookie or Bearer token 
exports.protectAdmin = (0, error_1.asyncHandler)(async (req, _res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies?.admin_token) {
        token = req.cookies.admin_token;
    }
    if (!token) {
        return next(new error_1.AppError('Not authenticated. Please log in.', 401, 'UNAUTHORIZED'));
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET);
    }
    catch (err) {
        const message = err.name === 'TokenExpiredError'
            ? 'Session expired. Please log in again.'
            : 'Invalid token. Please log in again.';
        return next(new error_1.AppError(message, 401, 'UNAUTHORIZED'));
    }
    const admin = await Admin_model_1.AdminUserModel.findOne({
        _id: decoded.id,
        isActive: true,
        removedAt: null,
    });
    if (!admin) {
        return next(new error_1.AppError('Admin account not found or deactivated.', 401, 'UNAUTHORIZED'));
    }
    req.admin = {
        id: String(admin._id),
        name: admin.name,
        email: admin.email,
        role: admin.role,
    };
    next();
});
//  requireSuperAdmin 
const requireSuperAdmin = (req, _res, next) => {
    if (req.admin?.role !== lawticha_types_1.LawTichaRole.SUPER_ADMIN) {
        return next(new error_1.AppError('Restricted to super admins only.', 403, 'FORBIDDEN'));
    }
    next();
};
exports.requireSuperAdmin = requireSuperAdmin;
//# sourceMappingURL=adminAuth.js.map