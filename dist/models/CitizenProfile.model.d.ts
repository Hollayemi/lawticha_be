import { Document, Types } from 'mongoose';
import { ICitizenProfile } from './types';
export interface ICitizenProfileDocument extends Omit<ICitizenProfile, '_id'>, Document {
    _id: Types.ObjectId;
    /**
     * Add XP points, recompute level, and update streakDays.
     * Saves the document automatically.
     */
    addXP(points: number): Promise<ICitizenProfileDocument>;
    /**
     * Mark a learning activity,  advances streakDays if not already counted today,
     * resets the streak if the user skipped yesterday.
     * Saves automatically.
     */
    markActivity(): Promise<ICitizenProfileDocument>;
    /** Increment topicsCompletedCount by 1 and save */
    completeLesson(): Promise<ICitizenProfileDocument>;
    /** Increment certificatesCount by 1 and save */
    issueCertificate(): Promise<ICitizenProfileDocument>;
    /**
     * Add minutes to totalStudyMinutes and save.
     * Typically called when a StudySession is closed.
     */
    addStudyMinutes(minutes: number): Promise<ICitizenProfileDocument>;
}
export declare const CitizenProfileModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=CitizenProfile.model.d.ts.map