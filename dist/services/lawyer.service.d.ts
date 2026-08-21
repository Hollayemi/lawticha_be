import { ILawyerProfileDocument } from '../models/LawyerProfile.model';
import { IVerificationDocument } from '../models/types';
interface AdminCtx {
    adminId: string;
    adminName: string;
}
export interface SubmitVerificationInput {
    scnNumber: string;
    yearOfCall: number;
    calledAt: string;
    specialisms?: string[];
    title?: string;
    bio?: string;
    location?: string;
    state?: string;
    stateCode?: string;
    languages?: string[];
    fees?: {
        message: number;
        call: number;
        video: number;
    };
    /** Pre-uploaded documents (already has a fileUrl) — legacy/alternate input path. */
    documents?: IVerificationDocument[];
    /** Raw multipart files straight off `req.files` — preferred path, uploaded to Cloudinary here. */
    files?: Express.Multer.File[];
}
/**
 * The set of document types the verification flow expects. The label drives which
 * "slot" an uploaded file fills, and lets admins/clients tell which document a
 * lawyer is still missing.
 */
export declare const VERIFICATION_DOCUMENT_LABELS: readonly ["callToBar", "lawSchool", "practicingLicense", "governmentId"];
export type VerificationDocumentLabel = typeof VERIFICATION_DOCUMENT_LABELS[number];
/**
 * Uploads each raw multipart file to Cloudinary and builds the IVerificationDocument
 * metadata (including the label) that verifyDocumentHandler/admin review relies on.
 */
