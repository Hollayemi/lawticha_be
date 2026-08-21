import { AdminRole, AuditAction, IAdminUser, IAuditLog, OnboardingStep, IAdminOnboardingState } from '../models/types';
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
export interface LoginResult {
    token: string;
    admin: IAdminUser;
    requiresOnboarding: boolean;
}
export declare function loginAdmin(email: string, password: string): Promise<LoginResult>;
export declare function logoutAdmin(adminId: string, adminName: string): Promise<void>;
export declare function getCurrentAdmin(adminId: string): Promise<IAdminUser & {
    onboarding: IAdminOnboardingState;
}>;
export declare function completeOnboardingStep(adminId: string, step: OnboardingStep, data: OnboardingCompleteInput): Promise<{
    admin: IAdminUser;
    nextStep: OnboardingStep | null;
    completed: boolean;
}>;
export declare function changePassword(adminId: string, adminName: string, input: ChangePasswordInput): Promise<void>;
export declare function forgotPassword(email: string): Promise<void>;
export declare function resetPassword(input: ResetPasswordInput): Promise<void>;
export declare function createAdmin(input: CreateAdminInput): Promise<{
    admin: IAdminUser;
    inviteSent?: boolean;
}>;
export declare function getAdmins(filters?: AdminFilters): Promise<{
    data: IAdminUser[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare function getAdminById(adminId: string): Promise<IAdminUser>;
export declare function updateAdmin(adminId: string, input: UpdateAdminInput, actorId: string, actorName: string): Promise<IAdminUser>;
export declare function deleteAdmin(adminId: string, actorId: string, actorName: string, reason?: string): Promise<void>;
export declare function reactivateAdmin(adminId: string, actorId: string, actorName: string): Promise<IAdminUser>;
export declare function inviteAdmin(input: InviteAdminInput, actorId: string, actorName: string): Promise<{
    message: string;
    inviteId: string;
}>;
export declare function acceptInvite(token: string, password: string, name: string): Promise<{
    token: string;
    admin: IAdminUser;
}>;
export declare function changeAdminRole(adminId: string, newRole: AdminRole, reason: string | undefined, actorId: string, actorName: string): Promise<IAdminUser>;
export declare function getAuditLogs(filters?: AuditLogFilters): Promise<{
    data: IAuditLog[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare function getMyAuditLogs(adminId: string, page?: number, pageSize?: number): Promise<{
    data: IAuditLog[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare function getInstructors(search?: string, limit?: number): Promise<IAdminUser[]>;
export declare function getInstructorModules(instructorId: string): Promise<{
    moduleId: string;
    title: string;
    enrolledCount: number;
    completionRate: number;
}[]>;
//# sourceMappingURL=admin.service.d.ts.map