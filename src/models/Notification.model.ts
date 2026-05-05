import { Schema, model, models } from 'mongoose';
import { ILawyerReview, INotification } from './types';

/**
 * LAWYER REVIEW
 * Post-consultation review left by a citizen for a lawyer.
 * Rating and text are stored here; LawyerProfile.ratingAvg is updated
 * by a background job after each new review.
 *
 * From: dashboard/activities/page.tsx → "Leave a Review" button (status=completed)
 *       marketplace/page.tsx → ProfileModal reviews tab (3 sample reviews)
 *       MarketplaceSection    → rating stars, review count on cards
 */
const LawyerReviewSchema = new Schema<ILawyerReview>(
  {
    lawyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lawyerProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'LawyerProfile',
      required: true,
    },
    citizenId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    consultationId: {
      type: Schema.Types.ObjectId,
      ref: 'Consultation',
      required: true,
      unique: true,   // one review per consultation
    },

    rating:  { type: Number, required: true, min: 1, max: 5 },
    body:    { type: String, maxlength: 1000 },

    // Denorm for fast display (ProfileModal reviews tab)
    citizenInitials: { type: String },
    citizenName:     { type: String },
    citizenColor:    { type: String },

    isVisible: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'lawyer_reviews',
  }
);

LawyerReviewSchema.index({ lawyerProfileId: 1, isVisible: 1, createdAt: -1 });

export const LawyerReviewModel =
  models.LawyerReview || model<ILawyerReview>('LawyerReview', LawyerReviewSchema);

// 

/**
 * NOTIFICATION
 * In-app notifications for citizens and lawyers.
 *
 * From: Header.tsx / dashboard layout → Bell icon + unread badge
 *       dashboard/settings/page.tsx   → notification preferences control what's created
 *
 * Types map to the notif* toggles in CitizenProfile.
 */
const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'lawyer_response',     // lawyer accepted/declined consultation
        'consult_reminder',    // 24hr / 1hr before call
        'match_alert',         // lawyer matched to request
        'new_message',         // message in conversation
        'review_reminder',     // prompt to rate lawyer
        'weekly_digest',       // weekly content email
        'streak_reminder',     // daily learning nudge
        'platform_update',     // new feature / content
        'legal_news',          // legal development alert
        'certificate_issued',  // module completed
      ],
    },

    title:   { type: String, required: true },
    body:    { type: String },

    // Deep link,  where to go when notification is tapped
    linkPath: { type: String },  // "/dashboard/activities", "/dashboard/messages"
    refId:    { type: Schema.Types.ObjectId },  // consultation, module, etc.
    refType:  { type: String },                 // 'consultation', 'module', 'message'

    isRead:  { type: Boolean, default: false, index: true },
    readAt:  { type: Date },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel =
  models.Notification || model<INotification>('Notification', NotificationSchema);
