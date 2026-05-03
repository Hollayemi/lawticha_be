import { Schema, model, models } from 'mongoose';
import { ILawyerProfile, ConsultMode } from './types';

/**
 * LAWYER PROFILE
 * Verified Nigerian lawyer record, linked 1-to-1 with User (role: lawyer).
 *
 * From marketplace/page.tsx → all lawyer card fields, fees, badges,
 *                             specialisms, location, availability
 * From MarketplaceSection   → name, role, location, rating, badges
 * From settings → NBA number, fees, response time
 *
 * Verification is a multi-step process tracked by verificationStatus.
 * Badges are computed/assigned by admin after assessment.
 */

const FeeScheduleSchema = new Schema(
  {
    message: { type: Number, required: true, min: 0 },
    call:    { type: Number, required: true, min: 0 },
    video:   { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const LawyerProfileSchema = new Schema<ILawyerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    //  NBA & identity 
    nbaNumber:   { type: String, required: true, unique: true, trim: true },
    yearOfCall:  { type: Number, required: true },
    title:       { type: String, trim: true }, // "Employment & Labour Lawyer"
    bio:         { type: String, maxlength: 1000 },
    initials:    { type: String, maxlength: 4 },  // "AO" for display avatar

    //  Practice areas (slugs map to SPECIALISMS list) 
    specialisms: [{ type: String, index: true }],
    // e.g. ['criminal', 'employment', 'property', 'family', 'business', 'consumer', 'road']

    //  Location 
    location:  { type: String, trim: true },  // "Victoria Island"
    state:     { type: String, trim: true },  // "Lagos"
    stateCode: { type: String, trim: true },  // "lagos"

    //  Languages 
    languages: [{ type: String }], // ['English', 'Igbo', 'Yoruba']

    //  Verification workflow 
    verificationStatus: {
      type: String,
      enum: ['pending', 'credential_check', 'training', 'assessment', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    verificationRejectedReason: { type: String },
    verifiedAt: { type: Date },

    //  Badges (assigned by admin / auto-computed) 
    badges: [{
      type: String,
      enum: ['Verified Lawyer', 'Top Rated', 'Responsive'],
    }],

    //  Availability 
    isAvailable:  { type: Boolean, default: false, index: true },

    //  Fees 
    fees: { type: FeeScheduleSchema, required: true },

    //  Performance metrics (denormalised for fast card rendering) 
    ratingAvg:         { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:       { type: Number, default: 0 },
    consultationCount: { type: Number, default: 0 },
    responseTimeLabel: { type: String, default: 'Under 24 hours' }, // "Under 1 hour"

    //  Subscription / platform tier 
    subscriptionTier: {
      type: String,
      enum: ['basic', 'pro'],
      default: 'basic',
    },

    //  Color for UI avatar (hex pair stored for consistent card rendering) 
    colorA: { type: String, default: '#1E3A5F' },
    colorB: { type: String, default: '#2D5A8E' },
  },
  {
    timestamps: true,
    collection: 'lawyer_profiles',
  }
);

LawyerProfileSchema.index({ specialisms: 1, state: 1 });
LawyerProfileSchema.index({ verificationStatus: 1, isAvailable: 1 });
LawyerProfileSchema.index({ ratingAvg: -1 });

export const LawyerProfileModel =
  models.LawyerProfile || model<ILawyerProfile>('LawyerProfile', LawyerProfileSchema);
