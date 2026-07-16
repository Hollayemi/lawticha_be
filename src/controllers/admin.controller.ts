import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';
import {
  loginAdmin,
  logoutAdmin,
  getCurrentAdmin,
  completeOnboardingStep,
  changePassword,
  forgotPassword,
  resetPassword,
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  reactivateAdmin,
  inviteAdmin,
  acceptInvite,
  changeAdminRole,
  getAuditLogs,
  getMyAuditLogs,
  getInstructors,
  getInstructorModules,
  type CreateAdminInput,
  type UpdateAdminInput,
  type AdminFilters,
  type OnboardingCompleteInput,
  type ChangePasswordInput,
  type ResetPasswordInput,
  type InviteAdminInput,
  type AuditLogFilters,
} from '../services/admin.service';

// ============ Helper ============

function adminCtx(req: Request) {
  return {
    id: req.admin!.id,
    name: req.admin!.name,
  };
}

// ============ Auth Controllers ============

// POST /api/v1/admin/auth/login
export const loginHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    
    if (!email?.trim()) {
      return next(new AppError('Email is required.', 400, 'VALIDATION_ERROR'));
    }
    if (!password?.trim()) {
      return next(new AppError('Password is required.', 400, 'VALIDATION_ERROR'));
    }
    
    const result = await loginAdmin(email, password);
    return (res as AppResponse).data(result, 'Login successful.');
  }
);

// POST /api/v1/admin/auth/logout
export const logoutHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { id, name } = adminCtx(req);
    await logoutAdmin(id, name);
    return (res as AppResponse).success('Logout successful.');
  }
);

// GET /api/v1/admin/auth/me
export const getCurrentAdminHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await getCurrentAdmin(req.admin!.id);
    return (res as AppResponse).data(result, 'Current admin fetched.');
  }
);

// POST /api/v1/admin/auth/onboarding/:step
export const completeOnboardingStepHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { step } = req.params;
    const { acceptedTerms, profileData, trainingCompleted } = req.body;
    
    if (!['accept_terms', 'profile', 'training'].includes(step)) {
      return next(new AppError('Invalid onboarding step.', 400, 'VALIDATION_ERROR'));
    }
    
    const result = await completeOnboardingStep(
      req.admin!.id,
      step as 'accept_terms' | 'profile' | 'training',
      { acceptedTerms, profileData, trainingCompleted }
    );
    
    return (res as AppResponse).data(result, 'Onboarding step completed.');
  }
);

// POST /api/v1/admin/auth/change-password
export const changePasswordHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword } = req.body as ChangePasswordInput;
    
    if (!currentPassword?.trim()) {
      return next(new AppError('Current password is required.', 400, 'VALIDATION_ERROR'));
    }
    if (!newPassword?.trim() || newPassword.length < 6) {
      return next(new AppError('New password must be at least 6 characters.', 400, 'VALIDATION_ERROR'));
    }
    
    const { id, name } = adminCtx(req);
    await changePassword(id, name, { currentPassword, newPassword });
    
    return (res as AppResponse).success('Password changed successfully.');
  }
);

// POST /api/v1/admin/auth/forgot-password
export const forgotPasswordHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    
    if (!email?.trim()) {
      return next(new AppError('Email is required.', 400, 'VALIDATION_ERROR'));
    }
    
    await forgotPassword(email);
    return (res as AppResponse).success(
      'If an account with that email exists, a password reset link has been sent.'
    );
  }
);

// POST /api/v1/admin/auth/reset-password
export const resetPasswordHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token, newPassword } = req.body as ResetPasswordInput;
    
    if (!token?.trim()) {
      return next(new AppError('Reset token is required.', 400, 'VALIDATION_ERROR'));
    }
    if (!newPassword?.trim() || newPassword.length < 6) {
      return next(new AppError('New password must be at least 6 characters.', 400, 'VALIDATION_ERROR'));
    }
    
    await resetPassword({ token, newPassword });
    return (res as AppResponse).success('Password reset successfully. Please log in.');
  }
);

// ============ Admin Management Controllers ============

// POST /api/v1/admin/users
export const createAdminHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, role, sendInvite } = req.body as CreateAdminInput;
    
    if (!name?.trim()) {
      return next(new AppError('Name is required.', 400, 'VALIDATION_ERROR'));
    }
    if (!email?.trim()) {
      return next(new AppError('Email is required.', 400, 'VALIDATION_ERROR'));
    }
    if (!role || !Object.values(['super_admin', 'admin', 'instructor', 'moderator', 'analyst', 'support']).includes(role)) {
      return next(new AppError('Valid role is required.', 400, 'VALIDATION_ERROR'));
    }
    
    const result = await createAdmin({ name, email, password, role, sendInvite });
    return (res as AppResponse).data(result, 'Admin created successfully.');
  }
);

