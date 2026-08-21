import { Document, Types } from 'mongoose';
import { ILawyerProfile, IVerificationDocument } from './types';
export interface ILawyerProfileDocument extends Omit<ILawyerProfile, '_id'>, Document {
    _id: Types.ObjectId;
    /**
     * Submit the lawyer's verification application.
     * Sets status → 'pending' and stamps the documents.
     */
    submitVerification(data: {
        scnNumber: string;
        yearOfCall: number;
        calledAt: string;
        specialisms?: string[];
        documents?: IVerificationDocument[];
    }): Promise<ILawyerProfileDocument>;
    /**
     * Advance the verification to the next stage in the workflow:
     * pending → credential_check → training → assessment → verified
     * Throws if already verified or rejected.
     */
    advanceVerification(adminId: Types.ObjectId, note?: string): Promise<ILawyerProfileDocument>;
    /**
     * Reject the verification with a reason.
     * Sets status → 'rejected'.
     */
    rejectVerification(adminId: Types.ObjectId, reason: string): Promise<ILawyerProfileDocument>;
    infoNeededVerification(adminId: Types.ObjectId, reason: string): Promise<ILawyerProfileDocument>;
    /**
     * Mark a specific document as verified (true) or failed (false).
     */
    verifyDocument(documentId: Types.ObjectId, verified: boolean): Promise<ILawyerProfileDocument>;
    /**
     * Update the denormalised performance metrics in one call.
     * Typically called after a consultation is reviewed.
     */
    updateMetrics(data: {
        ratingAvg?: number;
        reviewCount?: number;
        consultationCount?: number;
        responseTimeLabel?: string;
    }): Promise<ILawyerProfileDocument>;
    /**
     * Toggle availability. Returns the updated document.
     */
    setAvailability(available: boolean): Promise<ILawyerProfileDocument>;
    /** Returns true when the lawyer has completed verification */
    get isVerified(): boolean;
}
export declare const LawyerProfileModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=LawyerProfile.model.d.ts.map