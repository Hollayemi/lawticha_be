import { Schema, model, models, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IUser, UserRole } from './types';

//  Extended interface: document instance methods 

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  password?: string;
  refreshToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordChangedAt?: Date;

  //  Methods 
  getSignedJwtToken(): string;
  getRefreshToken(): string;
  matchPassword(enteredPassword: string): Promise<boolean>;
  getPasswordResetToken(): string;
  getEmailVerificationToken(): string;
  changedPasswordAfter(jwtIat: number): boolean;
  toSafeObject(): Partial<IUserDocument>;
}

//  Static methods interface 

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  findByEmailWithPassword(email: string): Promise<IUserDocument | null>;
}

// 

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
    lastName:  { type: String, required: [true, 'Last name is required'],  trim: true },

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
    googleId:  { type: String, unique: true, sparse: true },
    avatarUrl: { type: String },

    //  Credentials 
    // select: false — never returned in queries unless explicitly requested
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    refreshToken:       { type: String, select: false },
    passwordChangedAt:  { type: Date,   select: false },

    //  Password reset 
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },

    //  Email verification 
    emailVerificationToken:   { type: String, select: false },
    emailVerificationExpires: { type: Date,   select: false },

    //  Status 
    isActive:    { type: Boolean, default: true,  index: true },
    isVerified:  { type: Boolean, default: false },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

//  Indexes 

UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ role: 1, isActive: 1 });

//  Virtual: full name 

UserSchema.virtual('fullName').get(function (this: IUserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

//  Pre-save: hash password 

UserSchema.pre<IUserDocument>('save', async function (next) {
  // Only hash if password was actually modified (new account or password change)
  if (!this.isModified('password') || !this.password) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  // If this is a password change (not a new account), stamp the change date.
  // Used by changedPasswordAfter() to invalidate old tokens.
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000); // 1s buffer for JWT timing
  }

  next();
});

//  Instance method: sign access JWT 
// Short-lived (15 min). Sent in response body.

UserSchema.methods.getSignedJwtToken = function (this: IUserDocument): string {
  return jwt.sign(
    { id: this._id!.toString(), role: this.role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRE || '15m' } as jwt.SignOptions
  );
};

//  Instance method: sign refresh JWT 
// Long-lived (30 days). Stored in httpOnly cookie.
// Raw token is also stored (hashed) on the document for rotation / revocation.

UserSchema.methods.getRefreshToken = function (this: IUserDocument): string {
  const refreshToken = jwt.sign(
    { id: this._id!.toString() },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' } as jwt.SignOptions
  );

  // Store the raw token so we can rotate it on next use
  // (in production you may want to hash it: crypto.createHash('sha256').update(refreshToken).digest('hex'))
  this.refreshToken = refreshToken;
  return refreshToken;
};

//  Instance method: compare password 
// bcryptjs compare — safe against timing attacks.

UserSchema.methods.matchPassword = async function (
  this: IUserDocument,
  enteredPassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

//  Instance method: generate password reset token 
// Returns the raw token (sent to user via email).
// Stores the HASHED token on the document (never store raw reset tokens in DB).

UserSchema.methods.getPasswordResetToken = function (this: IUserDocument): string {
  // 1. Generate random raw token
  const rawToken = crypto.randomBytes(32).toString('hex');

  // 2. Hash it — only the hash is stored
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // 3. Expires in 10 minutes
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  return rawToken; // send this in the email link
};

//  Instance method: generate email verification token 

UserSchema.methods.getEmailVerificationToken = function (this: IUserDocument): string {
  const rawToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hrs

  return rawToken;
};

//  Instance method: check if password was changed after JWT was issued 
// Used in protect middleware to catch: "user changed password → invalidate old tokens"

UserSchema.methods.changedPasswordAfter = function (
  this: IUserDocument,
  jwtIat: number // JWT "issued at" timestamp (seconds)
): boolean {
  if (!this.passwordChangedAt) return false;
  const changedAtSeconds = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return changedAtSeconds > jwtIat;
};

//  Instance method: safe object (strip sensitive fields) 
// Use this when returning user data in API responses.

UserSchema.methods.toSafeObject = function (this: IUserDocument): Partial<IUserDocument> {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.refreshToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.passwordChangedAt;
  delete obj.__v;
  return obj;
};

//  Static method: find by email (safe — no password) 

UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

//  Static method: find by email WITH password (for login) 

UserSchema.statics.findByEmailWithPassword = function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() }).select(
    '+password +passwordChangedAt'
  );
};

// 

export const UserModel: IUserModel = (models.User as unknown as IUserModel) || model<IUserDocument, IUserModel>('User', UserSchema);