export declare function buildVerificationDocumentsFromFiles(userId: string, files: Express.Multer.File[]): Promise<IVerificationDocument[]>;
export interface UpdateLawyerProfileInput {
    title?: string;
    bio?: string;
    specialisms?: string[];
    languages?: string[];
    location?: string;
    state?: string;
    stateCode?: string;
    fees?: {
        message?: number;
        call?: number;
        video?: number;
    };
}
export interface LawyerProfile {
    id: string;
    scnNumber: string;
    firstName: string;
    lastName: string;
    title: string;
    specialisms: string[];
    location: string;
    state: string;
    rating: number;
    reviewCount: number;
    consultationCount: number;
    responseTime: number;
    feeMessage: number;
    feeCall: number;
    feeVideo: number;
    isAvailable: boolean;
    verificationStatus: string;
    bio: string;
    yearsCall?: number;
    yearCalled?: string | Date;
    languages: string[];
    badges: string[];
    colorA?: string;
    colorB?: string;
}
export declare const generateRequestId: () => string;
export declare function getLawyerProfile(userId: string): Promise<{
    user: Record<string, unknown>;
    profile: any;
}>;
export declare function submitVerification(userId: string, input: SubmitVerificationInput): Promise<{
    message: string;
    profile: any;
}>;
export declare function updateLawyerProfile(userId: string, input: UpdateLawyerProfileInput): Promise<ILawyerProfileDocument>;
export declare function toggleAvailability(userId: string, available: boolean): Promise<ILawyerProfileDocument>;
export declare function advanceVerification(profileId: string, admin: AdminCtx, note?: string): Promise<{
    message: string;
    profile: any;
}>;
export declare function rejectVerification(profileId: string, admin: AdminCtx, reason: string, infoNeeded: boolean): Promise<{
    message: string;
    profile: any;
}>;
export declare function verifyDocument(profileId: string, documentId: string, verified: boolean, admin: AdminCtx): Promise<{
    message: string;
}>;
export interface ListLawyersParams {
    verificationStatus?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    isAvailable?: boolean;
}
export declare function listLawyers(params?: ListLawyersParams): Promise<{
    data: {
        id: any;
        _id: any;
        scnNumber: any;
        firstName: any;
        lastName: any;
        fullName: string;
        email: any;
        picture: any;
        isUserActive: any;
        lastLoginAt: any;
        avatarInitials: string;
        title: any;
        specialisms: any;
        location: any;
        state: any;
        rating: any;
        reviewCount: any;
        consultationCount: any;
        responseTime: number;
        fees: {
            message: any;
            call: any;
            video: any;
        };
        isAvailable: any;
        verificationStatus: any;
        bio: any;
        yearsCall: number | undefined;
        yearOfCall: any;
        languages: any;
        badges: any;
        colorA: any;
        colorB: any;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare function getLawyerById(profileId: string): Promise<{
    id: any;
    _id: any;
    scnNumber: any;
    firstName: any;
    lastName: any;
    fullName: string;
    email: any;
    picture: any;
    isUserActive: any;
    lastLoginAt: any;
    avatarInitials: string;
    title: any;
    specialisms: any;
    location: any;
    state: any;
    rating: any;
    reviewCount: any;
    consultationCount: any;
    responseTime: number;
    fees: {
        message: any;
        call: any;
        video: any;
    };
    isAvailable: any;
    verificationStatus: any;
    bio: any;
    yearsCall: number | undefined;
    yearOfCall: any;
    languages: any;
    badges: any;
    colorA: any;
    colorB: any;
}>;
export declare function updateLawyerStatus(profileId: string, action: 'suspend' | 'reactivate', reason: string, admin: AdminCtx): Promise<{
    message: string;
}>;
export declare function getLawyerStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    avgRating: number;
}>;
/**
 * Get marketplace stats for hero section
 * GET /marketplace/stats
 */
export declare function getMarketplaceStats(): Promise<{
    totalLawyers: number;
    averageRating: number;
    totalConsultations: any;
    verifiedLawyers: number;
    responseRate: number;
    averageResponseTime: number;
}>;
/**
 * Get unique states for filter dropdown
 * GET /marketplace/states
 */
export declare function getMarketplaceStates(): Promise<string[]>;
/**
 * Get specialisms with counts for filter
 * GET /marketplace/specialisms
 */
export declare function getMarketplaceSpecialisms(): Promise<{
    id: string;
    label: string;
    iconName: string;
    count: number;
}[]>;
/**
 * Get filter counts for sidebar
 * GET /marketplace/filter-counts
 */
export declare function getFilterCounts(params: {
    specialism?: string;
    state?: string;
    search?: string;
}): Promise<{
    specialisms: Record<string, number>;
    states: Record<string, number>;
}>;
/**
 * Get marketplace lawyers (public listing)
 * GET /marketplace/lawyers
 */
export interface MarketplaceLawyersParams {
    specialism?: string;
    state?: string;
    search?: string;
    sortBy?: 'rating' | 'reviews' | 'response' | 'fee';
    page?: number;
    pageSize?: number;
    /** Only show lawyers on a paid subscription — used for the citizen's direct-booking flow. */
    subscribedOnly?: boolean;
}
export declare function getMarketplaceLawyers(params?: MarketplaceLawyersParams): Promise<{
    data: {
        id: any;
        _id: any;
        scnNumber: any;
        firstName: any;
        lastName: any;
        fullName: string;
        email: any;
        picture: any;
        isUserActive: any;
        lastLoginAt: any;
        avatarInitials: string;
        title: any;
        specialisms: any;
        location: any;
        state: any;
        rating: any;
        reviewCount: any;
        consultationCount: any;
        responseTime: number;
        fees: {
            message: any;
            call: any;
            video: any;
        };
        isAvailable: any;
        verificationStatus: any;
        bio: any;
        yearsCall: number | undefined;
        yearOfCall: any;
        languages: any;
        badges: any;
        colorA: any;
        colorB: any;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * Get lawyer by SCN number (public)
 * GET /marketplace/lawyers/:scnNumber
 */
export declare function getLawyerByScnNumber(scnNumber: string): Promise<{
    id: any;
    _id: any;
    scnNumber: any;
    firstName: any;
    lastName: any;
    fullName: string;
    email: any;
    picture: any;
    isUserActive: any;
    lastLoginAt: any;
    avatarInitials: string;
    title: any;
    specialisms: any;
    location: any;
    state: any;
    rating: any;
    reviewCount: any;
    consultationCount: any;
    responseTime: number;
    fees: {
        message: any;
        call: any;
        video: any;
    };
    isAvailable: any;
    verificationStatus: any;
    bio: any;
    yearsCall: number | undefined;
    yearOfCall: any;
    languages: any;
    badges: any;
    colorA: any;
    colorB: any;
}>;
/**
 * Request a lawyer match (create match request)
 * POST /marketplace/match-requests
 */
export interface RequestMatchDocumentInput {
    name: string;
    /** Base64 data URI, e.g. "data:application/pdf;base64,...". */
    base64: string;
    sizeBytes?: number;
}
export interface RequestMatchInput {
    specialism: string;
    urgency: string;
    topic: string;
    mode: 'message' | 'call' | 'video' | 'sms';
    location: string;
    description: string;
    notes?: string;
    documents?: RequestMatchDocumentInput[];
    waiver?: boolean;
    waiverReason?: string;
    whenHappened?: Date;
}
export declare function requestLawyerMatch(citizenId: string, input: RequestMatchInput): Promise<{
    requestId: any;
    receiptId: string;
    status: any;
    documentsAttached: number;
    paymentResult: any;
}>;
/**
 * Get lawyer availability slots
 * GET /marketplace/lawyers/:scnNumber/availability
 */
export declare function getLawyerAvailability(scnNumber: string, date?: string): Promise<{
    id: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    timezone: string;
}[]>;
/**
 * Submit a review for a lawyer after consultation
 * POST /marketplace/lawyers/:scnNumber/reviews
 */
export interface SubmitReviewInput {
    consultationId: string;
    rating: number;
    comment: string;
    tags?: string[];
}
export declare function submitReview(citizenId: string, scnNumber: string, input: SubmitReviewInput): Promise<{
    reviewId: any;
    status: string;
    createdAt: Date;
}>;
export {};
//# sourceMappingURL=lawyer.service.d.ts.map