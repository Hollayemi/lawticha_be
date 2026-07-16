import { Schema, model, models, Document, Types } from 'mongoose';
import { ILawyerProfile, VerificationStatus, LawyerBadge, IVerificationDocument } from './types';

// Document interface 

export interface ILawyerProfileDocument extends Omit<ILawyerProfile, '_id'>, Document {
  _id: Types.ObjectId;

  /**
   * Submit the lawyer's verification application.
   * Sets status → 'pending' and stamps the documents.
   */
  submitVerification(
    data: {
      nbaNumber: string;
      yearOfCall: number;
      calledAt: string;
      specialisms?: string[];
      documents?: IVerificationDocument[];
    }
  ): Promise<ILawyerProfileDocument>;

  /**
   * Advance the verification to the next stage in the workflow:
   * pending → credential_check → training → assessment → verified
   * Throws if already verified or rejected.
   */
  advanceVerification(
    adminId: Types.ObjectId,
    note?: string
  ): Promise<ILawyerProfileDocument>;

  /**
   * Reject the verification with a reason.
   * Sets status → 'rejected'.
   */
  rejectVerification(
    adminId: Types.ObjectId,
    reason: string
  ): Promise<ILawyerProfileDocument>;

  infoNeededVerification(
    adminId: Types.ObjectId,
    reason: string
  ): Promise<ILawyerProfileDocument>;

  /**
   * Mark a specific document as verified (true) or failed (false).
   */
  verifyDocument(
    documentId: Types.ObjectId,
    verified: boolean
  ): Promise<ILawyerProfileDocument>;

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

// Verification workflow order 

const VERIFICATION_STAGES: VerificationStatus[] = [
  VerificationStatus.PENDING,
  VerificationStatus.CREDENTIAL_CHECK,
  VerificationStatus.TRAINING,
  VerificationStatus.ASSESSMENT,
  VerificationStatus.VERIFIED,
];

// Sub-schemas 

const FeeScheduleSchema = new Schema(
  {
    message: { type: Number, required: true, min: 0, default: 5000  },
    call:    { type: Number, required: true, min: 0, default: 12000 },
    video:   { type: Number, required: true, min: 0, default: 18000 },
  },
  { _id: false }
);

const VerificationDocumentSchema = new Schema(
  {
    label:      { type: String, required: true },
    filename:   { type: String, required: true },
    fileUrl:    { type: String, required: true },
    uploadedAt: { type: Date,   default: Date.now },
    sizeBytes:  { type: Number, required: true },
    verified:   { type: Boolean, default: null }, // null = pending review
  },
  { _id: true }
);

// Schema 

const LawyerProfileSchema = new Schema<ILawyerProfileDocument>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
      index:    true,
    },

    // Professional identity 
    nbaNumber:  { type: String, sparse: true, trim: true },
    yearOfCall: { type: Number, min: 0 },
    calledAt:   { type: String },           // "2019"
    title:      { type: String, trim: true },
    bio:        { type: String, maxlength: 1000 },
    specialisms: [{ type: String, index: true, ref: 'Specialism' }],  // ["Family Law", "Employment Law"]
    languages:   { type: [String], default: ['English'] },

    // Location 
    location:  { type: String, trim: true },
    state:     { type: String, trim: true },
    stateCode: { type: String, trim: true },

    // Verification (embedded) 
    verificationStatus: {
      type:    String,
      enum:    Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
      index:   true,
    },
    verificationRejectedReason: { type: String },
    verifiedAt:                 { type: Date },
    verificationDocuments:      { type: [VerificationDocumentSchema], default: [] },
    verificationAdminNote:      { type: String },
    verificationReviewedBy: {
      type: Schema.Types.ObjectId,
      ref:  'AdminUser',
    },
    verificationReviewedAt: { type: Date },

    // Badges 
    badges: {
      type: [String],
      enum: Object.values(LawyerBadge),
      default: [],
    },

    // Availability & fees 
    isAvailable: { type: Boolean, default: true, index: true },
    fees: {
      type:     FeeScheduleSchema,
      required: true,
      default:  () => ({ message: 5000, call: 12000, video: 18000 }),
    },

    // Performance metrics (denormalised) 
    ratingAvg:         { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:       { type: Number, default: 0, min: 0 },
    consultationCount: { type: Number, default: 0, min: 0 },
    responseTimeLabel: { type: String, default: 'Under 24 hours' },

    // Platform 
    subscriptionTier: {
      type:    String,
      enum:    ['basic', 'pro'],
      default: 'basic',
    },

    // UI avatar colours 
    colorA: { type: String, default: '#1E3A5F' },
    colorB: { type: String, default: '#2D5A8E' },
  },
  {
    timestamps: true,
    collection: 'lawyer_profiles',
  }
);

// Indexes 

LawyerProfileSchema.index({ specialisms: 1, state: 1 });
LawyerProfileSchema.index({ verificationStatus: 1, isAvailable: 1 });
LawyerProfileSchema.index({ ratingAvg: -1 });

