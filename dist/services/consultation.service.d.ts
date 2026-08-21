import { MatchStatus } from '../models/types';
import { ConsultStatus, ConsultMode, MatchRequestStatus, IConsultationStats, IMessage, IConsultationDocumentMeta } from '../models/types';
interface AdminCtx {
    adminId: string;
    adminName: string;
}
export interface ListConsultationsParams {
    status?: ConsultStatus | 'all';
    mode?: ConsultMode | 'all';
    search?: string;
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    citizenId?: string;
    lawyerId?: string;
    disputed?: boolean;
    flagged?: boolean;
}
export interface ListMatchRequestsParams {
    status?: MatchRequestStatus | 'all';
    search?: string;
    page?: number;
    pageSize?: number;
    urgency?: string;
}
export interface UpdateConsultationStatusPayload {
    status: ConsultStatus;
    note?: string;
}
export interface ResolveDisputePayload {
    decision: 'citizen' | 'lawyer';
    refundAmount?: number;
    reason: string;
}
export interface FlagConsultationPayload {
    reason: string;
    severity: 'low' | 'medium' | 'high';
}
export interface ApproveRefundPayload {
    approved: boolean;
    adminNote?: string;
}
export declare const generateConsultId: () => string;
export interface UploadDocumentInput {
    file: Buffer | Express.Multer.File | string;
    name: string;
    sizeBytes?: number;
    label?: string;
}
/**
 * Uploads a single document (PDF, image, Word doc, etc.) to Cloudinary as a raw asset
 * and returns the metadata shape stored on a match request.
 */
export declare function uploadDocument(input: UploadDocumentInput, source: 'citizen' | 'firm' | 'lawyer', location?: string): Promise<IConsultationDocumentMeta>;
/** Maps a raw LawyerRequest mongoose document into the DTO shape consumed by the frontend. */
declare function mapMatchRequestToDTO(req: any): {
    id: any;
    citizen: {
        id: any;
        name: any;
        initials: string;
        color: string;
        email: any;
        phone: any;
        state: any;
    };
    specialism: any;
    urgency: any;
    mode: any;
    topic: any;
    description: any;
    notes: any;
    documents: any;
    caseBrief: {
        name: any;
        fileUrl: any;
        sizeBytes: any;
        label: any;
        source: any;
        uploadedAt: any;
    } | undefined;
    adminMessage: any;
    adminMessageAt: any;
    scheduledCall: {
        dateTime: any;
        link: any;
        note: any;
    } | undefined;
    recommendedLawyers: any;
    rejectedLawyers: any;
    status: any;
    createdAt: any;
    expiresAt: any;
    matchedLawyer: any;
    matchedLawyerId: {
        initials: string;
        name: string;
        picture: any;
    } | {
        initials?: undefined;
        name?: undefined;
        picture?: undefined;
    };
    consultationId: any;
};
/** Shared shape returned to both citizen and lawyer views */
export declare function formatConsultation(consult: any): Promise<{
    id: any;
    citizen: {
        id: string;
        name: string;
        initials: string;
        color: string;
        email: string;
        phone: string | undefined;
    } | null;
    lawyer: {
        id: any;
        name: any;
        initials: string;
        color: any;
        specialisms: any;
        scnNumber: any;
        myPayout: any;
    } | null;
    mode: any;
    conversationId: any;
    topic: any;
    detail: any;
    status: any;
    fee: any;
    receiptId: any;
    platformFee: any;
    lawyerPayout: any;
    createdAt: any;
    completedAt: any;
    rating: any;
    ratingNote: any;
    duration: string | undefined;
    disputed: any;
    disputeReason: any;
    transcript: any;
    flagged: any;
    flagReason: any;
    refundRequested: any;
    refundApproved: any;
    refundReason: any;
    paymentRef: any;
    lawyerResponseAt: any;
}>;
/**
 * Book a consultation (create new consultation)
 * POST /marketplace/consultations
 */
export interface BookConsultationInput {
    lawyerScnNumber: string;
    mode: 'message' | 'call' | 'video';
    topic: string;
    description?: string;
    receiptId?: string;
    requestId?: string;
    waiver?: boolean;
}
export declare function bookConsultation(citizenId: string, citizenName: string, input: BookConsultationInput): Promise<{
    consultationId: any;
    receiptId: string;
    status: any;
    fee: number;
    lawyerResponseTime: any;
    estimatedResponseAt: Date;
}>;
/**
 * GET /consultations/citizen
 * All consultations belonging to the authenticated citizen.
 */
