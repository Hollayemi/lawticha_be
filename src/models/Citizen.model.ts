import { Schema, model, models } from 'mongoose';
import { ICitizen, CitizenStatus } from './types/lawticha.types';

const CitizenSchema = new Schema<ICitizen>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
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
      default: '#3B82F6',
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
    status: {
      type: String,
      enum: Object.values(CitizenStatus),
      default: CitizenStatus.ACTIVE,
      index: true,
    },
    topicsRead: {
      type: Number,
      default: 0,
      min: 0,
    },
    consultations: {
      type: Number,
      default: 0,
      min: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    modulesEnrolled: {
      type: [Schema.Types.ObjectId],
      ref: 'Module',
      default: [],
    },
    bookmarkedTopics: {
      type: Number,
      default: 0,
      min: 0,
    },
    communityPosts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActiveAt: {
      type: Date,
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
    collection: 'citizens',
  }
);

// Compound indexes for common admin queries
CitizenSchema.index({ status: 1, removedAt: 1 });
CitizenSchema.index({ name: 'text', email: 'text', state: 'text' });
CitizenSchema.index({ createdAt: -1 });
CitizenSchema.index({ lastActiveAt: -1 });

// Virtual: computed initials
CitizenSchema.virtual('initials').get(function () {
  return this.name
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('');
});

CitizenSchema.set('toObject', { virtuals: true });
CitizenSchema.set('toJSON', { virtuals: true });

export const CitizenModel = models.Citizen || model<ICitizen>('Citizen', CitizenSchema);
