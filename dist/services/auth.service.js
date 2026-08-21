"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTokenResponse = sendTokenResponse;
exports.clearAuthCookies = clearAuthCookies;
exports.hashToken = hashToken;
exports.findActiveUser = findActiveUser;
exports.createProfileAfterRegister = createProfileAfterRegister;
exports.loadUserProfile = loadUserProfile;
const crypto_1 = __importDefault(require("crypto"));
const User_model_1 = require("../models/User.model");
const CitizenProfile_model_1 = require("../models/CitizenProfile.model");
const LawyerProfile_model_1 = require("../models/LawyerProfile.model");
const error_1 = require("../middleware/error");
const types_1 = require("../models/types");
const notification_1 = __importDefault(require("../controllers/others/notification"));
//  Cookie config 
const BASE_COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
};
const REFRESH_TTL_MS = Number(process.env.JWT_REFRESH_COOKIE_DAYS ?? 30) * 24 * 60 * 60 * 1000;
//  sendTokenResponse 
/**
 * Signs both tokens, sets the httpOnly refresh cookie, and returns the
 * standardised JSON response. Used by: register, signIn, refreshToken,
 * resetPassword, updatePassword.
 */
function sendTokenResponse(res, user, statusCode = 200, message = 'Success') {
    const accessToken = user.signAccessToken();
    const refreshToken = user.signRefreshToken(); // also mutates user.refreshToken
    // Persist the stored refresh token (fire-and-forget,  don't block response)
    user.save({ validateBeforeSave: false }).catch(console.error);
    res.cookie('refreshToken', refreshToken, {
        ...BASE_COOKIE_OPTS,
        expires: new Date(Date.now() + REFRESH_TTL_MS),
    });
    console.log(user.toSafeObject());
    return res.status(statusCode).json({
        success: true,
        message,
        data: {
            accessToken,
            user: user.toSafeObject(),
        },
    });
}
//  clearAuthCookies 
function clearAuthCookies(res) {
    res.cookie('refreshToken', '', {
        ...BASE_COOKIE_OPTS,
        expires: new Date(0),
    });
}
//  hashToken 
/** Hash a raw token before comparing against the stored hash in DB */
function hashToken(raw) {
    return crypto_1.default.createHash('sha256').update(raw).digest('hex');
}
//  findActiveUser 
async function findActiveUser(id) {
    const user = await User_model_1.UserModel.findById(id);
    if (!user)
        throw new error_1.AppError('User not found.', 404, 'NOT_FOUND');
    if (!user.isActive)
        throw new error_1.AppError('Your account has been deactivated.', 403, 'FORBIDDEN');
    return user;
}
//  createProfileAfterRegister 
/**
 * After a new User is created, spin up their role-specific profile record.
 *
 * Citizen → CitizenProfile (XP, gamification, preferences)
 * Lawyer  → LawyerProfile skeleton (verification status: pending)
 *           The lawyer still needs to complete onboarding (SCN number, docs, etc.)
 */
async function createProfileAfterRegister(user) {
    if (user.role === types_1.UserRole.CITIZEN) {
        await CitizenProfile_model_1.CitizenProfileModel.create({ userId: user._id });
        await notification_1.default.saveAndSendNotification({
            userId: user._id.toString(),
            title: 'Welcome to LawTicha! 🎉',
            body: `Welcome ${user.firstName}! Start exploring legal resources, consultations, and learning modules.`,
            type: 'welcome',
            clickUrl: '/dashboard',
            priority: 'high'
        }, 'user', { push_notification: true, email_notification: true });
    }
    if (user.role === types_1.UserRole.LAWYER) {
        await LawyerProfile_model_1.LawyerProfileModel.create({
            userId: user._id,
            fees: { message: 0, call: 0, video: 0 },
        });
        await notification_1.default.saveAndSendNotification({
            userId: user._id.toString(),
            title: 'Welcome to LawTicha Legal Network! ⚖️',
            body: `Welcome ${user.firstName}! Complete your verification to start accepting consultations.`,
            type: 'welcome',
            clickUrl: '/lawyer/verification',
            priority: 'high'
        }, 'user', { push_notification: true, email_notification: true });
    }
}
//  loadUserProfile 
/**
 * Load the role-specific profile for a user.
 * Returns null when no profile is found (shouldn't happen post-registration).
 */
async function loadUserProfile(user) {
    if (user.role === types_1.UserRole.CITIZEN) {
        return CitizenProfile_model_1.CitizenProfileModel.findOne({ userId: user._id });
    }
    if (user.role === types_1.UserRole.LAWYER) {
        return LawyerProfile_model_1.LawyerProfileModel.findOne({ userId: user._id });
    }
    return null;
}
//# sourceMappingURL=auth.service.js.map