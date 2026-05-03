import { Schema, model, models } from 'mongoose';
import { ICitizenProfile } from './types';

const CitizenProfileSchema = new Schema<ICitizenProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    //  Contact & location 
    phone:     { type: String, trim: true },
    stateCode: { type: String, trim: true }, // e.g. 'lagos', 'abuja'
    bio:       { type: String, maxlength: 500 },

    //  Gamification 
    xpTotal:      { type: Number, default: 0 },
    xpLevel:      { type: Number, default: 1 },
    streakDays:   { type: Number, default: 0 },
    streakLastAt: { type: Date },     // date of last learning activity
    joinedDays:   { type: Number, default: 0 }, // computed or cached days since join

    //  Learning stats 
    topicsCompletedCount: { type: Number, default: 0 },
    certificatesCount:    { type: Number, default: 0 },
    totalStudyMinutes:    { type: Number, default: 0 },

    //  Preferences 
    preferredLanguage:  { type: String, default: 'en' },
    jurisdictionCode:   { type: String, default: 'federal' },  // 'federal' | state code
    legalInterestAreas: [{ type: String }], // ['criminal','tenancy','employment',...]

    //  Privacy / notification toggles 
    showActivityPublic:        { type: Boolean, default: false },
    allowAnonymousAnalytics:   { type: Boolean, default: true  },
    personalizedRecommend:     { type: Boolean, default: true  },
    showProfileInCommunity:    { type: Boolean, default: false },

    // Notification channel flags
    notifEmail:         { type: Boolean, default: true  },
    notifSms:           { type: Boolean, default: false },
    notifPush:          { type: Boolean, default: true  },
    notifInAppBadge:    { type: Boolean, default: true  },

    // Individual notification types
    notifLawyerResponse:  { type: Boolean, default: true  },
    notifConsultReminder: { type: Boolean, default: true  },
    notifMatchAlert:      { type: Boolean, default: true  },
    notifMessages:        { type: Boolean, default: true  },
    notifReviewReminder:  { type: Boolean, default: false },
    notifWeeklyDigest:    { type: Boolean, default: true  },
    notifStreakReminder:  { type: Boolean, default: false },
    notifPlatformUpdates: { type: Boolean, default: true  },
    notifLegalNews:       { type: Boolean, default: false },
    notifPromotional:     { type: Boolean, default: false },

    //  Appearance 
    theme:          { type: String, enum: ['light','dark','system'], default: 'light' },
    fontSize:       { type: String, enum: ['small','medium','large'], default: 'medium' },
    accentColor:    { type: String, default: '#E8317A' },
    reducedMotion:  { type: Boolean, default: false },
    highContrast:   { type: Boolean, default: false },
    dyslexicFont:   { type: Boolean, default: false },

    //  Security 
    twoFaEnabled: { type: Boolean, default: false },

    //  Terms acceptance 
    acceptedTermsAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'citizen_profiles',
  }
);

export const CitizenProfileModel =
  models.CitizenProfile || model<ICitizenProfile>('CitizenProfile', CitizenProfileSchema);
