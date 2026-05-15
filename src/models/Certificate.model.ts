import { Schema, model, models } from 'mongoose';
import { ICertificate, IDailyChallenge, ICommunityPost } from './types';

/**
 * CERTIFICATE
 * Issued when a citizen completes all lessons in a module.
 *
 * From: dashboard/page.tsx     → STATS (certificates count)
 *       dashboard/layer/page.tsx → STATS (Certificates: 3)
 *       dashboard/learn/[slug] → "Complete all topics to earn your Certificate"
 *       dashboard/certificates/page.tsx (implied)
 */
const CertificateSchema = new Schema<ICertificate>(
  {
    citizenId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'LegalModule',
      required: true,
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
    },

    certificateNumber: { type: String, unique: true, required: true },
    issuedAt:          { type: Date, default: Date.now },
    pdfUrl:            { type: String }, // generated PDF certificate file

    // Denormalised for fast display
    moduleTitle:   { type: String },
    citizenName:   { type: String },
    instructorName: { type: String },
  },
  {
    timestamps: true,
    collection: 'certificates',
  }
);

CertificateSchema.index({ citizenId: 1, moduleId: 1 }, { unique: true });

export const CertificateModel =
  models.Certificate || model<ICertificate>('Certificate', CertificateSchema);

// 

/**
 * DAILY CHALLENGE
 * One quiz question surfaced each day on the dashboard.
 *
 * From: dashboard/page.tsx → DailyQuiz component
 * A citizen can answer once per day,  their response stored in DailyChallengeAttempt.
 */
const DailyChallengeSchema = new Schema<IDailyChallenge>(
  {
    question:    { type: String, required: true },
    options:     [{ type: String, required: true }],   // array of 4 option strings
    correctIndex: { type: Number, required: true },     // 0-based index of correct option
    explanation:  { type: String },                     // shown after answering
    topicId:      { type: Schema.Types.ObjectId, ref: 'LegalTopic' },
    xpReward:     { type: Number, default: 100 },
    activeDate:   { type: Date, required: true, unique: true, index: true }, // one per day
    isActive:     { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'daily_challenges',
  }
);

export const DailyChallengeModel =
  models.DailyChallenge || model<IDailyChallenge>('DailyChallenge', DailyChallengeSchema);

// 

/**
 * DAILY CHALLENGE ATTEMPT
 * Records a citizen's answer to a DailyChallenge.
 *
 * One attempt per (citizen, challenge) pair.
 */
const DailyChallengeAttemptSchema = new Schema(
  {
    citizenId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    challengeId: { type: Schema.Types.ObjectId, ref: 'DailyChallenge', required: true },
    selectedIndex: { type: Number, required: true },
    isCorrect:     { type: Boolean, required: true },
    xpAwarded:     { type: Number, default: 0 },
    answeredAt:    { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'daily_challenge_attempts',
  }
);

DailyChallengeAttemptSchema.index({ citizenId: 1, challengeId: 1 }, { unique: true });

export const DailyChallengeAttemptModel =
  models.DailyChallengeAttempt ||
  model('DailyChallengeAttempt', DailyChallengeAttemptSchema);