export declare function getCitizenConsultations(citizenId: string, params?: ListConsultationsParams): Promise<{
    data: {
        id: any;
        citizen: {
            id: string;
            name: string;
            initials: string;
            color: string;
            email: string;
            phone: string | undefined;
        } | null;
        lawyer: {
            id: any;
            name: any;
            initials: string;
            color: any;
            specialisms: any;
            scnNumber: any;
            myPayout: any;
        } | null;
        mode: any;
        conversationId: any;
        topic: any;
        detail: any;
        status: any;
        fee: any;
        receiptId: any;
        platformFee: any;
        lawyerPayout: any;
        createdAt: any;
        completedAt: any;
        rating: any;
        ratingNote: any;
        duration: string | undefined;
        disputed: any;
        disputeReason: any;
        transcript: any;
        flagged: any;
        flagReason: any;
        refundRequested: any;
        refundApproved: any;
        refundReason: any;
        paymentRef: any;
        lawyerResponseAt: any;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * GET /consultations/citizen/:id
 * Single consultation for the authenticated citizen (ownership check).
 */
export declare function getCitizenConsultationById(consultationId: string, citizenId: string): Promise<{
    id: any;
    citizen: {
        id: string;
        name: string;
        initials: string;
        color: string;
        email: string;
        phone: string | undefined;
    } | null;
    lawyer: {
        id: any;
        name: any;
        initials: string;
        color: any;
        specialisms: any;
        scnNumber: any;
        myPayout: any;
    } | null;
    mode: any;
    conversationId: any;
    topic: any;
    detail: any;
    status: any;
    fee: any;
    receiptId: any;
    platformFee: any;
    lawyerPayout: any;
    createdAt: any;
    completedAt: any;
    rating: any;
    ratingNote: any;
    duration: string | undefined;
    disputed: any;
    disputeReason: any;
    transcript: any;
    flagged: any;
    flagReason: any;
    refundRequested: any;
    refundApproved: any;
    refundReason: any;
    paymentRef: any;
    lawyerResponseAt: any;
}>;
/**
 * GET /consultations/citizen/stats
 * Aggregate stats for the citizen dashboard.
 */
export declare function getCitizenConsultationStats(citizenId: string): Promise<IConsultationStats>;
/**
 * POST /consultations/citizen/:id/dispute
 * Citizen raises a dispute on an active/completed consultation.
 */
export declare function raiseDispute(consultationId: string, citizenId: string, reason: string): Promise<{
    id: any;
    citizen: {
        id: string;
        name: string;
        initials: string;
        color: string;
        email: string;
        phone: string | undefined;
    } | null;
    lawyer: {
        id: any;
        name: any;
        initials: string;
        color: any;
        specialisms: any;
        scnNumber: any;
        myPayout: any;
    } | null;
    mode: any;
    conversationId: any;
    topic: any;
    detail: any;
    status: any;
    fee: any;
    receiptId: any;
    platformFee: any;
    lawyerPayout: any;
    createdAt: any;
    completedAt: any;
    rating: any;
    ratingNote: any;
    duration: string | undefined;
    disputed: any;
    disputeReason: any;
    transcript: any;
    flagged: any;
    flagReason: any;
    refundRequested: any;
    refundApproved: any;
    refundReason: any;
    paymentRef: any;
    lawyerResponseAt: any;
}>;
/**
 * POST /consultations/citizen/:id/refund-request
 * Citizen requests a refund.
 */
export declare function requestRefund(consultationId: string, citizenId: string, reason?: string): Promise<{
    id: any;
    citizen: {
        id: string;
        name: string;
        initials: string;
        color: string;
        email: string;
        phone: string | undefined;
    } | null;
    lawyer: {
        id: any;
        name: any;
        initials: string;
        color: any;
        specialisms: any;
        scnNumber: any;
        myPayout: any;
    } | null;
    mode: any;
    conversationId: any;
    topic: any;
    detail: any;
    status: any;
    fee: any;
    receiptId: any;
    platformFee: any;
    lawyerPayout: any;
    createdAt: any;
    completedAt: any;
    rating: any;
    ratingNote: any;
    duration: string | undefined;
    disputed: any;
    disputeReason: any;
    transcript: any;
    flagged: any;
    flagReason: any;
    refundRequested: any;
    refundApproved: any;
    refundReason: any;
    paymentRef: any;
    lawyerResponseAt: any;
}>;
/**
 * POST /consultations/citizen/:id/rating
 * Citizen submits a rating/review after a completed consultation.
 */
export declare function submitCitizenRating(consultationId: string, citizenId: string, rating: number, comment?: string): Promise<{
    id: any;
    citizen: {
        id: string;
        name: string;
        initials: string;
        color: string;
        email: string;
        phone: string | undefined;
    } | null;
    lawyer: {
        id: any;
        name: any;
        initials: string;
        color: any;
        specialisms: any;
        scnNumber: any;
        myPayout: any;
    } | null;
    mode: any;
    conversationId: any;
    topic: any;
    detail: any;
    status: any;
    fee: any;
    receiptId: any;
    platformFee: any;
    lawyerPayout: any;
    createdAt: any;
    completedAt: any;
    rating: any;
    ratingNote: any;
    duration: string | undefined;
    disputed: any;
    disputeReason: any;
    transcript: any;
    flagged: any;
    flagReason: any;
    refundRequested: any;
    refundApproved: any;
    refundReason: any;
    paymentRef: any;
    lawyerResponseAt: any;
}>;
/**
 * POST /consultations/citizen/:id/messages
 * Citizen sends a message inside an active consultation transcript.
 */
export declare function sendCitizenMessage(consultationId: string, citizenId: string, text: string): Promise<{
    message: IMessage;
    consultationId: string;
}>;
/**
 * GET /consultations/lawyer
 * All consultations belonging to the authenticated lawyer.
 */
export declare function getLawyerConsultations(lawyerId: string, params?: ListConsultationsParams): Promise<{
    data: {
        id: any;
        citizen: {
            id: string;
            name: string;
            initials: string;
            color: string;
            email: string;
            phone: string | undefined;
        } | null;
        lawyer: {
            id: any;
            name: any;
            initials: string;
            color: any;
            specialisms: any;
            scnNumber: any;
            myPayout: any;
        } | null;
        mode: any;
        conversationId: any;
        topic: any;
        detail: any;
        status: any;
        fee: any;
        receiptId: any;
        platformFee: any;
        lawyerPayout: any;
        createdAt: any;
        completedAt: any;
        rating: any;
        ratingNote: any;
        duration: string | undefined;
        disputed: any;
        disputeReason: any;
        transcript: any;
        flagged: any;
        flagReason: any;
        refundRequested: any;
        refundApproved: any;
        refundReason: any;
        paymentRef: any;
        lawyerResponseAt: any;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * GET /consultations/lawyer/:id
 * Single consultation for the authenticated lawyer (ownership check).
 */
export declare function getLawyerConsultationById(consultationId: string, lawyerId: string): Promise<{
    id: any;
    citizen: {
        id: string;
        name: string;
        initials: string;
        color: string;
        email: string;
        phone: string | undefined;
    } | null;
    lawyer: {
        id: any;
        name: any;
        initials: string;
        color: any;
        specialisms: any;
        scnNumber: any;
        myPayout: any;
    } | null;
    mode: any;
    conversationId: any;
    topic: any;
    detail: any;
    status: any;
    fee: any;
    receiptId: any;
    platformFee: any;
    lawyerPayout: any;
    createdAt: any;
    completedAt: any;
    rating: any;
    ratingNote: any;
    duration: string | undefined;
    disputed: any;
    disputeReason: any;
    transcript: any;
    flagged: any;
    flagReason: any;
    refundRequested: any;
    refundApproved: any;
    refundReason: any;
    paymentRef: any;
    lawyerResponseAt: any;
}>;
/**
 * GET /consultations/lawyer/stats
 */
export declare function getLawyerConsultationStats(lawyerId: string): Promise<{
    total: number;
    active: number;
    awaitingLawyer: number;
    completed: number;
    disputed: number;
    cancelled: number;
    totalEarnings: any;
    averageRating: number;
    completionRate: number;
}>;
/**
 * POST /consultations/lawyer/:id/accept
 * Lawyer accepts a consultation that is in `awaiting_lawyer` status.
 */
export declare function acceptConsultation(consultationId: string, lawyerId: string): Promise<{
    id: any;
    citizen: {
        id: string;
        name: string;
        initials: string;
        color: string;
        email: string;
        phone: string | undefined;
    } | null;
    lawyer: {
        id: any;
        name: any;
        initials: string;
        color: any;
        specialisms: any;
        scnNumber: any;
        myPayout: any;
    } | null;
    mode: any;
    conversationId: any;
    topic: any;
    detail: any;
    status: any;
    fee: any;
    receiptId: any;
    platformFee: any;
    lawyerPayout: any;
    createdAt: any;
    completedAt: any;
    rating: any;
    ratingNote: any;
    duration: string | undefined;
    disputed: any;
    disputeReason: any;
    transcript: any;
    flagged: any;
    flagReason: any;
    refundRequested: any;
    refundApproved: any;
    refundReason: any;
    paymentRef: any;
    lawyerResponseAt: any;
}>;
/**
 * POST /consultations/lawyer/:id/reject
 * Lawyer rejects/declines a consultation request.
 *
 * If this consultation originated from a match request (a "case" the citizen already
 * paid for), rejecting it does NOT close out the case — it reopens the match request
 * so the citizen can pick a different lawyer without paying again. The rejecting
 * lawyer is excluded from future suggestions/selection for that same case.
 */
export declare function rejectConsultation(consultationId: string, lawyerId: string, reason: string): Promise<{
    id: any;
    citizen: {
        id: string;
        name: string;
        initials: string;
        color: string;
        email: string;
        phone: string | undefined;
    } | null;
    lawyer: {
        id: any;
        name: any;
        initials: string;
        color: any;
        specialisms: any;
        scnNumber: any;
        myPayout: any;
    } | null;
    mode: any;
    conversationId: any;
    topic: any;
    detail: any;
    status: any;
    fee: any;
    receiptId: any;
    platformFee: any;
    lawyerPayout: any;
    createdAt: any;
    completedAt: any;
    rating: any;
    ratingNote: any;
    duration: string | undefined;
    disputed: any;
    disputeReason: any;
    transcript: any;
    flagged: any;
    flagReason: any;
    refundRequested: any;
    refundApproved: any;
    refundReason: any;
    paymentRef: any;
    lawyerResponseAt: any;
}>;
/**
 * POST /consultations/lawyer/:id/messages
 * Lawyer sends a message inside the consultation transcript.
 */
export declare function sendLawyerMessage(consultationId: string, lawyerId: string, text: string): Promise<{
    message: IMessage;
    consultationId: string;
}>;
/**
 * POST /consultations/lawyer/:id/complete
 * Lawyer marks the consultation as completed.
 */
export declare function completeConsultation(consultationId: string, lawyerId: string): Promise<{
    id: any;
    citizen: {
        id: string;
        name: string;
        initials: string;
        color: string;
        email: string;
        phone: string | undefined;
    } | null;
    lawyer: {
        id: any;
        name: any;
        initials: string;
        color: any;
        specialisms: any;
        scnNumber: any;
        myPayout: any;
    } | null;
    mode: any;
    conversationId: any;
    topic: any;
    detail: any;
    status: any;
    fee: any;
    receiptId: any;
    platformFee: any;
    lawyerPayout: any;
    createdAt: any;
    completedAt: any;
    rating: any;
    ratingNote: any;
    duration: string | undefined;
    disputed: any;
    disputeReason: any;
    transcript: any;
    flagged: any;
    flagReason: any;
    refundRequested: any;
    refundApproved: any;
    refundReason: any;
    paymentRef: any;
    lawyerResponseAt: any;
}>;
/**
 * GET /consultations/matches
 * Match requests visible to a lawyer — only cases the firm has specifically
 * recommended them for (the old "browse the open pool" behaviour is retired
 * now that the firm reviews and shortlists cases before a lawyer ever sees them).
 */
export declare function getMatchRequestsForLawyer(lawyerId: string, params?: ListMatchRequestsParams): Promise<{
    data: {
        id: any;
        citizen: {
            id: any;
            name: any;
            initials: string;
            color: string;
            email: any;
            phone: any;
            state: any;
        };
        specialism: any;
        urgency: any;
        mode: any;
        topic: any;
        description: any;
        notes: any;
        documents: any;
        caseBrief: {
            name: any;
            fileUrl: any;
            sizeBytes: any;
            label: any;
            source: any;
            uploadedAt: any;
        } | undefined;
        adminMessage: any;
        adminMessageAt: any;
        scheduledCall: {
            dateTime: any;
            link: any;
            note: any;
        } | undefined;
        recommendedLawyers: any;
        rejectedLawyers: any;
        status: any;
        createdAt: any;
        expiresAt: any;
        matchedLawyer: any;
        matchedLawyerId: {
            initials: string;
            name: string;
            picture: any;
        } | {
            initials?: undefined;
            name?: undefined;
            picture?: undefined;
        };
        consultationId: any;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * GET /consultations/citizen/match-requests
 */
export declare function getMatchRequestsForCitizen(citizenId: string, params?: ListMatchRequestsParams): Promise<{
    data: {
        id: any;
        citizen: {
            id: any;
            name: any;
            initials: string;
            color: string;
            email: any;
            phone: any;
            state: any;
        };
        specialism: any;
        urgency: any;
        mode: any;
        topic: any;
        description: any;
        notes: any;
        documents: any;
        caseBrief: {
            name: any;
            fileUrl: any;
            sizeBytes: any;
            label: any;
            source: any;
            uploadedAt: any;
        } | undefined;
        adminMessage: any;
        adminMessageAt: any;
        scheduledCall: {
            dateTime: any;
            link: any;
            note: any;
        } | undefined;
        recommendedLawyers: any;
        rejectedLawyers: any;
        status: any;
        createdAt: any;
        expiresAt: any;
        matchedLawyer: any;
        matchedLawyerId: {
            initials: string;
            name: string;
            picture: any;
        } | {
            initials?: undefined;
            name?: undefined;
            picture?: undefined;
        };
        consultationId: any;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * GET /consultations/citizen/match-requests/:id
 */
export declare function getMatchRequestForCitizen(matchRequestId: string, citizenId: string): Promise<{
    id: any;
    citizen: {
        id: any;
        name: any;
        initials: string;
        color: string;
        email: any;
        phone: any;
        state: any;
    };
    specialism: any;
    urgency: any;
    mode: any;
    topic: any;
    description: any;
    notes: any;
    documents: any;
    caseBrief: {
        name: any;
        fileUrl: any;
        sizeBytes: any;
        label: any;
        source: any;
        uploadedAt: any;
    } | undefined;
    adminMessage: any;
    adminMessageAt: any;
    scheduledCall: {
        dateTime: any;
        link: any;
        note: any;
    } | undefined;
    recommendedLawyers: any;
    rejectedLawyers: any;
    status: any;
    createdAt: any;
    expiresAt: any;
    matchedLawyer: any;
    matchedLawyerId: {
        initials: string;
        name: string;
        picture: any;
    } | {
        initials?: undefined;
        name?: undefined;
        picture?: undefined;
    };
    consultationId: any;
}>;
/**
 * POST /consultations/citizen/match-requests/:id/documents
 * A citizen attaching supporting documents, either at intake or afterwards.
 */
export declare function addCitizenMatchDocument(matchRequestId: string, citizenId: string, input: UploadDocumentInput): Promise<{
    id: any;
    citizen: {
        id: any;
        name: any;
        initials: string;
        color: string;
        email: any;
        phone: any;
        state: any;
    };
    specialism: any;
    urgency: any;
    mode: any;
    topic: any;
    description: any;
    notes: any;
    documents: any;
    caseBrief: {
        name: any;
        fileUrl: any;
        sizeBytes: any;
        label: any;
        source: any;
        uploadedAt: any;
    } | undefined;
    adminMessage: any;
    adminMessageAt: any;
    scheduledCall: {
        dateTime: any;
        link: any;
        note: any;
    } | undefined;
    recommendedLawyers: any;
    rejectedLawyers: any;
    status: any;
    createdAt: any;
    expiresAt: any;
    matchedLawyer: any;
    matchedLawyerId: {
        initials: string;
        name: string;
        picture: any;
    } | {
        initials?: undefined;
        name?: undefined;
        picture?: undefined;
    };
    consultationId: any;
}>;
/**
 * POST /consultations/citizen/match-requests/:id/select-lawyer
 * The citizen picks a lawyer from their recommended shortlist. This finalizes
 * the match and creates the paid consultation (mirroring the direct-booking flow).
 */
export declare function citizenSelectRecommendedLawyer(matchRequestId: string, citizenId: string, citizenName: string, lawyerProfileId: string): Promise<{
    id: any;
    citizen: {
        id: any;
        name: any;
        initials: string;
        color: string;
        email: any;
        phone: any;
        state: any;
    };
    specialism: any;
    urgency: any;
    mode: any;
    topic: any;
    description: any;
    notes: any;
    documents: any;
    caseBrief: {
        name: any;
        fileUrl: any;
        sizeBytes: any;
        label: any;
        source: any;
        uploadedAt: any;
    } | undefined;
    adminMessage: any;
    adminMessageAt: any;
    scheduledCall: {
        dateTime: any;
        link: any;
        note: any;
    } | undefined;
    recommendedLawyers: any;
    rejectedLawyers: any;
    status: any;
    createdAt: any;
    expiresAt: any;
    matchedLawyer: any;
    matchedLawyerId: {
        initials: string;
        name: string;
        picture: any;
    } | {
        initials?: undefined;
        name?: undefined;
        picture?: undefined;
    };
    consultationId: any;
    book: {
        consultationId: any;
        receiptId: string;
        status: any;
        fee: number;
        lawyerResponseTime: any;
        estimatedResponseAt: Date;
    };
}>;
/**
 * GET /consultations/statuses/:role
 * Returns filterable status options with live counts.
 */
export declare function getAvailableStatuses(role: 'citizen' | 'lawyer' | 'admin', userId?: string): Promise<{
    value: ConsultStatus;
    label: string;
    count: any;
}[]>;
/**
 * Admin: List consultations (all) with full filters.
 */
export declare function listConsultations(params?: ListConsultationsParams): Promise<{
    data: {
        id: any;
        citizen: {
            id: string;
            name: string;
            initials: string;
            color: string;
            email: string;
            phone: string | undefined;
        } | null;
        lawyer: {
            id: any;
            name: any;
            initials: string;
            color: any;
            specialisms: any;
            scnNumber: any;
            myPayout: any;
        } | null;
        mode: any;
        conversationId: any;
        topic: any;
        detail: any;
        status: any;
        fee: any;
        receiptId: any;
        platformFee: any;
        lawyerPayout: any;
        createdAt: any;
        completedAt: any;
        rating: any;
        ratingNote: any;
        duration: string | undefined;
        disputed: any;
        disputeReason: any;
        transcript: any;
        flagged: any;
        flagReason: any;
        refundRequested: any;
        refundApproved: any;
        refundReason: any;
        paymentRef: any;
        lawyerResponseAt: any;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * Admin: Get single consultation by ID (no ownership check).
 */
export declare function getConsultationById(consultationId: string): Promise<{
    id: any;
    citizen: {
        id: string;
        name: string;
        initials: string;
        color: string;
        email: string;
        phone: string | undefined;
    } | null;
    lawyer: {
        id: any;
        name: any;
        initials: string;
        color: any;
        specialisms: any;
        scnNumber: any;
        myPayout: any;
    } | null;
    mode: any;
    conversationId: any;
    topic: any;
    detail: any;
    status: any;
    fee: any;
    receiptId: any;
    platformFee: any;
    lawyerPayout: any;
    createdAt: any;
    completedAt: any;
    rating: any;
    ratingNote: any;
    duration: string | undefined;
    disputed: any;
    disputeReason: any;
    transcript: any;
    flagged: any;
    flagReason: any;
    refundRequested: any;
    refundApproved: any;
    refundReason: any;
    paymentRef: any;
    lawyerResponseAt: any;
}>;
/**
 * Admin: Aggregate consultation statistics.
 */
export declare function getConsultationStats(): Promise<IConsultationStats>;
/**
 * Admin: List all disputed consultations.
 */
export declare function listDisputes(params?: {
    status?: 'pending' | 'resolved';
    page?: number;
    pageSize?: number;
}): Promise<{
    data: {
        id: any;
        citizen: {
            id: string;
            name: string;
            initials: string;
            color: string;
            email: string;
            phone: string | undefined;
        } | null;
        lawyer: {
            id: any;
            name: any;
            initials: string;
            color: any;
            specialisms: any;
            scnNumber: any;
            myPayout: any;
        } | null;
        mode: any;
        conversationId: any;
        topic: any;
        detail: any;
        status: any;
        fee: any;
        receiptId: any;
        platformFee: any;
        lawyerPayout: any;
        createdAt: any;
        completedAt: any;
        rating: any;
        ratingNote: any;
        duration: string | undefined;
        disputed: any;
        disputeReason: any;
        transcript: any;
        flagged: any;
        flagReason: any;
        refundRequested: any;
        refundApproved: any;
        refundReason: any;
        paymentRef: any;
        lawyerResponseAt: any;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * Admin: List all refund requests.
 */
export declare function listRefundRequests(params?: {
    status?: 'pending' | 'approved' | 'rejected';
    page?: number;
    pageSize?: number;
}): Promise<{
    data: {
        id: any;
        citizen: {
            id: string;
            name: string;
            initials: string;
            color: string;
            email: string;
            phone: string | undefined;
        } | null;
        lawyer: {
            id: any;
            name: any;
            initials: string;
            color: any;
            specialisms: any;
            scnNumber: any;
            myPayout: any;
        } | null;
        mode: any;
        conversationId: any;
        topic: any;
        detail: any;
        status: any;
        fee: any;
        receiptId: any;
        platformFee: any;
        lawyerPayout: any;
        createdAt: any;
        completedAt: any;
        rating: any;
        ratingNote: any;
        duration: string | undefined;
        disputed: any;
        disputeReason: any;
        transcript: any;
        flagged: any;
        flagReason: any;
        refundRequested: any;
        refundApproved: any;
        refundReason: any;
        paymentRef: any;
        lawyerResponseAt: any;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * Admin: List all flagged consultations.
 */
export declare function listFlaggedConsultations(params?: {
    severity?: 'low' | 'medium' | 'high';
    resolved?: boolean;
    page?: number;
    pageSize?: number;
}): Promise<{
    data: {
        id: any;
        citizen: {
            id: string;
            name: string;
            initials: string;
            color: string;
            email: string;
            phone: string | undefined;
        } | null;
        lawyer: {
            id: any;
            name: any;
            initials: string;
            color: any;
            specialisms: any;
            scnNumber: any;
            myPayout: any;
        } | null;
        mode: any;
        conversationId: any;
        topic: any;
        detail: any;
        status: any;
        fee: any;
        receiptId: any;
        platformFee: any;
        lawyerPayout: any;
        createdAt: any;
        completedAt: any;
        rating: any;
        ratingNote: any;
        duration: string | undefined;
        disputed: any;
        disputeReason: any;
        transcript: any;
        flagged: any;
        flagReason: any;
        refundRequested: any;
        refundApproved: any;
        refundReason: any;
        paymentRef: any;
        lawyerResponseAt: any;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * Admin: Update consultation status.
 */
export declare function updateConsultationStatus(consultationId: string, payload: UpdateConsultationStatusPayload, admin: AdminCtx): Promise<{
    id: any;
    citizen: {
        id: string;
        name: string;
        initials: string;
        color: string;
        email: string;
        phone: string | undefined;
    } | null;
    lawyer: {
        id: any;
        name: any;
        initials: string;
        color: any;
        specialisms: any;
        scnNumber: any;
        myPayout: any;
    } | null;
    mode: any;
    conversationId: any;
    topic: any;
    detail: any;
    status: any;
    fee: any;
    receiptId: any;
    platformFee: any;
    lawyerPayout: any;
    createdAt: any;
    completedAt: any;
    rating: any;
    ratingNote: any;
    duration: string | undefined;
    disputed: any;
    disputeReason: any;
    transcript: any;
    flagged: any;
    flagReason: any;
    refundRequested: any;
    refundApproved: any;
    refundReason: any;
    paymentRef: any;
    lawyerResponseAt: any;
}>;
/**
 * Admin: Resolve a dispute.
 */
export declare function resolveDispute(consultationId: string, payload: ResolveDisputePayload, admin: AdminCtx): Promise<{
    id: any;
    citizen: {
        id: string;
        name: string;
        initials: string;
        color: string;
        email: string;
        phone: string | undefined;
    } | null;
    lawyer: {
        id: any;
        name: any;
        initials: string;
        color: any;
        specialisms: any;
        scnNumber: any;
        myPayout: any;
    } | null;
    mode: any;
    conversationId: any;
    topic: any;
    detail: any;
    status: any;
    fee: any;
    receiptId: any;
    platformFee: any;
    lawyerPayout: any;
    createdAt: any;
    completedAt: any;
    rating: any;
    ratingNote: any;
    duration: string | undefined;
    disputed: any;
    disputeReason: any;
    transcript: any;
    flagged: any;
    flagReason: any;
    refundRequested: any;
    refundApproved: any;
    refundReason: any;
    paymentRef: any;
    lawyerResponseAt: any;
}>;
/**
 * Admin: Flag consultation for review.
 */
export declare function flagConsultation(consultationId: string, payload: FlagConsultationPayload, admin: AdminCtx): Promise<{
    id: any;
    citizen: {
        id: string;
        name: string;
        initials: string;
        color: string;
        email: string;
        phone: string | undefined;
    } | null;
    lawyer: {
        id: any;
        name: any;
        initials: string;
        color: any;
        specialisms: any;
        scnNumber: any;
        myPayout: any;
    } | null;
    mode: any;
    conversationId: any;
    topic: any;
    detail: any;
    status: any;
    fee: any;
    receiptId: any;
    platformFee: any;
    lawyerPayout: any;
    createdAt: any;
    completedAt: any;
    rating: any;
    ratingNote: any;
    duration: string | undefined;
    disputed: any;
    disputeReason: any;
    transcript: any;
    flagged: any;
    flagReason: any;
    refundRequested: any;
    refundApproved: any;
    refundReason: any;
    paymentRef: any;
    lawyerResponseAt: any;
}>;
/**
 * Admin: Approve or reject a refund request.
 */
export declare function approveRefund(consultationId: string, payload: ApproveRefundPayload, admin: AdminCtx): Promise<{
    id: any;
    citizen: {
        id: string;
        name: string;
        initials: string;
        color: string;
        email: string;
        phone: string | undefined;
    } | null;
    lawyer: {
        id: any;
        name: any;
        initials: string;
        color: any;
        specialisms: any;
        scnNumber: any;
        myPayout: any;
    } | null;
    mode: any;
    conversationId: any;
    topic: any;
    detail: any;
    status: any;
    fee: any;
    receiptId: any;
    platformFee: any;
    lawyerPayout: any;
    createdAt: any;
    completedAt: any;
    rating: any;
    ratingNote: any;
    duration: string | undefined;
    disputed: any;
    disputeReason: any;
    transcript: any;
    flagged: any;
    flagReason: any;
    refundRequested: any;
    refundApproved: any;
    refundReason: any;
    paymentRef: any;
    lawyerResponseAt: any;
}>;
/**
 * Admin: Send warning to lawyer.
 */
export declare function sendLawyerWarning(consultationId: string, lawyerId: string, reason: string, admin: AdminCtx): Promise<{
    message: string;
}>;
/**
 * Admin: Bulk action on consultations.
 */
export declare function bulkAction(consultationIds: string[], action: 'flag' | 'refund' | 'cancel', reason: string, admin: AdminCtx): Promise<{
    success: boolean;
    message: string;
    affectedCount: number;
    consultationIds: string[];
}>;
/**
 * Admin: Export consultations.
 */
export declare function exportConsultations(params: ListConsultationsParams): Promise<{
    headers: string[];
    rows: any[][];
}>;
/**
 * GET /admin/consultations/match-requests
 */
export declare function listMatchRequests(params?: ListMatchRequestsParams): Promise<{
    data: {
        id: any;
        citizen: {
            id: any;
            name: any;
            initials: string;
            color: string;
            email: any;
            phone: any;
            state: any;
        };
        specialism: any;
        urgency: any;
        mode: any;
        topic: any;
        description: any;
        notes: any;
        documents: any;
        caseBrief: {
            name: any;
            fileUrl: any;
            sizeBytes: any;
            label: any;
            source: any;
            uploadedAt: any;
        } | undefined;
        adminMessage: any;
        adminMessageAt: any;
        scheduledCall: {
            dateTime: any;
            link: any;
            note: any;
        } | undefined;
        recommendedLawyers: any;
        rejectedLawyers: any;
        status: any;
        createdAt: any;
        expiresAt: any;
        matchedLawyer: any;
        matchedLawyerId: {
            initials: string;
            name: string;
            picture: any;
        } | {
            initials?: undefined;
            name?: undefined;
            picture?: undefined;
        };
        consultationId: any;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * GET /admin/consultations/match-requests/:id
 */
export declare function getMatchRequestById(matchRequestId: string): Promise<{
    id: any;
    citizen: {
        id: any;
        name: any;
        initials: string;
        color: string;
        email: any;
        phone: any;
        state: any;
    };
    specialism: any;
    urgency: any;
    mode: any;
    topic: any;
    description: any;
    notes: any;
    documents: any;
    caseBrief: {
        name: any;
        fileUrl: any;
        sizeBytes: any;
        label: any;
        source: any;
        uploadedAt: any;
    } | undefined;
    adminMessage: any;
    adminMessageAt: any;
    scheduledCall: {
        dateTime: any;
        link: any;
        note: any;
    } | undefined;
    recommendedLawyers: any;
    rejectedLawyers: any;
    status: any;
    createdAt: any;
    expiresAt: any;
    matchedLawyer: any;
    matchedLawyerId: {
        initials: string;
        name: string;
        picture: any;
    } | {
        initials?: undefined;
        name?: undefined;
        picture?: undefined;
    };
    consultationId: any;
}>;
/**
 * POST /admin/consultations/match-requests/:id/accept
 * Admin picks up a request and begins reviewing it. This is the entry point into
 * the firm-assisted flow: pending/unassigned -> in_review.
 */
export declare function adminAcceptMatchRequest(matchRequestId: string, admin: AdminCtx): Promise<{
    id: any;
    citizen: {
        id: any;
        name: any;
        initials: string;
        color: string;
        email: any;
        phone: any;
        state: any;
    };
    specialism: any;
    urgency: any;
    mode: any;
    topic: any;
    description: any;
    notes: any;
    documents: any;
    caseBrief: {
        name: any;
        fileUrl: any;
        sizeBytes: any;
        label: any;
        source: any;
        uploadedAt: any;
    } | undefined;
    adminMessage: any;
    adminMessageAt: any;
    scheduledCall: {
        dateTime: any;
        link: any;
        note: any;
    } | undefined;
    recommendedLawyers: any;
    rejectedLawyers: any;
    status: any;
    createdAt: any;
    expiresAt: any;
    matchedLawyer: any;
    matchedLawyerId: {
        initials: string;
        name: string;
        picture: any;
    } | {
        initials?: undefined;
        name?: undefined;
        picture?: undefined;
    };
    consultationId: any;
}>;
export declare function updateCitizenMatchStatus(matchRequestId: string, newStatus: MatchStatus, admin: AdminCtx): Promise<{
    id: any;
    citizen: {
        id: any;
        name: any;
        initials: string;
        color: string;
        email: any;
        phone: any;
        state: any;
    };
    specialism: any;
    urgency: any;
    mode: any;
    topic: any;
    description: any;
    notes: any;
    documents: any;
    caseBrief: {
        name: any;
        fileUrl: any;
        sizeBytes: any;
        label: any;
        source: any;
        uploadedAt: any;
    } | undefined;
    adminMessage: any;
    adminMessageAt: any;
    scheduledCall: {
        dateTime: any;
        link: any;
        note: any;
    } | undefined;
    recommendedLawyers: any;
    rejectedLawyers: any;
    status: any;
    createdAt: any;
    expiresAt: any;
    matchedLawyer: any;
    matchedLawyerId: {
        initials: string;
        name: string;
        picture: any;
    } | {
        initials?: undefined;
        name?: undefined;
        picture?: undefined;
    };
    consultationId: any;
}>;
/**
 * POST /admin/consultations/match-requests/:id/message
 * Admin conducts the initial (message-mode) consultation themselves, before
 * recommending lawyers.
 */
export declare function sendAdminMatchMessage(matchRequestId: string, admin: AdminCtx, message: string): Promise<{
    id: any;
    citizen: {
        id: any;
        name: any;
        initials: string;
        color: string;
        email: any;
        phone: any;
        state: any;
    };
    specialism: any;
    urgency: any;
    mode: any;
    topic: any;
    description: any;
    notes: any;
    documents: any;
    caseBrief: {
        name: any;
        fileUrl: any;
        sizeBytes: any;
        label: any;
        source: any;
        uploadedAt: any;
    } | undefined;
    adminMessage: any;
    adminMessageAt: any;
    scheduledCall: {
        dateTime: any;
        link: any;
        note: any;
    } | undefined;
    recommendedLawyers: any;
    rejectedLawyers: any;
    status: any;
    createdAt: any;
    expiresAt: any;
    matchedLawyer: any;
    matchedLawyerId: {
        initials: string;
        name: string;
        picture: any;
    } | {
        initials?: undefined;
        name?: undefined;
        picture?: undefined;
    };
    consultationId: any;
}>;
/**
 * POST /admin/consultations/match-requests/:id/schedule-call
 * Admin organizes a call/video consultation on the firm's behalf.
 */
export declare function scheduleAdminMatchCall(matchRequestId: string, admin: AdminCtx, payload: {
    dateTime: string;
    link?: string;
    note?: string;
}): Promise<{
    id: any;
    citizen: {
        id: any;
        name: any;
        initials: string;
        color: string;
        email: any;
        phone: any;
        state: any;
    };
    specialism: any;
    urgency: any;
    mode: any;
    topic: any;
    description: any;
    notes: any;
    documents: any;
    caseBrief: {
        name: any;
        fileUrl: any;
        sizeBytes: any;
        label: any;
        source: any;
        uploadedAt: any;
    } | undefined;
    adminMessage: any;
    adminMessageAt: any;
    scheduledCall: {
        dateTime: any;
        link: any;
        note: any;
    } | undefined;
    recommendedLawyers: any;
    rejectedLawyers: any;
    status: any;
    createdAt: any;
    expiresAt: any;
    matchedLawyer: any;
    matchedLawyerId: {
        initials: string;
        name: string;
        picture: any;
    } | {
        initials?: undefined;
        name?: undefined;
        picture?: undefined;
    };
    consultationId: any;
}>;
/**
 * POST /admin/consultations/match-requests/:id/documents
 * Admin attaches a document — a supporting file, or (with isCaseBrief) the firm's
 * refined case brief, stored on its own field as a single link.
 */
export declare function adminAddMatchDocument(matchRequestId: string, admin: AdminCtx, input: UploadDocumentInput & {
    isCaseBrief?: boolean;
}): Promise<ReturnType<typeof mapMatchRequestToDTO>>;
/**
 * GET /admin/consultations/match-requests/:id/suggestions
 * "Auto-suggest" — ranks verified, available lawyers who fit the case, WITHOUT
 * assigning anyone. The admin reviews this list (or picks manually) and then
 * calls recommendLawyersForMatch to actually send a shortlist to the citizen.
 * This replaces the old "auto-match" behaviour, which used to book a
 * consultation with the top match automatically — the citizen no longer gets
 * skipped over.
 */
export declare function getAutoSuggestedLawyers(matchRequestId: string, limit?: number): Promise<{
    id: string;
    lawyerId: string;
    ratingAvg: any;
    responseTimeLabel: any;
    fee: any;
    picture: string;
    lawyerProfileId: import("mongoose").ObjectId;
    name: string;
    initials: string;
    color: string;
    scnNumber: string;
    title?: string;
}[]>;
/**
 * POST /admin/consultations/match-requests/:id/recommend
 * Admin sends a shortlist of lawyers to the citizen — whether hand-picked or
 * taken from the auto-suggested list. The citizen then picks who to work with.
 */
export declare function recommendLawyersForMatch(matchRequestId: string, admin: AdminCtx, lawyerProfileIds: string[]): Promise<{
    id: any;
    citizen: {
        id: any;
        name: any;
        initials: string;
        color: string;
        email: any;
        phone: any;
        state: any;
    };
    specialism: any;
    urgency: any;
    mode: any;
    topic: any;
    description: any;
    notes: any;
    documents: any;
    caseBrief: {
        name: any;
        fileUrl: any;
        sizeBytes: any;
        label: any;
        source: any;
        uploadedAt: any;
    } | undefined;
    adminMessage: any;
    adminMessageAt: any;
    scheduledCall: {
        dateTime: any;
        link: any;
        note: any;
    } | undefined;
    recommendedLawyers: any;
    rejectedLawyers: any;
    status: any;
    createdAt: any;
    expiresAt: any;
    matchedLawyer: any;
    matchedLawyerId: {
        initials: string;
        name: string;
        picture: any;
    } | {
        initials?: undefined;
        name?: undefined;
        picture?: undefined;
    };
    consultationId: any;
}>;
/**
 * POST /admin/consultations/match-requests/:id/assign
 * Admin directly assigns one specific lawyer, skipping the citizen's choice —
 * an override for edge cases (e.g. handling things over the phone).
 */
export declare function assignLawyerToMatch(matchRequestId: string, lawyerId: string, admin: AdminCtx): Promise<{
    id: any;
    citizen: {
        id: any;
        name: any;
        initials: string;
        color: string;
        email: any;
        phone: any;
        state: any;
    };
    specialism: any;
    urgency: any;
    mode: any;
    topic: any;
    description: any;
    notes: any;
    documents: any;
    caseBrief: {
        name: any;
        fileUrl: any;
        sizeBytes: any;
        label: any;
        source: any;
        uploadedAt: any;
    } | undefined;
    adminMessage: any;
    adminMessageAt: any;
    scheduledCall: {
        dateTime: any;
        link: any;
        note: any;
    } | undefined;
    recommendedLawyers: any;
    rejectedLawyers: any;
    status: any;
    createdAt: any;
    expiresAt: any;
    matchedLawyer: any;
    matchedLawyerId: {
        initials: string;
        name: string;
        picture: any;
    } | {
        initials?: undefined;
        name?: undefined;
        picture?: undefined;
    };
    consultationId: any;
    book: {
        consultationId: any;
        receiptId: string;
        status: any;
        fee: number;
        lawyerResponseTime: any;
        estimatedResponseAt: Date;
    };
}>;
/**
 * POST /admin/consultations/match-requests/bulk-auto-match (kept for backward compatibility;
 * now performs a bulk AUTO-SUGGEST + recommend instead of an immediate auto-booking).
 * For every unreviewed request, computes the best-fit lawyers and sends that
 * shortlist straight to the citizen — nobody gets booked without the citizen choosing.
 */
export declare function bulkAutoSuggestAndRecommend(admin: AdminCtx, limitPerRequest?: number): Promise<{
    success: boolean;
    recommendedCount: number;
    failedIds: string[];
}>;
/**
 * POST /admin/consultations/match-requests/:id/auto-suggest
 * Quick action for a single request: computes best-fit lawyers and immediately
 * sends that shortlist to the citizen (combines getAutoSuggestedLawyers +
 * recommendLawyersForMatch). This is the direct replacement for the old
 * "auto-match" quick action — the citizen still picks who to work with.
 */
export declare function autoSuggestAndRecommend(matchRequestId: string, admin: AdminCtx, limit?: number): Promise<{
    id: any;
    citizen: {
        id: any;
        name: any;
        initials: string;
        color: string;
        email: any;
        phone: any;
        state: any;
    };
    specialism: any;
    urgency: any;
    mode: any;
    topic: any;
    description: any;
    notes: any;
    documents: any;
    caseBrief: {
        name: any;
        fileUrl: any;
        sizeBytes: any;
        label: any;
        source: any;
        uploadedAt: any;
    } | undefined;
    adminMessage: any;
    adminMessageAt: any;
    scheduledCall: {
        dateTime: any;
        link: any;
        note: any;
    } | undefined;
    recommendedLawyers: any;
    rejectedLawyers: any;
    status: any;
    createdAt: any;
    expiresAt: any;
    matchedLawyer: any;
    matchedLawyerId: {
        initials: string;
        name: string;
        picture: any;
    } | {
        initials?: undefined;
        name?: undefined;
        picture?: undefined;
    };
    consultationId: any;
}>;
export declare function expireMatchRequest(matchRequestId: string, admin: AdminCtx): Promise<{
    id: any;
    citizen: {
        id: any;
        name: any;
        initials: string;
        color: string;
        email: any;
        phone: any;
        state: any;
    };
    specialism: any;
    urgency: any;
    mode: any;
    topic: any;
    description: any;
    notes: any;
    documents: any;
    caseBrief: {
        name: any;
        fileUrl: any;
        sizeBytes: any;
        label: any;
        source: any;
        uploadedAt: any;
    } | undefined;
    adminMessage: any;
    adminMessageAt: any;
    scheduledCall: {
        dateTime: any;
        link: any;
        note: any;
    } | undefined;
    recommendedLawyers: any;
    rejectedLawyers: any;
    status: any;
    createdAt: any;
    expiresAt: any;
    matchedLawyer: any;
    matchedLawyerId: {
        initials: string;
        name: string;
        picture: any;
    } | {
        initials?: undefined;
        name?: undefined;
        picture?: undefined;
    };
    consultationId: any;
}>;
export declare function consultationPayment(consultationId: string): Promise<any>;
export declare function getLawyerPerformance(params?: {
    startDate?: string;
    endDate?: string;
}): Promise<any[]>;
export declare function getTopLawyers(limit?: number, sortBy?: 'revenue' | 'rating' | 'sessions'): Promise<any[]>;
export declare function getDashboardStats(): Promise<{
    consultations: IConsultationStats;
    matchRequests: {
        total: number;
        unassigned: number;
        matching: number;
        matched: number;
        expired: number;
    };
    recentActivity: {
        id: any;
        type: string;
        description: string;
        timestamp: any;
    }[];
}>;
export declare function getRecentActivity(limit?: number): Promise<{
    id: any;
    type: string;
    description: string;
    timestamp: any;
}[]>;
export {};
//# sourceMappingURL=consultation.service.d.ts.map