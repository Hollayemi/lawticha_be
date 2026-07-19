import { Schema, model, models } from 'mongoose';
import { ConsultStatus, IConsultation, ILawyerRequest } from './types';

const TimelineEventSchema = new Schema(
  {
    time: { type: Date, required: true, default: Date.now },
    label: { type: String, required: true },
    note: { type: String },
  },
  { _id: false }
);

const ConsultationDocumentSchema = new Schema(
  {
    name: { type: String, required: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String },
    sizeBytes: { type: Number, default: 0 },
    label: { type: String },
    source: { type: String, enum: ['citizen', 'firm'], required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ScheduledCallSchema = new Schema(
  {
    dateTime: { type: Date, required: true },
    link: { type: String },
    note: { type: String },
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
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatConversation',
    },

    //  Request details 
    mode: {
      type: String,
      enum: ['message', 'call', 'video'],
      required: true,
    },
    topic: { type: String, required: true, trim: true },
    detail: { type: String },

    //  Status lifecycle 
    status: {
      type: String,
      enum: ['pending', 'paid', 'awaiting_lawyer', 'active', 'accepted', 'completed', 'disputed', 'declined', 'cancelled'],
      default: 'pending',
      index: true,
    },

    //  Scheduling (for call / video) 
    scheduledAt: { type: Date },
    completedAt: { type: Date },
    durationMins: { type: Number },   // actual session duration in minutes

    //  Payment 
    feePaid: { type: Number, required: true },   // NGN amount
    isCharged: { type: Boolean, default: false },  // false until lawyer accepts
    receiptId: { type: String },                   // "RCP-2025-04140098"
    paymentRef: { type: String },                   // Paystack reference

    // disput
    disputed: { type: Boolean, default: false },
    disputeReason: { type: String },
    disputeRaisedAt: { type: Date },

    //  Review 
    citizenRating: { type: Number, min: 1, max: 5 },
    citizenReview: { type: String },
    reviewedAt: { type: Date },

    //  Activity timeline (shown in ConsultCard expanded view) 
    timeline: [TimelineEventSchema],

    //  Decline / cancel 
    declineReason: { type: String },
    cancelledBy: { type: String, enum: ['citizen', 'lawyer', 'system'] },
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

// Methods
ConsultationSchema.methods.updateStatus = async function (
  status: ConsultStatus,
  details?: string,
  trackingNumber?: string
): Promise<void> {
  this.status = status;
  if (trackingNumber) {
    this.trackingNumber = trackingNumber;
  }

  this.timeline.push({
    label: `Status changed to ${status}`,
    time: new Date(),
    details: details || `Status updated to ${status}${trackingNumber ? ` with tracking number ${trackingNumber}` : ''}`,
  });
  await this.save();
};


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
    specialism: { type: String, required: true, ref: "Specialism" },
    urgency: { type: String, required: true },
    location: { type: String },
    waiver: { type: Boolean, required: false },
    waiverReason: { type: String, required: false },
    whenHappened: { type: Date, required: false },
    description: { type: String, required: true },
    topic: { type: String, required: true },
    mode: { type: String, enum: ['message', 'call', 'video'], required: true },
    notes: { type: String },

    //  Status 
    status: {
      type: String,
      enum: ['pending', 'unassigned', 'in_review', 'ready_for_call', 'matching', 'recommended', 'matched', 'accepted', 'completed', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },

    //  Documents 
    documents: { type: [ConsultationDocumentSchema], default: [] },
    caseBrief: { type: ConsultationDocumentSchema },

    //  Admin handling 
    handledByAdminId: { type: Schema.Types.ObjectId, ref: 'Admin' },
    handledByAdminName: { type: String },
    adminMessage: { type: String },
    adminMessageAt: { type: Date },
    scheduledCall: { type: ScheduledCallSchema },

    //  Recommendation & final match 
    recommendedLawyers: { type: [String], default: [] },

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
    matchedLawyerName: { type: String },
    matchedAt: { type: Date },

    //  After match, may convert to a Consultation 
    consultationId: {
      type: Schema.Types.ObjectId,
      ref: 'Consultation',
      sparse: true,
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
LawyerRequestSchema.index({ 'recommendedLawyers.lawyerId': 1, status: 1 });

export const LawyerRequestModel =
  models.LawyerRequest || model<ILawyerRequest>('LawyerRequest', LawyerRequestSchema);
