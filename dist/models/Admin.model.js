"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogModel = exports.AdminUserModel = void 0;
const mongoose_1 = require("mongoose");
const types_1 = require("./types");
const AdminUserSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    passwordHash: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: Object.values(types_1.AdminRole),
        default: types_1.AdminRole.ADMIN,
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    removedAt: { type: Date, default: null },
    removedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AdminUser',
        default: null,
    },
}, {
    timestamps: true,
    collection: 'admin_users',
});
exports.AdminUserModel = mongoose_1.models.AdminUser ||
    (0, mongoose_1.model)('AdminUser', AdminUserSchema);
const AuditLogSchema = new mongoose_1.Schema({
    adminId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true,
        index: true,
    },
    adminName: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        enum: Object.values(types_1.AuditAction),
        required: true,
        index: true,
    },
    targetType: {
        type: String,
        enum: ['citizen', 'lawyer', 'verification', 'document', 'book', 'plan', 'subscription'],
        required: true,
    },
    targetId: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    meta: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
    collection: 'audit_logs',
});
AuditLogSchema.index({ createdAt: -1 });
exports.AuditLogModel = mongoose_1.models.AuditLog ||
    (0, mongoose_1.model)('AuditLog', AuditLogSchema);
//# sourceMappingURL=Admin.model.js.map