import { ICitizenProfileDocument } from '../models/CitizenProfile.model';
import { UserStatusVariant } from '../models/types';
interface AdminCtx {
    adminId: string;
    adminName: string;
}
export interface UpdateCitizenProfileInput {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    state?: string;
    bio?: string;
    avatarUrl?: string;
    stateCode?: string;
    preferredLanguage?: string;
    jurisdictionCode?: string;
    legalInterestAreas?: string[];
    theme?: 'light' | 'dark' | 'system';
    fontSize?: 'small' | 'medium' | 'large';
    accentColor?: string;
    reducedMotion?: boolean;
    highContrast?: boolean;
    dyslexicFont?: boolean;
    notifEmail?: boolean;
    notifSms?: boolean;
    notifPush?: boolean;
    notifInAppBadge?: boolean;
    notifLawyerResponse?: boolean;
    notifConsultReminder?: boolean;
    notifMatchAlert?: boolean;
    notifMessages?: boolean;
    notifReviewReminder?: boolean;
    notifWeeklyDigest?: boolean;
    notifStreakReminder?: boolean;
    notifPlatformUpdates?: boolean;
    notifLegalNews?: boolean;
    notifPromotional?: boolean;
    showActivityPublic?: boolean;
    allowAnonymousAnalytics?: boolean;
    personalizedRecommend?: boolean;
    showProfileInCommunity?: boolean;
}
export declare function getCitizenProfile(userId: string): Promise<{
    user: Record<string, unknown>;
    profile: any;
}>;
export declare function updateCitizenProfile(userId: string, input: UpdateCitizenProfileInput): Promise<any>;
export declare function awardXP(userId: string, points: number, reason?: string): Promise<ICitizenProfileDocument>;
export interface ListCitizensParams {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    isActive?: boolean;
}
export declare function listCitizens(params?: ListCitizensParams): Promise<{
    data: {
        user: Record<string, unknown>;
        profile: any;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare function getCitizenById(userId: string): Promise<{
    user: Record<string, unknown>;
    profile: any;
}>;
export declare function updateCitizenStatus(userId: string, action: UserStatusVariant, reason: string, admin: AdminCtx): Promise<{
    message: string;
    userId: string;
    isActive: boolean;
}>;
export declare function emailCitizen(userId: string, subject: string, body: string, admin: AdminCtx): Promise<{
    message: string;
}>;
export declare function getCitizenStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    avgXP: number;
    totalStudyHours: number;
}>;
export {};
//# sourceMappingURL=citizen.service.d.ts.map