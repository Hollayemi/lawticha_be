import { Schema, model, models } from 'mongoose';
import { IConsultation, ILawyerRequest } from './types';

/**
 * CONSULTATION
 * A booked consultation between a citizen and a verified lawyer.
 * Tracks the full lifecycle: pending → accepted → completed/declined/cancelled.
 *
 * From: dashboard/activities/page.tsx → ConsultCard, Timeline, receipt
 *       dashboard/marketplace/page.tsx → ConsultModal (step 1 & 2 creates this)
 *       dashboard/layer/page.tsx → MESSAGES (lawyer replies)
 */

const TimelineEventSchema = new Schema(
  {
    time:  { type: Date, required: true, default: Date.now },
    label: { type: String, required: true },
    note:  { type: String },
  },
  { _id: false }
);

const ConsultationSchema = new Schema<IConsultation>(
  {
    citizenId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
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

    //  Request details 
    mode: {
      type: String,
      enum: ['message', 'call', 'video'],
      required: true,
    },
    topic:  { type: String, required: true, trim: true },
    detail: { type: String },

    //  Status lifecycle 
    status: {
      type: String,
      enum: ['pending', 'accepted', 'completed', 'declined', 'cancelled'],
      default: 'pending',
      index: true,
    },

    //  Scheduling (for call / video) 
    scheduledAt:  { type: Date },
    completedAt:  { type: Date },
    durationMins: { type: Number },   // actual session duration in minutes

    //  Payment 
    feePaid:     { type: Number, required: true },   // NGN amount
    isCharged:   { type: Boolean, default: false },  // false until lawyer accepts
    receiptId:   { type: String },                   // "RCP-2025-04140098"
    paymentRef:  { type: String },                   // Paystack reference

    //  Review 
    citizenRating:  { type: Number, min: 1, max: 5 },
    citizenReview:  { type: String },
    reviewedAt:     { type: Date },

    //  Activity timeline (shown in ConsultCard expanded view) 
    timeline: [TimelineEventSchema],

    //  Decline / cancel 
    declineReason: { type: String },
    cancelledBy:   { type: String, enum: ['citizen', 'lawyer', 'system'] },
  },
  {
    timestamps: true,
    collection: 'consultations',
  }
);

ConsultationSchema.index({ citizenId: 1, status: 1 });
ConsultationSchema.index({ lawyerId: 1, status: 1 });
ConsultationSchema.index({ citizenId: 1, createdAt: -1 });
ConsultationSchema.index({ lawyerId: 1, createdAt: -1 });

export const ConsultationModel =
  models.Consultation || model<IConsultation>('Consultation', ConsultationSchema);

// 

/**
 * LAWYER REQUEST
 * A citizen posts a "find me a lawyer" request (not booking a specific one).
 * The platform matches them to a verified lawyer.
 *
 * From: dashboard/activities/page.tsx → LawyerRequestCard
 *       dashboard/marketplace/page.tsx → RequestLawyerModal
 */
const LawyerRequestSchema = new Schema<ILawyerRequest>(
  {
    citizenId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    //  What the citizen needs 
    specialism:  { type: String, required: true },    // "Employment Law"
    urgency:     { type: String, required: true },    // "Today (urgent)", "This week"
    location:    { type: String },                    // "Lagos"
    budget:      { type: String, required: true },    // "NGN 5,000 - 15,000"
    description: { type: String, required: true },

    //  Status 
    status: {
      type: String,
      enum: ['pending', 'matched', 'accepted', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },

    //  Matched lawyer (filled when status = matched / accepted) 
    matchedLawyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },
    matchedLawyerProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'LawyerProfile',
      sparse: true,
    },
    matchedAt: { type: Date },

    //  After match, may convert to a Consultation 
    consultationId: {
      type: Schema.Types.ObjectId,
      ref: 'Consultation',
      sparse: true,
    },

    //  Activity timeline 
    timeline: [TimelineEventSchema],
  },
  {
    timestamps: true,
    collection: 'lawyer_requests',
  }
);

LawyerRequestSchema.index({ citizenId: 1, status: 1 });
LawyerRequestSchema.index({ status: 1, specialism: 1, location: 1 });

export const LawyerRequestModel =
  models.LawyerRequest || model<ILawyerRequest>('LawyerRequest', LawyerRequestSchema);
