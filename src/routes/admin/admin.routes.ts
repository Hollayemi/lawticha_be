import { Router } from 'express';
import { protectAdmin } from '../../middleware/adminAuth';
import {
  // Auth
  loginHandler,
  logoutHandler,
  getCurrentAdminHandler,
  completeOnboardingStepHandler,
  changePasswordHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  // Admin Management
  createAdminHandler,
  getAdminsHandler,
  getAdminByIdHandler,
  updateAdminHandler,
  deleteAdminHandler,
  reactivateAdminHandler,
  inviteAdminHandler,
  acceptInviteHandler,
  changeAdminRoleHandler,
  // Audit Logs
  getAuditLogsHandler,
  getMyAuditLogsHandler,
  // Instructors
  getInstructorsHandler,
  getInstructorModulesHandler,
} from '../../controllers/admin.controller';

const router = Router();

// ============ Public Routes (No Auth Required) ============

// Auth
router.post('/auth/login', loginHandler);
router.post('/auth/forgot-password', forgotPasswordHandler);
router.post('/auth/reset-password', resetPasswordHandler);

// Invite acceptance (public but token-protected)
router.post('/users/invite/:token/accept', acceptInviteHandler);

router.use(protectAdmin);

// Auth
router.post('/auth/logout', logoutHandler);
router.get('/auth/me', getCurrentAdminHandler);
router.post('/auth/onboarding/:step', completeOnboardingStepHandler);
router.post('/auth/change-password', changePasswordHandler);

// Admin Management
router.post('/admins', createAdminHandler);
router.get('/admins', getAdminsHandler);
router.get('/admins/:id', getAdminByIdHandler);
router.patch('/admins/:id', updateAdminHandler);
router.delete('/admins/:id', deleteAdminHandler);
router.post('/admins/:id/reactivate', reactivateAdminHandler);
router.post('/admins/invite', inviteAdminHandler);
router.patch('/admins/:id/role', changeAdminRoleHandler);

// Audit Logs
router.get('/audit-logs', getAuditLogsHandler);
router.get('/audit-logs/my', getMyAuditLogsHandler);

// Instructors
router.get('/instructors', getInstructorsHandler);
router.get('/instructors/:id/modules', getInstructorModulesHandler);

export default router;