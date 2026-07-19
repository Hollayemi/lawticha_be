import { Schema, model, models } from 'mongoose';
import { IVerification, VerificationStatus } from './types/lawticha.types';

const DocumentSchema = new Schema(
  {
    label:      { type: String, required: true },
    filename:   { type: String, required: true },
    fileUrl:    { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    sizeBytes:  { type: Number, required: true },
    verified:   { type: Boolean, default: null },
  },
  { _id: true }
);

const VerificationSchema = new Schema<IVerification>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: '#1E3A5F',
    },
    nbaNumber: {
      type: String,
      required: [true, 'SCN number is required'],
      trim: true,
      index: true,
    },
    yearsCall: {
      type: Number,
      required: true,
      min: 0,
    },
    calledAt: {
      type: String,  // year as string, e.g. "2019"
      required: true,
    },
    specialisms: {
      type: [String],
      default: [],
      ref: 'Specialism',
    },
    status: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
      index: true,
    },
    adminNote: {
      type: String,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    documents: {
      type: [DocumentSchema],
      default: [],
    },
    lawyerId: {
      type: Schema.Types.ObjectId,
      ref: 'Lawyer',
      default: null,
    },
    removedAt: {
      type: Date,
      default: null,
    },
    removedBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'verifications',
  }
);

VerificationSchema.index({ status: 1, removedAt: 1 });
VerificationSchema.index({ name: 'text', nbaNumber: 'text', email: 'text' });
VerificationSchema.index({ createdAt: -1 });

VerificationSchema.virtual('initials').get(function () {
  return this.name
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('');
});

VerificationSchema.set('toObject', { virtuals: true });
VerificationSchema.set('toJSON', { virtuals: true });

export const VerificationModel =
  models.Verification || model<IVerification>('Verification', VerificationSchema);
