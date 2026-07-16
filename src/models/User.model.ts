import { Schema, model, models, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IUser, UserRole } from './types';



export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  _id: Types.ObjectId;
  password?: string;
  refreshToken?: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;

  // Virtuals
  fullName: string;

  // Instance methods 
  matchPassword(entered: string): Promise<boolean>;
  signAccessToken(): string;
  signRefreshToken(): string;
  getPasswordResetToken(): string;
  getEmailVerificationToken(): string;
  changedPasswordAfter(jwtIat: number): boolean;
  toSafeObject(): Record<string, unknown>;
  awardXP(points: number): Promise<import('./CitizenProfile.model').ICitizenProfileDocument | null>;
}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  findByEmailWithPassword(email: string): Promise<IUserDocument | null>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },

    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.CITIZEN,
      index: true,
    },
    authProvider: {
      type: String,
      enum: ['email', 'google', 'phone'],
      default: 'email',
    },
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String },

    // Credentials (select: false,  never leaked in queries) 
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    refreshToken: { type: String, select: false },
    passwordChangedAt: { type: Date, select: false },

    // Password reset 
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // Email verification 
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    // Status flags 
    status: { type: String, enum: ["active", "inactive", "pending", "approved", "rejected", "warning"], default: "active", index: true },
    isActive: { type: Boolean, default: true, index: true },
    isVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },




    // Preferences 
    preferredLanguage: { type: String, default: 'en' },
    jurisdictionCode: { type: String, default: 'federal' },
    legalInterestAreas: [{ type: String }],

    // Privacy toggles 
    showActivityPublic: { type: Boolean, default: false },
    allowAnonymousAnalytics: { type: Boolean, default: true },
    personalizedRecommend: { type: Boolean, default: true },
    showProfileInCommunity: { type: Boolean, default: false },

    // Notification channels 
    notifEmail: { type: Boolean, default: true },
    notifSms: { type: Boolean, default: false },
    notifPush: { type: Boolean, default: true },
    notifInAppBadge: { type: Boolean, default: true },

    // Notification types 
    notifLawyerResponse: { type: Boolean, default: true },
    notifConsultReminder: { type: Boolean, default: true },
    notifMatchAlert: { type: Boolean, default: true },
    notifMessages: { type: Boolean, default: true },
    notifReviewReminder: { type: Boolean, default: false },
    notifWeeklyDigest: { type: Boolean, default: true },
    notifStreakReminder: { type: Boolean, default: false },
    notifPlatformUpdates: { type: Boolean, default: true },
    notifLegalNews: { type: Boolean, default: false },
    notifPromotional: { type: Boolean, default: false },

    // Appearance 
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    accentColor: { type: String, default: '#E8317A' },
    reducedMotion: { type: Boolean, default: false },
    highContrast: { type: Boolean, default: false },
    dyslexicFont: { type: Boolean, default: false },

    // Security 
    twoFaEnabled: { type: Boolean, default: false },
    acceptedTermsAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Indexes 

UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ role: 1, isActive: 1 });

// Virtual: full name 

UserSchema.virtual('fullName').get(function (this: IUserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save: hash password 

UserSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  this.fullName = `${this.firstName} ${this.lastName}`

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  // Stamp change date so old tokens get invalidated (skip on first creation)
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000); // 1 s buffer for JWT timing
  }

  next();
});

// Instance method: match password 

UserSchema.methods.matchPassword = async function (
  this: IUserDocument,
  entered: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(entered, this.password);
};

// Instance method: sign access token 

UserSchema.methods.signAccessToken = function (this: IUserDocument): string {
  return jwt.sign(
    { id: this._id.toString(), role: this.role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRE || '15m' } as jwt.SignOptions
  );
};

// Instance method: sign refresh token 

UserSchema.methods.signRefreshToken = function (this: IUserDocument): string {
  const token = jwt.sign(
    { id: this._id.toString() },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' } as jwt.SignOptions
  );
  // Store raw token for rotation / revocation checks
  this.refreshToken = token;
  return token;
};

// Instance method: password reset token 

UserSchema.methods.getPasswordResetToken = function (this: IUserDocument): string {
  const raw = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(raw)
    .digest('hex');

  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  return raw;
};

// Instance method: email verification token 

UserSchema.methods.getEmailVerificationToken = function (this: IUserDocument): string {
  const raw = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(raw)
    .digest('hex');

  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

  return raw;
};

// Instance method: changed password after token issued 

UserSchema.methods.changedPasswordAfter = function (
  this: IUserDocument,
  jwtIat: number
): boolean {
  if (!this.passwordChangedAt) return false;
  return Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtIat;
};

// Instance method: safe object 

UserSchema.methods.toSafeObject = function (
  this: IUserDocument
): Record<string, unknown> {
  const obj = this.toObject({ virtuals: true }) as Record<string, unknown>;

  const STRIP = [
    'password', 'refreshToken', 'passwordChangedAt',
    'passwordResetToken', 'passwordResetExpires',
    'emailVerificationToken', 'emailVerificationExpires',
    '__v',
  ];
  STRIP.forEach((k) => delete obj[k]);

  return obj;
};

// Instance method: award XP 
// Convenience method,  loads CitizenProfile lazily and applies XP + level-up.

UserSchema.methods.awardXP = async function (
  this: IUserDocument,
  points: number
): Promise<import('./CitizenProfile.model').ICitizenProfileDocument | null> {
  if (this.role !== UserRole.CITIZEN || points <= 0) return null;

  const { CitizenProfileModel } = await import('./CitizenProfile.model');
  const profile = await CitizenProfileModel.findOne({ userId: this._id });
  if (!profile) return null;

  await profile.addXP(points);
  return profile;
};

// Static: find by email 

UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

UserSchema.statics.findByEmailWithPassword = function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() }).select(
    '+password +passwordChangedAt'
  );
};

// Export 

export const UserModel: IUserModel =
  (models.User as unknown as IUserModel) ||
  model<IUserDocument, IUserModel>('User', UserSchema);