// GET /api/v1/admin/users
export const getAdminsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { role, isActive, search, page, pageSize, sortBy, sortOrder } = req.query;
    
    const filters: AdminFilters = {
      role: role as any,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };
    
    const result = await getAdmins(filters);
    return (res as AppResponse).data(result, 'Admins fetched.');
  }
);

// GET /api/v1/admin/users/:id
export const getAdminByIdHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const admin = await getAdminById(req.params.id);
    return (res as AppResponse).data({ admin }, 'Admin fetched.');
  }
);

// PATCH /api/v1/admin/users/:id
export const updateAdminHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, role, isActive } = req.body as UpdateAdminInput;
    const { id, name: actorName } = adminCtx(req);
    
    const result = await updateAdmin(
      req.params.id,
      { name, role, isActive },
      id,
      actorName
    );
    
    return (res as AppResponse).data({ admin: result }, 'Admin updated successfully.');
  }
);

// DELETE /api/v1/admin/users/:id
export const deleteAdminHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reason } = req.body;
    const { id, name } = adminCtx(req);
    
    await deleteAdmin(req.params.id, id, name, reason);
    return (res as AppResponse).success('Admin deactivated successfully.');
  }
);

// POST /api/v1/admin/users/:id/reactivate
export const reactivateAdminHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { id, name } = adminCtx(req);
    const result = await reactivateAdmin(req.params.id, id, name);
    return (res as AppResponse).data({ admin: result }, 'Admin reactivated successfully.');
  }
);

// POST /api/v1/admin/users/invite
export const inviteAdminHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, role, message } = req.body as InviteAdminInput;
    const { id, name } = adminCtx(req);
    
    if (!email?.trim()) {
      return next(new AppError('Email is required.', 400, 'VALIDATION_ERROR'));
    }
    if (!role || !Object.values(['super_admin', 'admin', 'instructor', 'moderator', 'analyst', 'support']).includes(role)) {
      return next(new AppError('Valid role is required.', 400, 'VALIDATION_ERROR'));
    }
    
    const result = await inviteAdmin({ email, role, message }, id, name);
    return (res as AppResponse).data(result, result.message);
  }
);

// POST /api/v1/admin/users/invite/:token/accept
export const acceptInviteHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;
    const { password, name } = req.body;
    
    if (!password?.trim() || password.length < 6) {
      return next(new AppError('Password must be at least 6 characters.', 400, 'VALIDATION_ERROR'));
    }
    if (!name?.trim()) {
      return next(new AppError('Name is required.', 400, 'VALIDATION_ERROR'));
    }
    
    const result = await acceptInvite(token, password, name);
    return (res as AppResponse).data(result, 'Invite accepted successfully.');
  }
);

// PATCH /api/v1/admin/users/:id/role
export const changeAdminRoleHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { role, reason } = req.body;
    const { id, name } = adminCtx(req);
    
    if (!role || !Object.values(['super_admin', 'admin', 'instructor', 'moderator', 'analyst', 'support']).includes(role)) {
      return next(new AppError('Valid role is required.', 400, 'VALIDATION_ERROR'));
    }
    
    const result = await changeAdminRole(req.params.id, role, reason, id, name);
    return (res as AppResponse).data({ admin: result }, 'Admin role changed successfully.');
  }
);

// ============ Audit Log Controllers ============

// GET /api/v1/admin/audit-logs
export const getAuditLogsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { adminId, action, targetType, startDate, endDate, page, pageSize } = req.query;
    
    const filters: AuditLogFilters = {
      adminId: adminId as string,
      action: action as any,
      targetType: targetType as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    };
    
    const result = await getAuditLogs(filters);
    return (res as AppResponse).data(result, 'Audit logs fetched.');
  }
);

// GET /api/v1/admin/audit-logs/my
export const getMyAuditLogsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { page, pageSize } = req.query;
    const result = await getMyAuditLogs(
      req.admin!.id,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20
    );
    return (res as AppResponse).data(result, 'My audit logs fetched.');
  }
);

// ============ Instructor Controllers ============

// GET /api/v1/admin/instructors
export const getInstructorsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { search, limit } = req.query;
    const instructors = await getInstructors(
      search as string,
      limit ? Number(limit) : 50
    );
    return (res as AppResponse).data(instructors, 'Instructors fetched.');
  }
);

// GET /api/v1/admin/instructors/:id/modules
export const getInstructorModulesHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const modules = await getInstructorModules(req.params.id);
    return (res as AppResponse).data(modules, 'Instructor modules fetched.');
  }
);