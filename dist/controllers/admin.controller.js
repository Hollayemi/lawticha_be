"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstructorModulesHandler = exports.getInstructorsHandler = exports.getMyAuditLogsHandler = exports.getAuditLogsHandler = exports.changeAdminRoleHandler = exports.acceptInviteHandler = exports.inviteAdminHandler = exports.reactivateAdminHandler = exports.deleteAdminHandler = exports.updateAdminHandler = exports.getAdminByIdHandler = exports.getAdminsHandler = exports.createAdminHandler = exports.resetPasswordHandler = exports.forgotPasswordHandler = exports.changePasswordHandler = exports.completeOnboardingStepHandler = exports.getCurrentAdminHandler = exports.logoutHandler = exports.loginHandler = void 0;
const error_1 = require("../middleware/error");
const admin_service_1 = require("../services/admin.service");
// ============ Helper ============
function adminCtx(req) {
    return {
        id: req.admin.id,
        name: req.admin.name,
    };
}
// ============ Auth Controllers ============
// POST /api/v1/admin/auth/login
exports.loginHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email?.trim()) {
        return next(new error_1.AppError('Email is required.', 400, 'VALIDATION_ERROR'));
    }
    if (!password?.trim()) {
        return next(new error_1.AppError('Password is required.', 400, 'VALIDATION_ERROR'));
    }
    const result = await (0, admin_service_1.loginAdmin)(email, password);
    return res.data(result, 'Login successful.');
});
// POST /api/v1/admin/auth/logout
exports.logoutHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { id, name } = adminCtx(req);
    await (0, admin_service_1.logoutAdmin)(id, name);
    return res.success('Logout successful.');
});
// GET /api/v1/admin/auth/me
exports.getCurrentAdminHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await (0, admin_service_1.getCurrentAdmin)(req.admin.id);
    return res.data(result, 'Current admin fetched.');
});
// POST /api/v1/admin/auth/onboarding/:step
exports.completeOnboardingStepHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { step } = req.params;
    const { acceptedTerms, profileData, trainingCompleted } = req.body;
    if (!['accept_terms', 'profile', 'training'].includes(step)) {
        return next(new error_1.AppError('Invalid onboarding step.', 400, 'VALIDATION_ERROR'));
    }
    const result = await (0, admin_service_1.completeOnboardingStep)(req.admin.id, step, { acceptedTerms, profileData, trainingCompleted });
    return res.data(result, 'Onboarding step completed.');
});
// POST /api/v1/admin/auth/change-password
exports.changePasswordHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword?.trim()) {
        return next(new error_1.AppError('Current password is required.', 400, 'VALIDATION_ERROR'));
    }
    if (!newPassword?.trim() || newPassword.length < 6) {
        return next(new error_1.AppError('New password must be at least 6 characters.', 400, 'VALIDATION_ERROR'));
    }
    const { id, name } = adminCtx(req);
    await (0, admin_service_1.changePassword)(id, name, { currentPassword, newPassword });
    return res.success('Password changed successfully.');
});
// POST /api/v1/admin/auth/forgot-password
exports.forgotPasswordHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { email } = req.body;
    if (!email?.trim()) {
        return next(new error_1.AppError('Email is required.', 400, 'VALIDATION_ERROR'));
    }
    await (0, admin_service_1.forgotPassword)(email);
    return res.success('If an account with that email exists, a password reset link has been sent.');
});
// POST /api/v1/admin/auth/reset-password
exports.resetPasswordHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { token, newPassword } = req.body;
    if (!token?.trim()) {
        return next(new error_1.AppError('Reset token is required.', 400, 'VALIDATION_ERROR'));
    }
    if (!newPassword?.trim() || newPassword.length < 6) {
        return next(new error_1.AppError('New password must be at least 6 characters.', 400, 'VALIDATION_ERROR'));
    }
    await (0, admin_service_1.resetPassword)({ token, newPassword });
    return res.success('Password reset successfully. Please log in.');
});
// ============ Admin Management Controllers ============
// POST /api/v1/admin/users
exports.createAdminHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { name, email, password, role, sendInvite } = req.body;
    if (!name?.trim()) {
        return next(new error_1.AppError('Name is required.', 400, 'VALIDATION_ERROR'));
    }
    if (!email?.trim()) {
        return next(new error_1.AppError('Email is required.', 400, 'VALIDATION_ERROR'));
    }
    if (!role || !Object.values(['super_admin', 'admin', 'instructor', 'moderator', 'analyst', 'support']).includes(role)) {
        return next(new error_1.AppError('Valid role is required.', 400, 'VALIDATION_ERROR'));
    }
    const result = await (0, admin_service_1.createAdmin)({ name, email, password, role, sendInvite });
    return res.data(result, 'Admin created successfully.');
});
// GET /api/v1/admin/users
exports.getAdminsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { role, isActive, search, page, pageSize, sortBy, sortOrder } = req.query;
    const filters = {
        role: role,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search: search,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        sortBy: sortBy,
        sortOrder: sortOrder,
    };
    const result = await (0, admin_service_1.getAdmins)(filters);
    return res.data(result, 'Admins fetched.');
});
// GET /api/v1/admin/users/:id
exports.getAdminByIdHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const admin = await (0, admin_service_1.getAdminById)(req.params.id);
    return res.data({ admin }, 'Admin fetched.');
});
// PATCH /api/v1/admin/users/:id
exports.updateAdminHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { name, role, isActive } = req.body;
    const { id, name: actorName } = adminCtx(req);
    const result = await (0, admin_service_1.updateAdmin)(req.params.id, { name, role, isActive }, id, actorName);
    return res.data({ admin: result }, 'Admin updated successfully.');
});
// DELETE /api/v1/admin/users/:id
exports.deleteAdminHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { reason } = req.body;
    const { id, name } = adminCtx(req);
    await (0, admin_service_1.deleteAdmin)(req.params.id, id, name, reason);
    return res.success('Admin deactivated successfully.');
});
// POST /api/v1/admin/users/:id/reactivate
exports.reactivateAdminHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { id, name } = adminCtx(req);
    const result = await (0, admin_service_1.reactivateAdmin)(req.params.id, id, name);
    return res.data({ admin: result }, 'Admin reactivated successfully.');
});
// POST /api/v1/admin/users/invite
exports.inviteAdminHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { email, role, message } = req.body;
    const { id, name } = adminCtx(req);
    if (!email?.trim()) {
        return next(new error_1.AppError('Email is required.', 400, 'VALIDATION_ERROR'));
    }
    if (!role || !Object.values(['super_admin', 'admin', 'instructor', 'moderator', 'analyst', 'support']).includes(role)) {
        return next(new error_1.AppError('Valid role is required.', 400, 'VALIDATION_ERROR'));
    }
    const result = await (0, admin_service_1.inviteAdmin)({ email, role, message }, id, name);
    return res.data(result, result.message);
});
// POST /api/v1/admin/users/invite/:token/accept
exports.acceptInviteHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { token } = req.params;
    const { password, name } = req.body;
    if (!password?.trim() || password.length < 6) {
        return next(new error_1.AppError('Password must be at least 6 characters.', 400, 'VALIDATION_ERROR'));
    }
    if (!name?.trim()) {
        return next(new error_1.AppError('Name is required.', 400, 'VALIDATION_ERROR'));
    }
    const result = await (0, admin_service_1.acceptInvite)(token, password, name);
    return res.data(result, 'Invite accepted successfully.');
});
// PATCH /api/v1/admin/users/:id/role
exports.changeAdminRoleHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { role, reason } = req.body;
    const { id, name } = adminCtx(req);
    if (!role || !Object.values(['super_admin', 'admin', 'instructor', 'moderator', 'analyst', 'support']).includes(role)) {
        return next(new error_1.AppError('Valid role is required.', 400, 'VALIDATION_ERROR'));
    }
    const result = await (0, admin_service_1.changeAdminRole)(req.params.id, role, reason, id, name);
    return res.data({ admin: result }, 'Admin role changed successfully.');
});
// ============ Audit Log Controllers ============
// GET /api/v1/admin/audit-logs
exports.getAuditLogsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { adminId, action, targetType, startDate, endDate, page, pageSize } = req.query;
    const filters = {
        adminId: adminId,
        action: action,
        targetType: targetType,
        startDate: startDate,
        endDate: endDate,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
    };
    const result = await (0, admin_service_1.getAuditLogs)(filters);
    return res.data(result, 'Audit logs fetched.');
});
// GET /api/v1/admin/audit-logs/my
exports.getMyAuditLogsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { page, pageSize } = req.query;
    const result = await (0, admin_service_1.getMyAuditLogs)(req.admin.id, page ? Number(page) : 1, pageSize ? Number(pageSize) : 20);
    return res.data(result, 'My audit logs fetched.');
});
// ============ Instructor Controllers ============
// GET /api/v1/admin/instructors
exports.getInstructorsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { search, limit } = req.query;
    const instructors = await (0, admin_service_1.getInstructors)(search, limit ? Number(limit) : 50);
    return res.data(instructors, 'Instructors fetched.');
});
// GET /api/v1/admin/instructors/:id/modules
exports.getInstructorModulesHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const modules = await (0, admin_service_1.getInstructorModules)(req.params.id);
    return res.data(modules, 'Instructor modules fetched.');
});
//# sourceMappingURL=admin.controller.js.map