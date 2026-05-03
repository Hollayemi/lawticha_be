import { Schema, model, models } from 'mongoose';
import { ILawyer, LawyerStatus, LawyerBadge } from './types/lawticha.types';

const LawyerSchema = new Schema<ILawyer>(
  {
    
    state: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: '#1E3A5F',
    },
    passwordHash: {
      type: String,
      select: false,
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    bio: {
      type: String,
      maxlength: 2000,
    },
    languages: {
      type: [String],
      default: ['English'],
    },
    specialisms: {
      type: [String],
      default: [],
    },
    nbaNumber: {
      type: String,
      required: [true, 'NBA number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    yearsCall: {
      type: Number,
      required: [true, 'Years of call is required'],
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(LawyerStatus),
      default: LawyerStatus.PENDING,
      index: true,
    },
    available: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    consultations: {
      type: Number,
      default: 0,
      min: 0,
    },
    responseTimeMinutes: {
      type: Number,
      default: 60,   // default 1 hr
      min: 0,
    },
    badges: {
      type: [String],
      enum: Object.values(LawyerBadge),
      default: [],
    },
    fee: {
      message: { type: Number, default: 5000, min: 0 },
      call:    { type: Number, default: 12000, min: 0 },
      video:   { type: Number, default: 18000, min: 0 },
    },
    lastActiveAt: {
      type: Date,
    },
    verificationId: {
      type: Schema.Types.ObjectId,
      ref: 'Verification',
    },
    removedAt: {
      type: Date,
      default: null,
      index: true,
    },
    removedBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'lawyers',
  }
);

LawyerSchema.index({ status: 1, removedAt: 1 });
LawyerSchema.index({ name: 'text', nbaNumber: 'text', state: 'text' });
LawyerSchema.index({ rating: -1 });
LawyerSchema.index({ createdAt: -1 });

// Virtual: formatted response time string
LawyerSchema.virtual('responseTime').get(function () {
  const m = this.responseTimeMinutes;
  if (m < 60) return `< ${m} min`;
  const h = Math.ceil(m / 60);
  return `< ${h} hr${h > 1 ? 's' : ''}`;
});

// Virtual: initials
LawyerSchema.virtual('initials').get(function () {
  return this.name
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('');
});

LawyerSchema.set('toObject', { virtuals: true });
LawyerSchema.set('toJSON', { virtuals: true });

export const LawyerModel = models.Lawyer || model<ILawyer>('Lawyer', LawyerSchema);
