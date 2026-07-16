import { Schema, model, models } from 'mongoose';
import { ILegalTopic, ILegalModule } from './types';

/**
 * LEGAL TOPIC  (category)
 * Top-level grouping for the learn module.
 *
 * From: TopicsSection, OtherSections, learn/page.tsx
 * Examples: "Police & Law Enforcement", "Landlord & Tenancy", "Employment & Labour"
 *
 * One Topic → many Modules.
 */
const LegalTopicSchema = new Schema<ILegalTopic>(
  {
    slug:       { type: String, required: true, unique: true, trim: true },  // 'police-law-enforcement'
    title:      { type: String, required: true, trim: true },
    icon:       { type: String },   // emoji or icon name
    accentColor: { type: String },  // "#3B82F6"
    bgColor:     { type: String },  // "#EFF6FF"
    gradientFrom: { type: String }, // "#1E3257" (for dark card backgrounds)
    description:  { type: String },
    articleCount: { type: Number, default: 0 },  // denormalised for fast rendering
    subtopics:   [{ type: String }], // ["Rights during arrest", "Unlawful detention"...]
    isActive:    { type: Boolean, default: true },
    sortOrder:   { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'legal_topics',
  }
);

export const LegalTopicModel =
  models.LegalTopic || model<ILegalTopic>('LegalTopic', LegalTopicSchema);

// 

/**
 * LEGAL MODULE  (course)
 * A learnable unit inside a Topic. Each module has many lessons/steps.
 *
 * From: dashboard/learn/page.tsx          → module card list
 *       dashboard/learn/[slug]/page.tsx   → video player, progress tracker, TOPICS list
 *       dashboard/page.tsx (CONTINUE_READING)
 *       FeaturesSection, OtherSections (FEATURED)
 *
 * Instructors are LawyerProfile records (they teach the module).
 */
const ModuleLessonSchema = new Schema(
  {
    title:    { type: String, required: true },
    order:    { type: Number, required: true },
    durationSeconds: { type: Number, default: 0 },
    videoUrl: { type: String },
    content:  { type: String }, // plain text / markdown summary
    isPublished: { type: Boolean, default: true },
  },
  { _id: true }
);

const LegalModuleSchema = new Schema<ILegalModule>(
  {
    slug:    { type: String, required: true, unique: true, trim: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'LegalTopic', required: true, index: true },

    title:       { type: String, required: true },
    description: { type: String },
    tag:         { type: String },       // "Police Rights" (short label for card)
    tagColor:    { type: String },       // "#3B82F6"
    gradient:    { type: String },       // "linear-gradient(135deg, #1E3A5F 0%, ...)"
    thumbnailUrl: { type: String },      // used as card image
    iconEmoji:   { type: String },       // fallback emoji icon

    //  Content 
    lessons: [ModuleLessonSchema],
    lessonCount:     { type: Number, default: 0 },  // denormalised
    totalWeeks:      { type: Number, default: 1 },
    totalDurationLabel: { type: String },  // "30:45" or "2h 30m"

    //  Instructor (populated from LawyerProfile) 
    instructorId: { type: Schema.Types.ObjectId, ref: 'LawyerProfile', index: true },
    // Denormalised instructor fields for fast card render (no populate needed):
    instructorName:    { type: String },
    instructorEmail:   { type: String },
    instructorInitials: { type: String },
    instructorColor:   { type: String },

    //  Access 
    price:       { type: String, default: 'Free' },
    isPremium:   { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true, index: true },

    //  Aggregate stats (recomputed periodically) 
    ratingAvg:     { type: Number, default: 0 },
    ratingCount:   { type: Number, default: 0 },
    enrolledCount: { type: Number, default: 0 },

    //  XP reward for completing this module 
    xpReward: { type: Number, default: 100 },
  },
  {
    timestamps: true,
    collection: 'legal_modules',
  }
);

LegalModuleSchema.index({ topicId: 1, isPublished: 1 });
LegalModuleSchema.index({ instructorId: 1 });

export const LegalModuleModel =
  models.LegalModule || model<ILegalModule>('LegalModule', LegalModuleSchema);
