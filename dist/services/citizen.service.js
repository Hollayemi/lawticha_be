"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCitizenProfile = getCitizenProfile;
exports.updateCitizenProfile = updateCitizenProfile;
exports.awardXP = awardXP;
exports.listCitizens = listCitizens;
exports.getCitizenById = getCitizenById;
exports.updateCitizenStatus = updateCitizenStatus;
exports.emailCitizen = emailCitizen;
exports.getCitizenStats = getCitizenStats;
const CitizenProfile_model_1 = require("../models/CitizenProfile.model");
const User_model_1 = require("../models/User.model");
const Admin_model_1 = require("../models/Admin.model");
const types_1 = require("../models/types");
const error_1 = require("../middleware/error");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const notification_1 = __importDefault(require("../controllers/others/notification"));
//  Get citizen profile 
async function getCitizenProfile(userId) {
    const [user, profile] = await Promise.all([
        User_model_1.UserModel.findById(userId),
        CitizenProfile_model_1.CitizenProfileModel.findOne({ userId }),
    ]);
    if (!user)
        throw new error_1.AppError('User not found.', 404, 'NOT_FOUND');
    if (!profile)
        throw new error_1.AppError('Citizen profile not found.', 404, 'NOT_FOUND');
    return { user: user.toSafeObject(), profile };
}
//  Update citizen profile 
async function updateCitizenProfile(userId, input) {
    const user = await User_model_1.UserModel.findById(userId);
    if (!user)
        throw new error_1.AppError('User not found.', 404, 'NOT_FOUND');
    const USER_FIELDS = [
        'lastName', 'email', 'state', 'firstName',
        'phone', 'stateCode', 'bio', 'preferredLanguage', 'jurisdictionCode',
        'legalInterestAreas', 'theme', 'fontSize', 'accentColor',
        'reducedMotion', 'highContrast', 'dyslexicFont',
        'notifEmail', 'notifSms', 'notifPush', 'notifInAppBadge',
        'notifLawyerResponse', 'notifConsultReminder', 'notifMatchAlert',
        'notifMessages', 'notifReviewReminder', 'notifWeeklyDigest',
        'notifStreakReminder', 'notifPlatformUpdates', 'notifLegalNews', 'notifPromotional',
        'showActivityPublic', 'allowAnonymousAnalytics', 'personalizedRecommend', 'showProfileInCommunity',
    ];
    if (input.avatarUrl) {
        user.avatarUrl = (await cloudinary_1.default.uploadFile(input.avatarUrl, "user", "image")).url;
    }
    console.log(user);
    for (const key of USER_FIELDS) {
        if (input[key] !== undefined) {
            user[key] = input[key];
        }
    }
    const savedUser = await user.save();
    // Send notification for profile update
    await notification_1.default.saveAndSendNotification({
        userId: userId,
        title: 'Profile Updated ✅',
        body: 'Your profile has been successfully updated.',
        type: 'profile_update',
        clickUrl: '/profile',
        priority: 'low'
    }, 'user', { push_notification: true });
    return savedUser;
}
async function awardXP(userId, points, reason) {
    const profile = await CitizenProfile_model_1.CitizenProfileModel.findOne({ userId });
    if (!profile)
        throw new error_1.AppError('Citizen profile not found.', 404, 'NOT_FOUND');
    await profile.addXP(points);
    await profile.markActivity();
    // Send XP earned notification for significant milestones
    if (points >= 50) {
        await notification_1.default.saveAndSendNotification({
            userId: userId,
            title: '🎯 XP Earned!',
            body: `You earned ${points} XP${reason ? ` for ${reason}` : ''}. Keep learning!`,
            type: 'xp_earned',
            clickUrl: '/dashboard',
            priority: 'medium'
        }, 'user', { push_notification: true });
    }
    return profile;
}
async function listCitizens(params = {}) {
    const { search, page = 1, pageSize = 20, isActive, status } = params;
    const userFilter = { role: 'citizen' };
    if (isActive !== undefined)
        userFilter.isActive = isActive;
    if (search?.trim())
        userFilter.$text = { $search: search.trim() };
    if (status !== undefined)
        userFilter.status = status;
    const skip = (page - 1) * pageSize;
    const [users, total] = await Promise.all([
        User_model_1.UserModel.find(userFilter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
        User_model_1.UserModel.countDocuments(userFilter),
    ]);
    const userIds = users.map((u) => u._id);
    const profiles = await CitizenProfile_model_1.CitizenProfileModel.find({ userId: { $in: userIds } });
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
    const data = users.map((u) => ({
        user: u.toSafeObject(),
        profile: profileMap.get(u._id.toString()) ?? null,
    }));
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
//  Get citizen by id (admin) 
async function getCitizenById(userId) {
    const [user, profile] = await Promise.all([
        User_model_1.UserModel.findOne({ _id: userId, role: 'citizen' }),
        CitizenProfile_model_1.CitizenProfileModel.findOne({ userId }),
    ]);
    if (!user)
        throw new error_1.AppError('Citizen not found.', 404, 'NOT_FOUND');
    return { user: user.toSafeObject(), profile };
}
//  Admin: suspend / reactivate citizen 
async function updateCitizenStatus(userId, action, reason, admin) {
    const user = await User_model_1.UserModel.findOne({ _id: userId, role: 'citizen' });
    if (!user)
        throw new error_1.AppError('Citizen not found.', 404, 'NOT_FOUND');
    user.isActive = action === 'active';
    await user.save({ validateBeforeSave: false });
    Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: types_1.AuditAction.CITIZEN_STATUS_CHANGED,
        targetType: 'citizen',
        targetId: user._id,
        meta: { action, reason },
    }).catch(() => null);
    // Notify citizen about status change
    await notification_1.default.saveAndSendNotification({
        userId: userId,
        title: action === 'active' ? 'Account Reactivated ✅' : 'Account Suspended ⚠️',
        body: action === 'active'
            ? 'Your account has been reactivated. You can now access all features.'
            : `Your account has been suspended. Reason: ${reason}`,
        type: 'account_status',
        priority: 'high'
    }, 'user', { push_notification: true, email_notification: true });
    return {
        message: `Citizen ${action === 'suspended' ? 'suspended' : 'reactivated'}.`,
        userId,
        isActive: user.isActive,
    };
}
//  Admin: send email to citizen (stub) 
async function emailCitizen(userId, subject, body, admin) {
    const user = await User_model_1.UserModel.findOne({ _id: userId, role: 'citizen' });
    if (!user)
        throw new error_1.AppError('Citizen not found.', 404, 'NOT_FOUND');
    // TODO: wire up email provider (SendGrid / Nodemailer)
    console.log(`[EMAIL] To: ${user.email} | Subject: ${subject}`);
    Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: types_1.AuditAction.CITIZEN_EMAIL_SENT,
        targetType: 'citizen',
        targetId: user._id,
        meta: { subject },
    }).catch(() => null);
    return { message: 'Email sent successfully.' };
}
//  Dashboard stats 
async function getCitizenStats() {
    const [total, active, inactive] = await Promise.all([
        User_model_1.UserModel.countDocuments({ role: 'citizen' }),
        User_model_1.UserModel.countDocuments({ role: 'citizen', isActive: true }),
        User_model_1.UserModel.countDocuments({ role: 'citizen', isActive: false }),
    ]);
    const xpAgg = await CitizenProfile_model_1.CitizenProfileModel.aggregate([
        { $group: { _id: null, avgXP: { $avg: '$xpTotal' }, totalStudyMins: { $sum: '$totalStudyMinutes' } } },
    ]);
    return {
        total,
        active,
        inactive,
        avgXP: xpAgg[0]?.avgXP ? Math.round(xpAgg[0].avgXP) : 0,
        totalStudyHours: xpAgg[0]?.totalStudyMins ? Math.round(xpAgg[0].totalStudyMins / 60) : 0,
    };
}
//# sourceMappingURL=citizen.service.js.map