// Virtual: isVerified 

LawyerProfileSchema.virtual('isVerified').get(function (
  this: ILawyerProfileDocument
): boolean {
  return this.verificationStatus === VerificationStatus.VERIFIED;
});

// Instance method: submitVerification 

LawyerProfileSchema.methods.submitVerification = async function (
  this: ILawyerProfileDocument,
  data: {
    nbaNumber: string;
    yearOfCall: number;
    calledAt: string;
    specialisms?: string[];
    documents?: IVerificationDocument[];
  }
): Promise<ILawyerProfileDocument> {
  this.nbaNumber   = data.nbaNumber;
  this.yearOfCall  = data.yearOfCall;
  this.calledAt    = data.calledAt;
  if (data.specialisms) this.specialisms = data.specialisms;
  if (data.documents)   this.verificationDocuments = data.documents as any;

  this.verificationStatus             = VerificationStatus.PENDING;
  this.verificationRejectedReason     = undefined;
  this.verifiedAt                     = undefined;
  this.verificationReviewedBy         = undefined;
  this.verificationReviewedAt         = undefined;

  return this.save();
};

// Instance method: advanceVerification 

LawyerProfileSchema.methods.advanceVerification = async function (
  this: ILawyerProfileDocument,
  adminId: Types.ObjectId,
  note?: string
): Promise<ILawyerProfileDocument> {
  const currentIdx = VERIFICATION_STAGES.indexOf(this.verificationStatus);

  if (currentIdx === -1 || this.verificationStatus === VerificationStatus.REJECTED) {
    throw new Error('Cannot advance a rejected verification');
  }
  if (this.verificationStatus === VerificationStatus.VERIFIED) {
    throw new Error('Lawyer is already verified');
  }

  const next = VERIFICATION_STAGES[currentIdx + 1];
  this.verificationStatus       = VerificationStatus.VERIFIED;
  this.verificationReviewedBy   = adminId;
  this.verificationReviewedAt   = new Date();
  if (note) this.verificationAdminNote = note;

  if (next === VerificationStatus.VERIFIED) {
    this.verifiedAt = new Date();
    if (!this.badges.includes(LawyerBadge.VERIFIED)) {
      this.badges.push(LawyerBadge.VERIFIED);
    }
  }

  return this.save();
};

// Instance method: rejectVerification 

LawyerProfileSchema.methods.rejectVerification = async function (
  this: ILawyerProfileDocument,
  adminId: Types.ObjectId,
  reason: string
): Promise<ILawyerProfileDocument> {
  this.verificationStatus           = VerificationStatus.REJECTED;
  this.verificationRejectedReason   = reason;
  this.verificationReviewedBy       = adminId;
  this.verificationReviewedAt       = new Date();
  this.isAvailable                  = false;
  return this.save();
};
LawyerProfileSchema.methods.infoNeededVerification = async function (
  this: ILawyerProfileDocument,
  adminId: Types.ObjectId,
  reason: string
): Promise<ILawyerProfileDocument> {
  this.verificationStatus           = VerificationStatus.INFO_NEEDED;
  this.verificationRejectedReason   = reason;
  this.verificationReviewedBy       = adminId;
  this.verificationReviewedAt       = new Date();
  this.isAvailable                  = false;
  return this.save();
};

// Instance method: verifyDocument 

LawyerProfileSchema.methods.verifyDocument = async function (
  this: ILawyerProfileDocument,
  documentId: Types.ObjectId,
  verified: boolean
): Promise<ILawyerProfileDocument> {
  const doc = (this.verificationDocuments as any).id(documentId);
  if (!doc) throw new Error('Document not found on this profile');

  doc.verified = verified;
  return this.save();
};

// Instance method: updateMetrics 

LawyerProfileSchema.methods.updateMetrics = async function (
  this: ILawyerProfileDocument,
  data: {
    ratingAvg?: number;
    reviewCount?: number;
    consultationCount?: number;
    responseTimeLabel?: string;
  }
): Promise<ILawyerProfileDocument> {
  if (data.ratingAvg         !== undefined) this.ratingAvg         = data.ratingAvg;
  if (data.reviewCount       !== undefined) this.reviewCount       = data.reviewCount;
  if (data.consultationCount !== undefined) this.consultationCount = data.consultationCount;
  if (data.responseTimeLabel !== undefined) this.responseTimeLabel = data.responseTimeLabel;
  return this.save();
};

// Instance method: setAvailability 

LawyerProfileSchema.methods.setAvailability = async function (
  this: ILawyerProfileDocument,
  available: boolean
): Promise<ILawyerProfileDocument> {
  // Can only go available if verified
  if (available && this.verificationStatus !== VerificationStatus.VERIFIED) {
    throw new Error('Only verified lawyers can set themselves as available');
  }
  this.isAvailable = available;
  return this.save();
};

// Export 

export const LawyerProfileModel =
  models.LawyerProfile ||
  model<ILawyerProfileDocument>('LawyerProfile', LawyerProfileSchema);