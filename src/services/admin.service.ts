import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminUserModel, AuditLogModel } from '../models/Admin.model';
import { UserModel } from '../models/User.model';
import { LawyerProfileModel } from '../models/LawyerProfile.model';
import { AppError } from '../middleware/error';
import {
  AdminRole,
  AuditAction,
  IAdminUser,
  IAuditLog,
  OnboardingStep,
  IAdminOnboardingState,
} from '../models/types';

// ============ Types ============

export interface CreateAdminInput {
  name: string;
  email: string;
  password?: string;
  role: AdminRole;
  sendInvite?: boolean;
}

export interface UpdateAdminInput {
  name?: string;
  role?: AdminRole;
  isActive?: boolean;
}

export interface AdminFilters {
  role?: AdminRole;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OnboardingCompleteInput {
  acceptedTerms: boolean;
  profileData?: {
    name?: string;
    email?: string;
  };
  trainingCompleted?: boolean;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface InviteAdminInput {
  email: string;
  role: AdminRole;
  message?: string;
}

export interface AuditLogFilters {
  adminId?: string;
  action?: AuditAction;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// ============ Helper Functions ============

const generateToken = (adminId: string, role: AdminRole): string => {
  return jwt.sign(
    { id: adminId, role, type: 'admin' },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

const generateResetToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

const createAuditLog = async (
  adminId: string,
  adminName: string,
  action: AuditAction,
  targetType: string,
  targetId: string | Types.ObjectId,
  meta: any
): Promise<void> => {
  try {
    await AuditLogModel.create({
      adminId: new Types.ObjectId(adminId),
      adminName,
      action,
      targetType,
      targetId: targetId.toString(),
      meta,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// ============ Auth Service ============

export interface LoginResult {
  token: string;
  admin: IAdminUser;
  requiresOnboarding: boolean;
}

export async function loginAdmin(email: string, password: string): Promise<LoginResult> {
  const admin = await AdminUserModel.findOne({ email }).select('+passwordHash');
  
  if (!admin) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }
  
  if (!admin.isActive) {
    throw new AppError('Account is deactivated. Please contact super admin.', 401, 'ACCOUNT_DEACTIVATED');
  }
  
  const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }
  
  // Update last login
  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });
  
  // Create audit log
  await createAuditLog(
    admin._id.toString(),
    admin.name,
    AuditAction.LOGIN,
    'admin',
    admin._id,
    { email: admin.email }
  );
  
  const token = generateToken(admin._id.toString(), admin.role);
  
  // Check if onboarding is required
  const requiresOnboarding = !admin.onboardingCompleted;
  
  return {
    token,
    admin: admin.toObject() as IAdminUser,
    requiresOnboarding,
  };
}

export async function logoutAdmin(adminId: string, adminName: string): Promise<void> {
  await createAuditLog(
    adminId,
    adminName,
    AuditAction.LOGOUT,
    'admin',
    adminId,
    {}
  );
}

export async function getCurrentAdmin(adminId: string): Promise<IAdminUser & { onboarding: IAdminOnboardingState }> {
  const admin = await AdminUserModel.findById(adminId);
  
  if (!admin) {
    throw new AppError('Admin not found.', 404, 'NOT_FOUND');
  }
  
  const onboarding: IAdminOnboardingState = {
    currentStep: admin.onboardingStep,
    acceptedTerms: admin.acceptedTermsAt !== null,
    profileCompleted: admin.profileCompletedAt !== null,
    trainingCompleted: admin.trainingCompletedAt !== null,
    hasCompletedOnboarding: admin.onboardingCompleted,
    onboardingData: {
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  };
  
  return {
    ...admin.toObject(),
    onboarding,
  };
}

export async function completeOnboardingStep(
  adminId: string,
  step: OnboardingStep,
  data: OnboardingCompleteInput
): Promise<{ admin: IAdminUser; nextStep: OnboardingStep | null; completed: boolean }> {
  const admin = await AdminUserModel.findById(adminId);
  
  if (!admin) {
    throw new AppError('Admin not found.', 404, 'NOT_FOUND');
  }
  
  if (admin.onboardingCompleted) {
    throw new AppError('Onboarding already completed.', 400, 'ONBOARDING_COMPLETED');
  }
  
  let nextStep: OnboardingStep | null = null;
  let completed = false;
  
  switch (step) {
    case 'accept_terms':
      if (!data.acceptedTerms) {
        throw new AppError('Terms must be accepted.', 400, 'TERMS_NOT_ACCEPTED');
      }
      admin.acceptedTermsAt = new Date();
      admin.onboardingStep = 'profile';
      nextStep = 'profile';
      break;
      
    case 'profile':
      if (data.profileData?.name) admin.name = data.profileData.name;
      if (data.profileData?.email) admin.email = data.profileData.email;
      admin.profileCompletedAt = new Date();
      admin.onboardingStep = 'training';
      nextStep = 'training';
      break;
      
    case 'training':
      if (data.trainingCompleted) {
        admin.trainingCompletedAt = new Date();
        admin.onboardingCompleted = true;
        admin.onboardingStep = 'complete';
        completed = true;
        nextStep = null;
      } else {
        throw new AppError('Training must be completed.', 400, 'TRAINING_NOT_COMPLETED');
      }
      break;
      
    default:
      throw new AppError('Invalid onboarding step.', 400, 'INVALID_STEP');
  }
  
  await admin.save();
  
  await createAuditLog(
    adminId,
    admin.name,
    AuditAction.PASSWORD_CHANGE, // Using PASSWORD_CHANGE as generic, you may want a dedicated ONBOARDING_STEP_COMPLETED action
    'admin',
    admin._id,
    { step, completed }
  );
  
  return {
    admin: admin.toObject(),
    nextStep,
    completed,
  };
}

export async function changePassword(
  adminId: string,
  adminName: string,
  input: ChangePasswordInput
): Promise<void> {
  const admin = await AdminUserModel.findById(adminId).select('+passwordHash');
  
  if (!admin) {
    throw new AppError('Admin not found.', 404, 'NOT_FOUND');
  }
  
  const isPasswordValid = await bcrypt.compare(input.currentPassword, admin.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect.', 401, 'INVALID_PASSWORD');
  }
  
  const hashedPassword = await bcrypt.hash(input.newPassword, 10);
  admin.passwordHash = hashedPassword;
  await admin.save();
  
  await createAuditLog(
    adminId,
    adminName,
    AuditAction.PASSWORD_CHANGE,
    'admin',
    admin._id,
    {}
  );
}

export async function forgotPassword(email: string): Promise<void> {
  const admin = await AdminUserModel.findOne({ email });
  
  if (!admin) {
    // Don't reveal that email doesn't exist for security
    return;
  }
  
  const resetToken = generateResetToken();
  const resetExpires = new Date(Date.now() + 3600000); // 1 hour
  
  admin.resetPasswordToken = resetToken;
  admin.resetPasswordExpires = resetExpires;
  await admin.save();
  
  // TODO: Send email with reset link
  console.log(`[PASSWORD RESET] Token for ${email}: ${resetToken}`);
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const admin = await AdminUserModel.findOne({
    resetPasswordToken: input.token,
    resetPasswordExpires: { $gt: new Date() },
  });
  
  if (!admin) {
    throw new AppError('Password reset token is invalid or has expired.', 400, 'INVALID_TOKEN');
  }
  
  const hashedPassword = await bcrypt.hash(input.newPassword, 10);
  admin.passwordHash = hashedPassword;
  admin.resetPasswordToken = undefined;
  admin.resetPasswordExpires = undefined;
  await admin.save();
  
  await createAuditLog(
    admin._id.toString(),
    admin.name,
    AuditAction.PASSWORD_CHANGE,
    'admin',
    admin._id,
    { reset: true }
  );
}

// ============ Admin Management ============

export async function createAdmin(input: CreateAdminInput): Promise<{ admin: IAdminUser; inviteSent?: boolean }> {
  const existingAdmin = await AdminUserModel.findOne({ email: input.email.toLowerCase() });
  if (existingAdmin) {
    throw new AppError('Admin with this email already exists.', 409, 'DUPLICATE_EMAIL');
  }
  
  let passwordHash: string;
  let inviteSent = false;
  
  if (input.password) {
    passwordHash = await bcrypt.hash(input.password, 10);
  } else if (input.sendInvite) {
    // Generate temporary password for invite
    const tempPassword = Math.random().toString(36).substring(2, 10);
    passwordHash = await bcrypt.hash(tempPassword, 10);
    inviteSent = true;
    // TODO: Send invite email with temp password
    console.log(`[INVITE] Admin created for ${input.email} with temp password: ${tempPassword}`);
  } else {
    throw new AppError('Either password or sendInvite must be provided.', 400, 'INVALID_INPUT');
  }
  
  const admin = await AdminUserModel.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role: input.role,
    isActive: true,
    onboardingCompleted: false,
    onboardingStep: 'welcome',
  });
  
  // Audit log will be created by caller with admin context
  // For system creation, we skip audit log
  
  return {
    admin: admin.toObject(),
    inviteSent: inviteSent || undefined,
  };
}

export async function getAdmins(filters: AdminFilters = {}): Promise<{
  data: IAdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const {
    role,
    isActive,
    search,
    page = 1,
    pageSize = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;
  
  const filter: Record<string, unknown> = {};
  
  if (role) {
    filter.role = role;
  }
  
  if (isActive !== undefined) {
    filter.isActive = isActive;
  }
  
  if (search?.trim()) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { email: { $regex: search.trim(), $options: 'i' } },
    ];
  }
  
  const skip = (page - 1) * pageSize;
  const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  
  const [admins, total] = await Promise.all([
    AdminUserModel.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .select('-passwordHash -resetPasswordToken -resetPasswordExpires'),
    AdminUserModel.countDocuments(filter),
  ]);
  
  return {
    data: admins.map(a => a.toObject()),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAdminById(adminId: string): Promise<IAdminUser> {
  const admin = await AdminUserModel.findById(adminId).select(
    '-passwordHash -resetPasswordToken -resetPasswordExpires'
  );
  
  if (!admin) {
    throw new AppError('Admin not found.', 404, 'NOT_FOUND');
  }
  
  return admin.toObject();
}

export async function updateAdmin(
  adminId: string,
  input: UpdateAdminInput,
  actorId: string,
  actorName: string
): Promise<IAdminUser> {
  const admin = await AdminUserModel.findById(adminId);
  
  if (!admin) {
    throw new AppError('Admin not found.', 404, 'NOT_FOUND');
  }
  
  const changes: Record<string, any> = {};
  
  if (input.name !== undefined && input.name !== admin.name) {
    changes.name = { from: admin.name, to: input.name };
    admin.name = input.name;
  }
  
  if (input.role !== undefined && input.role !== admin.role) {
    changes.role = { from: admin.role, to: input.role };
    admin.role = input.role;
    
    await createAuditLog(
      actorId,
      actorName,
      AuditAction.ROLE_CHANGED,
      'admin',
      admin._id,
      { fromRole: changes.role?.from, toRole: changes.role?.to }
    );
  }
  
  if (input.isActive !== undefined && input.isActive !== admin.isActive) {
    changes.isActive = { from: admin.isActive, to: input.isActive };
    admin.isActive = input.isActive;
    
    const action = input.isActive ? AuditAction.ADMIN_ACTIVATED : AuditAction.ADMIN_DEACTIVATED;
    await createAuditLog(
      actorId,
      actorName,
      action,
      'admin',
      admin._id,
      {}
    );
  }
  
  await admin.save();
  
  const updatedAdmin = await AdminUserModel.findById(adminId).select(
    '-passwordHash -resetPasswordToken -resetPasswordExpires'
  );
  
  return updatedAdmin!.toObject();
}

export async function deleteAdmin(
  adminId: string,
  actorId: string,
  actorName: string,
  reason?: string
): Promise<void> {
  const admin = await AdminUserModel.findById(adminId);
  
  if (!admin) {
    throw new AppError('Admin not found.', 404, 'NOT_FOUND');
  }
  
  if (admin.role === AdminRole.SUPER_ADMIN) {
    throw new AppError('Cannot delete super admin.', 403, 'FORBIDDEN');
  }
  
  admin.isActive = false;
  admin.removedAt = new Date();
  admin.removedBy = new Types.ObjectId(actorId);
  await admin.save();
  
  await createAuditLog(
    actorId,
    actorName,
    AuditAction.ADMIN_REMOVED,
    'admin',
    admin._id,
    { reason }
  );
}

export async function reactivateAdmin(
  adminId: string,
  actorId: string,
  actorName: string
): Promise<IAdminUser> {
  const admin = await AdminUserModel.findById(adminId);
  
  if (!admin) {
    throw new AppError('Admin not found.', 404, 'NOT_FOUND');
  }
  
  admin.isActive = true;
  admin.removedAt = null;
  admin.removedBy = null;
  await admin.save();
  
  await createAuditLog(
    actorId,
    actorName,
    AuditAction.ADMIN_ACTIVATED,
    'admin',
    admin._id,
    { reactivated: true }
  );
  
  const reactivatedAdmin = await AdminUserModel.findById(adminId).select(
    '-passwordHash -resetPasswordToken -resetPasswordExpires'
  );
  
  return reactivatedAdmin!.toObject();
}

export async function inviteAdmin(
  input: InviteAdminInput,
  actorId: string,
  actorName: string
): Promise<{ message: string; inviteId: string }> {
  const existingAdmin = await AdminUserModel.findOne({ email: input.email.toLowerCase() });
  if (existingAdmin) {
    throw new AppError('Admin with this email already exists.', 409, 'DUPLICATE_EMAIL');
  }
  
  const tempPassword = Math.random().toString(36).substring(2, 10);
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const inviteToken = generateResetToken();
  
  const admin = await AdminUserModel.create({
    name: input.email.split('@')[0], // Temporary name
    email: input.email.toLowerCase(),
    passwordHash,
    role: input.role,
    isActive: true,
    onboardingCompleted: false,
    onboardingStep: 'welcome',
    resetPasswordToken: inviteToken,
    resetPasswordExpires: new Date(Date.now() + 7 * 24 * 3600000), // 7 days
  });
  
  await createAuditLog(
    actorId,
    actorName,
    AuditAction.ADMIN_CREATED,
    'admin',
    admin._id,
    { invite: true, message: input.message }
  );
  
  // TODO: Send invite email with link containing token
  console.log(`[INVITE] Invite sent to ${input.email} with token: ${inviteToken}, temp password: ${tempPassword}`);
  
  return {
    message: `Invite sent to ${input.email}`,
    inviteId: admin._id.toString(),
  };
}

export async function acceptInvite(
  token: string,
  password: string,
  name: string
): Promise<{ token: string; admin: IAdminUser }> {
  const admin = await AdminUserModel.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  });
  
  if (!admin) {
    throw new AppError('Invite token is invalid or has expired.', 400, 'INVALID_TOKEN');
  }
  
  const passwordHash = await bcrypt.hash(password, 10);
  admin.passwordHash = passwordHash;
  admin.name = name;
  admin.resetPasswordToken = undefined;
  admin.resetPasswordExpires = undefined;
  await admin.save();
  
  const authToken = generateToken(admin._id.toString(), admin.role);
  
  await createAuditLog(
    admin._id.toString(),
    admin.name,
    AuditAction.PASSWORD_CHANGE,
    'admin',
    admin._id,
    { inviteAccepted: true }
  );
  
  return {
    token: authToken,
    admin: admin.toObject(),
  };
}

export async function changeAdminRole(
  adminId: string,
  newRole: AdminRole,
  reason: string | undefined,
  actorId: string,
  actorName: string
): Promise<IAdminUser> {
  const admin = await AdminUserModel.findById(adminId);
  
  if (!admin) {
    throw new AppError('Admin not found.', 404, 'NOT_FOUND');
  }
  
  const oldRole = admin.role;
  admin.role = newRole;
  await admin.save();
  
  await createAuditLog(
    actorId,
    actorName,
    AuditAction.ROLE_CHANGED,
    'admin',
    admin._id,
    { fromRole: oldRole, toRole: newRole, reason }
  );
  
  const updatedAdmin = await AdminUserModel.findById(adminId).select(
    '-passwordHash -resetPasswordToken -resetPasswordExpires'
  );
  
  return updatedAdmin!.toObject();
}

// ============ Audit Log Service ============

export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<{
  data: IAuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const {
    adminId,
    action,
    targetType,
    startDate,
    endDate,
    page = 1,
    pageSize = 50,
  } = filters;
  
  const filter: Record<string, any> = {};
  
  if (adminId) {
    filter.adminId = new Types.ObjectId(adminId);
  }
  
  if (action) {
    filter.action = action;
  }
  
  if (targetType) {
    filter.targetType = targetType;
  }
  
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.createdAt.$lte = new Date(endDate);
    }
  }
  
  const skip = (page - 1) * pageSize;
  
  const [logs, total] = await Promise.all([
    AuditLogModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('adminId', 'name email'),
    AuditLogModel.countDocuments(filter),
  ]);
  
  return {
    data: logs.map(log => log.toObject() as IAuditLog),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getMyAuditLogs(
  adminId: string,
  page = 1,
  pageSize = 20
): Promise<{
  data: IAuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  return getAuditLogs({
    adminId,
    page,
    pageSize,
  });
}

// ============ Instructor Service ============

export async function getInstructors(
  search?: string,
  limit = 50
): Promise<IAdminUser[]> {
  const filter: Record<string, unknown> = {
    role: AdminRole.INSTRUCTOR,
    isActive: true,
  };
  
  if (search?.trim()) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { email: { $regex: search.trim(), $options: 'i' } },
    ];
  }
  
  const instructors = await AdminUserModel.find(filter)
    .limit(limit)
    .select('name email role');
  
  return instructors.map(i => i.toObject());
}

export async function getInstructorModules(instructorId: string): Promise<{
  moduleId: string;
  title: string;
  enrolledCount: number;
  completionRate: number;
}[]> {
  // This would need to be implemented based on your module/course schema
  // For now, return mock data structure
  const instructor = await AdminUserModel.findById(instructorId);
  
  if (!instructor) {
    throw new AppError('Instructor not found.', 404, 'NOT_FOUND');
  }
  
  if (instructor.role !== AdminRole.INSTRUCTOR) {
    throw new AppError('User is not an instructor.', 400, 'NOT_INSTRUCTOR');
  }
  
  // TODO: Implement actual module fetching from Module model
  // This is a placeholder
  return [];
}