"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../../middleware/adminAuth");
const admin_controller_1 = require("../../controllers/admin.controller");
const router = (0, express_1.Router)();
// ============ Public Routes (No Auth Required) ============
// Auth
router.post('/auth/login', admin_controller_1.loginHandler);
router.post('/auth/forgot-password', admin_controller_1.forgotPasswordHandler);
router.post('/auth/reset-password', admin_controller_1.resetPasswordHandler);
// Invite acceptance (public but token-protected)
router.post('/users/invite/:token/accept', admin_controller_1.acceptInviteHandler);
router.use(adminAuth_1.protectAdmin);
// Auth
router.post('/auth/logout', admin_controller_1.logoutHandler);
router.get('/auth/me', admin_controller_1.getCurrentAdminHandler);
router.post('/auth/onboarding/:step', admin_controller_1.completeOnboardingStepHandler);
router.post('/auth/change-password', admin_controller_1.changePasswordHandler);
// Admin Management
router.post('/admins', admin_controller_1.createAdminHandler);
router.get('/admins', admin_controller_1.getAdminsHandler);
router.get('/admins/:id', admin_controller_1.getAdminByIdHandler);
router.patch('/admins/:id', admin_controller_1.updateAdminHandler);
router.delete('/admins/:id', admin_controller_1.deleteAdminHandler);
router.post('/admins/:id/reactivate', admin_controller_1.reactivateAdminHandler);
router.post('/admins/invite', admin_controller_1.inviteAdminHandler);
router.patch('/admins/:id/role', admin_controller_1.changeAdminRoleHandler);
// Audit Logs
router.get('/audit-logs', admin_controller_1.getAuditLogsHandler);
router.get('/audit-logs/my', admin_controller_1.getMyAuditLogsHandler);
// Instructors
router.get('/instructors', admin_controller_1.getInstructorsHandler);
router.get('/instructors/:id/modules', admin_controller_1.getInstructorModulesHandler);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map