import { Schema, model, models, Document, Types } from 'mongoose';
import { ICitizenProfile } from './types';

// XP Level thresholds 
// Each index = level, value = XP required to REACH that level.
// Level 1 = 0 XP, Level 2 = 200 XP, Level 3 = 500 XP, etc.

const XP_THRESHOLDS = [0, 200, 500, 1000, 1800, 3000, 4500, 6500, 9000, 12000, 16000];

function computeLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

// Document interface 

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

// Schema 

const CitizenProfileSchema = new Schema<ICitizenProfileDocument>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
      index:    true,
    },

    // Contact & location 
    phone:     { type: String, trim: true },
    stateCode: { type: String, trim: true },
    bio:       { type: String, maxlength: 500 },

    // Gamification 
    xpTotal:      { type: Number, default: 0,  min: 0 },
    xpLevel:      { type: Number, default: 1,  min: 1 },
    streakDays:   { type: Number, default: 0,  min: 0 },
    streakLastAt: { type: Date },

    // Learning stats 
    topicsCompletedCount: { type: Number, default: 0, min: 0 },
    certificatesCount:    { type: Number, default: 0, min: 0 },
    totalStudyMinutes:    { type: Number, default: 0, min: 0 },

  },
  {
    timestamps: true,
    collection: 'citizen_profiles',
  }
);

// Instance method: addXP 

CitizenProfileSchema.methods.addXP = async function (
  this: ICitizenProfileDocument,
  points: number
): Promise<ICitizenProfileDocument> {
  this.xpTotal += points;
  this.xpLevel  = computeLevel(this.xpTotal);
  return this.save();
};

// Instance method: markActivity 

CitizenProfileSchema.methods.markActivity = async function (
  this: ICitizenProfileDocument
): Promise<ICitizenProfileDocument> {
  const now       = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);

  if (!this.streakLastAt) {
    // First ever activity
    this.streakDays   = 1;
    this.streakLastAt = now;
  } else {
    const last = new Date(
      this.streakLastAt.getFullYear(),
      this.streakLastAt.getMonth(),
      this.streakLastAt.getDate()
    );

    if (last.getTime() === today.getTime()) {
      // Already counted today,  nothing to do
    } else if (last.getTime() === yesterday.getTime()) {
      // Consecutive day,  extend streak
      this.streakDays  += 1;
      this.streakLastAt = now;
    } else {
      // Gap,  reset streak
      this.streakDays   = 1;
      this.streakLastAt = now;
    }
  }

  return this.save();
};

// Instance method: completeLesson 

CitizenProfileSchema.methods.completeLesson = async function (
  this: ICitizenProfileDocument
): Promise<ICitizenProfileDocument> {
  this.topicsCompletedCount += 1;
  return this.save();
};

// Instance method: issueCertificate 

CitizenProfileSchema.methods.issueCertificate = async function (
  this: ICitizenProfileDocument
): Promise<ICitizenProfileDocument> {
  this.certificatesCount += 1;
  return this.save();
};

// Instance method: addStudyMinutes 

CitizenProfileSchema.methods.addStudyMinutes = async function (
  this: ICitizenProfileDocument,
  minutes: number
): Promise<ICitizenProfileDocument> {
  if (minutes > 0) {
    this.totalStudyMinutes += minutes;
    await this.save();
  }
  return this;
};

// Export 

export const CitizenProfileModel =
  models.CitizenProfile ||
  model<ICitizenProfileDocument>('CitizenProfile', CitizenProfileSchema);