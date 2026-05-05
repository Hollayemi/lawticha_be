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

// 

/**
 * COMMUNITY POST
 * User-generated text posts (testimonials / wins / tips) in the community feed.
 *
 * From: dashboard/page.tsx  → COMMUNITY_HIGHLIGHTS (quote, name, role, time, likes)
 *       TestimonialsSection  → quote, name, role, topic
 *       OtherSections        → TESTIMONIALS
 */
const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    body:      { type: String, required: true, maxlength: 1000 },
    topicTag:  { type: String },       // "Tenancy Rights", "Police Rights"
    topicId:   { type: Schema.Types.ObjectId, ref: 'LegalTopic' },

    // Moderation
    isApproved:  { type: Boolean, default: false, index: true },
    isFeatured:  { type: Boolean, default: false },

    // Engagement
    likeCount:   { type: Number, default: 0 },
    replyCount:  { type: Number, default: 0 },

    // Denorm for testimonial card
    authorName:  { type: String },
    authorRole:  { type: String },   // "Tenant, Enugu"
    authorInitials: { type: String },
    authorColor:    { type: String },
  },
  {
    timestamps: true,
    collection: 'community_posts',
  }
);

CommunityPostSchema.index({ isApproved: 1, isFeatured: 1, createdAt: -1 });

export const CommunityPostModel =
  models.CommunityPost || model<ICommunityPost>('CommunityPost', CommunityPostSchema);
