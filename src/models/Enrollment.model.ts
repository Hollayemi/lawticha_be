import { Schema, model, models } from 'mongoose';
import { IEnrollment, IUserProgress } from './types';

/**
 * ENROLLMENT
 * Records that a citizen has enrolled in a module.
 * One record per (citizen, module) pair.
 *
 * From: dashboard/learn/page.tsx  → tab: "active", "complete", "saved"
 *       dashboard/page.tsx        → CONTINUE_READING (last section, progress %)
 *       dashboard/layer/page.tsx  → ONGOING table (progress bar, date started)
 */
const EnrollmentSchema = new Schema<IEnrollment>(
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
      index: true,
    },

    status: {
      type: String,
      enum: ['active', 'complete', 'saved', 'dropped'],
      default: 'active',
      index: true,
    },

    progressPercent:    { type: Number, default: 0, min: 0, max: 100 },
    lessonsCompleted:   [{ type: Schema.Types.ObjectId }], // lesson._id list
    currentLessonId:    { type: Schema.Types.ObjectId },   // lesson currently on
    currentLessonTitle: { type: String },                  // denorm for dashboard card

    startedAt:    { type: Date, default: Date.now },
    completedAt:  { type: Date },
    lastActivityAt: { type: Date, default: Date.now },
    lastReadLabel:  { type: String }, // "2 hours ago" — computed client-side, stored for search

    xpEarned:    { type: Number, default: 0 },
    isSaved:     { type: Boolean, default: false },     // bookmarked/saved to list
    ratingGiven: { type: Number, min: 1, max: 5 },
  },
  {
    timestamps: true,
    collection: 'enrollments',
  }
);

EnrollmentSchema.index({ citizenId: 1, moduleId: 1 }, { unique: true });
EnrollmentSchema.index({ citizenId: 1, status: 1 });
EnrollmentSchema.index({ citizenId: 1, lastActivityAt: -1 });

export const EnrollmentModel =
  models.Enrollment || model<IEnrollment>('Enrollment', EnrollmentSchema);

// 

/**
 * USER PROGRESS  (per-lesson granular progress)
 * Tracks individual lesson completion within an enrolled module.
 * Separate from Enrollment so we can granularly track TOPICS list
 * (the checklist in dashboard/learn/[slug]/page.tsx).
 *
 * active = currently watching/reading
 * done   = completed
 * locked = not yet unlocked
 */
const UserProgressSchema = new Schema<IUserProgress>(
  {
    citizenId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    moduleId:     { type: Schema.Types.ObjectId, ref: 'LegalModule', required: true },
    lessonId:     { type: Schema.Types.ObjectId, required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },

    status: {
      type: String,
      enum: ['locked', 'active', 'done'],
      default: 'locked',
    },

    videoPositionSeconds: { type: Number, default: 0 }, // resume position
    completedAt:          { type: Date },
    xpAwarded:            { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'user_progress',
  }
);

UserProgressSchema.index({ citizenId: 1, moduleId: 1 });
UserProgressSchema.index({ citizenId: 1, lessonId: 1 }, { unique: true });

export const UserProgressModel =
  models.UserProgress || model<IUserProgress>('UserProgress', UserProgressSchema);
