"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const types_1 = require("./types");
const UserSchema = new mongoose_1.Schema({
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
        enum: Object.values(types_1.UserRole),
        required: true,
        default: types_1.UserRole.CITIZEN,
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
}, {
    timestamps: true,
    collection: 'users',
});
// Indexes 
UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ role: 1, isActive: 1 });
// Virtual: full name 
UserSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});
// Pre-save: hash password 
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password)
        return next();
    this.fullName = `${this.firstName} ${this.lastName}`;
    const salt = await bcryptjs_1.default.genSalt(12);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
    // Stamp change date so old tokens get invalidated (skip on first creation)
    if (!this.isNew) {
        this.passwordChangedAt = new Date(Date.now() - 1000); // 1 s buffer for JWT timing
    }
    next();
});
// Instance method: match password 
UserSchema.methods.matchPassword = async function (entered) {
    if (!this.password)
        return false;
    return bcryptjs_1.default.compare(entered, this.password);
};
// Instance method: sign access token 
UserSchema.methods.signAccessToken = function () {
    return jsonwebtoken_1.default.sign({ id: this._id.toString(), role: this.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '15m' });
};
// Instance method: sign refresh token 
UserSchema.methods.signRefreshToken = function () {
    const token = jsonwebtoken_1.default.sign({ id: this._id.toString() }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' });
    // Store raw token for rotation / revocation checks
    this.refreshToken = token;
    return token;
};
// Instance method: password reset token 
UserSchema.methods.getPasswordResetToken = function () {
    const raw = crypto_1.default.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto_1.default
        .createHash('sha256')
        .update(raw)
        .digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    return raw;
};
// Instance method: email verification token 
UserSchema.methods.getEmailVerificationToken = function () {
    const raw = crypto_1.default.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto_1.default
        .createHash('sha256')
        .update(raw)
        .digest('hex');
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h
    return raw;
};
// Instance method: changed password after token issued 
UserSchema.methods.changedPasswordAfter = function (jwtIat) {
    if (!this.passwordChangedAt)
        return false;
    return Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtIat;
};
// Instance method: safe object 
UserSchema.methods.toSafeObject = function () {
    const obj = this.toObject({ virtuals: true });
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
UserSchema.methods.awardXP = async function (points) {
    if (this.role !== types_1.UserRole.CITIZEN || points <= 0)
        return null;
    const { CitizenProfileModel } = await Promise.resolve().then(() => __importStar(require('./CitizenProfile.model')));
    const profile = await CitizenProfileModel.findOne({ userId: this._id });
    if (!profile)
        return null;
    await profile.addXP(points);
    return profile;
};
// Static: find by email 
UserSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase().trim() });
};
UserSchema.statics.findByEmailWithPassword = function (email) {
    return this.findOne({ email: email.toLowerCase().trim() }).select('+password +passwordChangedAt');
};
// Export 
exports.UserModel = mongoose_1.models.User ||
    (0, mongoose_1.model)('User', UserSchema);
//# sourceMappingURL=User.model.js.map