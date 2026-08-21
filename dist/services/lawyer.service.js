"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRequestId = exports.VERIFICATION_DOCUMENT_LABELS = void 0;
exports.buildVerificationDocumentsFromFiles = buildVerificationDocumentsFromFiles;
exports.getLawyerProfile = getLawyerProfile;
exports.submitVerification = submitVerification;
exports.updateLawyerProfile = updateLawyerProfile;
exports.toggleAvailability = toggleAvailability;
exports.advanceVerification = advanceVerification;
exports.rejectVerification = rejectVerification;
exports.verifyDocument = verifyDocument;
exports.listLawyers = listLawyers;
exports.getLawyerById = getLawyerById;
exports.updateLawyerStatus = updateLawyerStatus;
exports.getLawyerStats = getLawyerStats;
exports.getMarketplaceStats = getMarketplaceStats;
exports.getMarketplaceStates = getMarketplaceStates;
exports.getMarketplaceSpecialisms = getMarketplaceSpecialisms;
exports.getFilterCounts = getFilterCounts;
exports.getMarketplaceLawyers = getMarketplaceLawyers;
exports.getLawyerByScnNumber = getLawyerByScnNumber;
exports.requestLawyerMatch = requestLawyerMatch;
exports.getLawyerAvailability = getLawyerAvailability;
exports.submitReview = submitReview;
const mongoose_1 = require("mongoose");
const LawyerProfile_model_1 = require("../models/LawyerProfile.model");
const User_model_1 = require("../models/User.model");
const Admin_model_1 = require("../models/Admin.model");
const citizen_service_1 = require("./citizen.service");
const Consultation_model_1 = require("../models/Consultation.model");
const types_1 = require("../models/types");
const error_1 = require("../middleware/error");
const formatReturn_1 = require("../helpers/formatReturn");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const notification_1 = __importDefault(require("../controllers/others/notification"));
//  Verification documents 
/**
 * The set of document types the verification flow expects. The label drives which
 * "slot" an uploaded file fills, and lets admins/clients tell which document a
 * lawyer is still missing.
 */
exports.VERIFICATION_DOCUMENT_LABELS = [
    'callToBar',
    'lawSchool',
    'practicingLicense',
    'governmentId',
];
/**
 * Derives the document label from the uploaded file's original name, e.g.
 * "callToBar_LOMA Research.pdf" -> "callToBar".
 */
function extractDocumentLabel(originalname) {
    return (originalname.split('_')[0] || '').trim();
}
/**
 * Uploads each raw multipart file to Cloudinary and builds the IVerificationDocument
 * metadata (including the label) that verifyDocumentHandler/admin review relies on.
 */
async function buildVerificationDocumentsFromFiles(userId, files) {
    return Promise.all(files.map(async (file) => {
        const label = extractDocumentLabel(file.originalname);
        if (!exports.VERIFICATION_DOCUMENT_LABELS.includes(label)) {
            throw new error_1.AppError(`Unrecognized document label "${label}" from file "${file.originalname}". ` +
                `Filename must be prefixed with one of: ${exports.VERIFICATION_DOCUMENT_LABELS.join(', ')} (e.g. "callToBar_myFile.pdf").`, 400, 'VALIDATION_ERROR');
        }
        const { url } = await cloudinary_1.default.uploadFile(file, `lawyers/${userId}/verification`, 'raw');
        return {
            label,
            filename: file.originalname,
            fileUrl: url,
            uploadedAt: new Date(),
            sizeBytes: file.size,
            verified: null,
        };
    }));
}
/**
 * Merges newly (re)uploaded documents into whatever the lawyer already has on file,
 * keyed by label. A resubmission only replaces the labels it includes — e.g. if the
 * lawyer only re-uploads a fresh "governmentId", their previously-accepted
 * "callToBar" document is left untouched instead of being wiped out.
 */
function mergeVerificationDocuments(existing = [], incoming = []) {
    const byLabel = new Map();
    for (const doc of existing)
        byLabel.set(doc.label, doc);
    for (const doc of incoming)
        byLabel.set(doc.label, doc); // re-upload resets that slot (verified -> null)
    return Array.from(byLabel.values());
}
//  Get lawyer profile (with user) 
const generateRequestId = () => `RST-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
exports.generateRequestId = generateRequestId;
async function getLawyerProfile(userId) {
    const [user, profile] = await Promise.all([
        User_model_1.UserModel.findById(userId),
        LawyerProfile_model_1.LawyerProfileModel.findOne({ userId }),
    ]);
    if (!user)
        throw new error_1.AppError('User not found.', 404, 'NOT_FOUND');
    if (!profile)
        throw new error_1.AppError('Lawyer profile not found.', 404, 'NOT_FOUND');
    return { user: user.toSafeObject(), profile };
}
//  Submit / resubmit verification 
async function submitVerification(userId, input) {
    let profile = await LawyerProfile_model_1.LawyerProfileModel.findOne({ userId });
    // Create profile if it doesn't exist
    if (!profile) {
        profile = new LawyerProfile_model_1.LawyerProfileModel({
            userId,
            fees: {},
            verificationStatus: types_1.VerificationStatus.PENDING
        });
    }
    // Block resubmission if already in progress beyond credential_check
    const blocked = [
        types_1.VerificationStatus.TRAINING,
        types_1.VerificationStatus.ASSESSMENT,
        types_1.VerificationStatus.VERIFIED,
    ];
    if (blocked.includes(profile.verificationStatus)) {
        throw new error_1.AppError('Your verification is already in progress and cannot be resubmitted at this stage.', 400, 'VERIFICATION_IN_PROGRESS');
    }
    // Update fields
    if (input.title)
        profile.title = input.title;
    if (input.bio)
        profile.bio = input.bio;
    if (input.location)
        profile.location = input.location;
    if (input.state)
        profile.state = input.state;
    if (input.stateCode)
        profile.stateCode = input.stateCode;
    if (input.languages)
        profile.languages = input.languages;
    if (input.fees) {
        profile.fees = {
            message: input.fees.message ?? profile.fees?.message,
            call: input.fees.call ?? profile.fees?.call,
            video: input.fees.video ?? profile.fees?.video,
        };
    }
    // Upload any newly-submitted files (preferred path) or accept pre-uploaded document
    // metadata (legacy path), then merge them into whatever's already on file by label —
    // so a partial resubmission doesn't wipe out documents that were already accepted.
    const newDocuments = input.files?.length
        ? await buildVerificationDocumentsFromFiles(userId, input.files)
        : (input.documents ?? []);
    const mergedDocuments = newDocuments.length
        ? mergeVerificationDocuments(profile.verificationDocuments, newDocuments)
        : undefined; // nothing new uploaded — leave existing documents as they are
    // Submit verification (handles both create and update internally)
    await profile.submitVerification({
        scnNumber: input.scnNumber,
        yearOfCall: input.yearOfCall,
        calledAt: input.calledAt,
        specialisms: input.specialisms,
        documents: mergedDocuments,
    });
    await profile.save();
    // Notify lawyer of verification submission
    await notification_1.default.saveAndSendNotification({
        userId: userId,
        title: '📋 Verification Submitted',
        body: 'Your verification documents have been submitted. We\'ll review them within 24-48 hours.',
        type: 'verification_submitted',
        clickUrl: '/lawyer/verification-status',
        priority: 'medium'
    }, 'user', { push_notification: true, email_notification: true });
    // Notify admin of new verification
    await notification_1.default.saveAndSendNotification({
        userId: userId, // This would need to be replaced with admin user ID
        title: '📋 New Verification Request',
        body: `Lawyer ${userId} has submitted verification documents for review.`,
        type: 'verification_pending',
        clickUrl: '/admin/verifications',
        priority: 'high'
    }, 'admin', { push_notification: true, email_notification: true });
    return { message: 'Verification submitted successfully.', profile };
}
//  Update lawyer profile (non-verification fields) 
async function updateLawyerProfile(userId, input) {
    const profile = await LawyerProfile_model_1.LawyerProfileModel.findOne({ userId });
    if (!profile)
        throw new error_1.AppError('Lawyer profile not found.', 404, 'NOT_FOUND');
    if (input.title !== undefined)
        profile.title = input.title;
    if (input.bio !== undefined)
        profile.bio = input.bio;
    if (input.specialisms !== undefined)
        profile.specialisms = input.specialisms;
    if (input.languages !== undefined)
        profile.languages = input.languages;
    if (input.location !== undefined)
        profile.location = input.location;
    if (input.state !== undefined)
        profile.state = input.state;
    if (input.stateCode !== undefined)
        profile.stateCode = input.stateCode;
    if (input.fees) {
        if (input.fees.message !== undefined)
            profile.fees.message = input.fees.message;
        if (input.fees.call !== undefined)
            profile.fees.call = input.fees.call;
        if (input.fees.video !== undefined)
            profile.fees.video = input.fees.video;
    }
    return profile.save();
}
//  Toggle availability 
async function toggleAvailability(userId, available) {
    const profile = await LawyerProfile_model_1.LawyerProfileModel.findOne({ userId });
    if (!profile)
        throw new error_1.AppError('Lawyer profile not found.', 404, 'NOT_FOUND');
    return profile.setAvailability(available);
}
//  Admin: advance verification 
async function advanceVerification(profileId, admin, note) {
    const profile = await LawyerProfile_model_1.LawyerProfileModel.findById(profileId);
    if (!profile)
        throw new error_1.AppError('Lawyer profile not found.', 404, 'NOT_FOUND');
    const prevStatus = profile.verificationStatus;
    await profile.advanceVerification(new mongoose_1.Types.ObjectId(admin.adminId), note);
    // Notify lawyer of verification progress
    if (profile.verificationStatus === types_1.VerificationStatus.VERIFIED) {
        await notification_1.default.saveAndSendNotification({
            userId: profile.userId.toString(),
            title: '✅ Verification Approved!',
            body: 'Congratulations! Your lawyer verification has been approved. You can now accept consultations.',
            type: 'verification_approved',
            clickUrl: '/lawyer/dashboard',
            priority: 'high'
        }, 'user', { push_notification: true, email_notification: true });
    }
    else {
        await notification_1.default.saveAndSendNotification({
            userId: profile.userId.toString(),
            title: '📋 Verification Update',
            body: `Your verification has been advanced to ${profile.verificationStatus}. ${note || ''}`,
            type: 'verification_updated',
            clickUrl: '/lawyer/verification-status',
            priority: 'medium'
        }, 'user', { push_notification: true });
    }
    Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: profile.verificationStatus === types_1.VerificationStatus.VERIFIED
            ? types_1.AuditAction.VERIFICATION_APPROVED
            : types_1.AuditAction.VERIFICATION_INFO_REQUEST,
        targetType: 'verification',
        targetId: profile._id,
        meta: { from: prevStatus, to: profile.verificationStatus, note },
    }).catch(() => null);
    return { message: `Verification advanced to ${profile.verificationStatus}`, profile };
}
//  Admin: reject verification 
async function rejectVerification(profileId, admin, reason, infoNeeded) {
    const profile = await LawyerProfile_model_1.LawyerProfileModel.findById(profileId);
    if (!profile)
        throw new error_1.AppError('Lawyer profile not found.', 404, 'NOT_FOUND');
    if (infoNeeded) {
    }
    else {
        await profile.rejectVerification(new mongoose_1.Types.ObjectId(admin.adminId), reason);
    }
    // Notify lawyer of rejection
    await notification_1.default.saveAndSendNotification({
        userId: profile.userId.toString(),
        title: '❌ Verification Rejected',
        body: `Your verification request has been rejected. Reason: ${reason || 'Please contact support for more information.'}`,
        type: 'verification_rejected',
        clickUrl: '/lawyer/verification-status',
        priority: 'high'
    }, 'user', { push_notification: true, email_notification: true });
    Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: types_1.AuditAction.VERIFICATION_REJECTED,
        targetType: 'verification',
        targetId: profile._id,
        meta: { reason },
    }).catch(() => null);
    return { message: 'Verification rejected.', profile };
}
//  Admin: verify a document 
async function verifyDocument(profileId, documentId, verified, admin) {
    const profile = await LawyerProfile_model_1.LawyerProfileModel.findById(profileId);
    if (!profile)
        throw new error_1.AppError('Lawyer profile not found.', 404, 'NOT_FOUND');
    await profile.verifyDocument(new mongoose_1.Types.ObjectId(documentId), verified);
    Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: types_1.AuditAction.DOCUMENT_VERIFIED,
        targetType: 'document',
        targetId: documentId,
        meta: { profileId, verified },
    }).catch(() => null);
    return { message: `Document marked as ${verified ? 'verified' : 'failed'}.` };
}
async function listLawyers(params = {}) {
    const { verificationStatus, search, page = 1, pageSize = 20, isAvailable, } = params;
    const filter = {};
    if (verificationStatus && Object.values(types_1.VerificationStatus).includes(verificationStatus)) {
        filter.verificationStatus = verificationStatus;
    }
    if (isAvailable !== undefined)
        filter.isAvailable = isAvailable;
    const skip = (page - 1) * pageSize;
    let userIds;
    if (search?.trim()) {
        const users = await User_model_1.UserModel.find({ $text: { $search: search.trim() }, role: 'lawyer' }, { _id: 1 });
        userIds = users.map((u) => u._id);
        if (userIds.length)
            filter.userId = { $in: userIds };
        else
            return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    const [profiles, total] = await Promise.all([
        LawyerProfile_model_1.LawyerProfileModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .populate('userId', 'firstName fullName lastName email avatarUrl isActive lastLoginAt')
            .populate('specialisms', 'name displayName'),
        LawyerProfile_model_1.LawyerProfileModel.countDocuments(filter),
    ]);
    return {
        data: profiles.map((profile) => (0, formatReturn_1.lawyerObject)(profile)),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
//  Get single lawyer profile (admin) 
async function getLawyerById(profileId) {
    const profile = await LawyerProfile_model_1.LawyerProfileModel.findById(profileId).populate('userId', 'firstName lastName email avatarUrl isActive lastLoginAt createdAt');
    if (!profile)
        throw new error_1.AppError('Lawyer profile not found.', 404, 'NOT_FOUND');
    return (0, formatReturn_1.lawyerObject)(profile);
}
//  Admin: update lawyer status (active / inactive) 
// Note: actual verification is handled by advanceVerification / rejectVerification.
// This is for admin suspend / reactivate.
async function updateLawyerStatus(profileId, action, reason, admin) {
    const profile = await LawyerProfile_model_1.LawyerProfileModel.findById(profileId).populate('userId');
    if (!profile)
        throw new error_1.AppError('Lawyer profile not found.', 404, 'NOT_FOUND');
    const user = await User_model_1.UserModel.findById(profile.userId);
    if (!user)
        throw new error_1.AppError('Associated user not found.', 404, 'NOT_FOUND');
    if (action === 'suspend') {
        user.isActive = false;
        profile.isAvailable = false;
    }
    else {
        user.isActive = true;
    }
    await Promise.all([user.save({ validateBeforeSave: false }), profile.save()]);
    // Notify lawyer of status change
    await notification_1.default.saveAndSendNotification({
        userId: profile.userId.toString(),
        title: action === 'suspend' ? '⚠️ Account Suspended' : '✅ Account Reactivated',
        body: action === 'suspend'
            ? `Your account has been suspended. Reason: ${reason || 'Please contact support.'}`
            : 'Your account has been reactivated. You can now accept consultations.',
        type: 'account_status',
        priority: 'high'
    }, 'user', { push_notification: true, email_notification: true });
    Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: types_1.AuditAction.LAWYER_STATUS_CHANGED,
        targetType: 'lawyer',
        targetId: profile._id,
        meta: { action, reason },
    }).catch(() => null);
    return { message: `Lawyer ${action === 'suspend' ? 'suspended' : 'reactivated'}.` };
}
//  Dashboard stats 
async function getLawyerStats() {
    const statuses = Object.values(types_1.VerificationStatus);
    const counts = await LawyerProfile_model_1.LawyerProfileModel.aggregate([
        { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
    ]);
    const byStatus = {};
    for (const s of statuses)
        byStatus[s] = 0;
    for (const { _id, count } of counts)
        byStatus[_id] = count;
    const ratingAgg = await LawyerProfile_model_1.LawyerProfileModel.aggregate([
        { $match: { reviewCount: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$ratingAvg' } } },
    ]);
    const avgRating = ratingAgg[0]?.avg
        ? Number(ratingAgg[0].avg.toFixed(1))
        : 0;
    return {
        total: Object.values(byStatus).reduce((a, b) => a + b, 0),
        byStatus,
        avgRating,
    };
}
// ========== NEW MARKETPLACE FUNCTIONS ==========
/**
 * Get marketplace stats for hero section
 * GET /marketplace/stats
 */
async function getMarketplaceStats() {
    const totalLawyers = await LawyerProfile_model_1.LawyerProfileModel.countDocuments({
        verificationStatus: types_1.VerificationStatus.VERIFIED,
        isAvailable: true,
    });
    const ratingAgg = await LawyerProfile_model_1.LawyerProfileModel.aggregate([
        { $match: { verificationStatus: types_1.VerificationStatus.VERIFIED, reviewCount: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$ratingAvg' } } },
    ]);
    const avgRating = ratingAgg[0]?.avg ? Number(ratingAgg[0].avg.toFixed(1)) : 4.7;
    const consultationAgg = await Consultation_model_1.ConsultationModel.aggregate([
        { $match: { status: 'completed' } },
        { $count: 'total' },
    ]);
    const totalConsultations = consultationAgg[0]?.total || 0;
    return {
        totalLawyers,
        averageRating: avgRating,
        totalConsultations,
        verifiedLawyers: totalLawyers,
        responseRate: 98, // This would come from analytics
        averageResponseTime: 2, // hours
    };
}
/**
 * Get unique states for filter dropdown
 * GET /marketplace/states
 */
async function getMarketplaceStates() {
    const states = await LawyerProfile_model_1.LawyerProfileModel.distinct('state', {
        verificationStatus: types_1.VerificationStatus.VERIFIED,
        state: { $exists: true, $ne: '' },
    });
    return states.filter(s => s).sort();
}
/**
 * Get specialisms with counts for filter
 * GET /marketplace/specialisms
 */
async function getMarketplaceSpecialisms() {
    const specialismsMap = {
        criminal: { label: 'Criminal Law', iconName: 'Shield', count: 0 },
        property: { label: 'Property & Tenancy', iconName: 'Home', count: 0 },
        employment: { label: 'Employment & Labour', iconName: 'Briefcase', count: 0 },
        business: { label: 'Business & CAC', iconName: 'Building2', count: 0 },
        family: { label: 'Family Law', iconName: 'Heart', count: 0 },
        consumer: { label: 'Consumer Rights', iconName: 'Globe', count: 0 },
        road: { label: 'Road Traffic', iconName: 'Car', count: 0 },
    };
    const result = await LawyerProfile_model_1.LawyerProfileModel.aggregate([
        { $match: { verificationStatus: types_1.VerificationStatus.VERIFIED } },
        { $unwind: { path: '$specialisms', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$specialisms', count: { $sum: 1 } } },
    ]);
    for (const item of result) {
        if (specialismsMap[item._id]) {
            specialismsMap[item._id].count = item.count;
        }
    }
    return Object.entries(specialismsMap).map(([id, data]) => ({
        id,
        label: data.label,
        iconName: data.iconName,
        count: data.count,
    }));
}
/**
 * Get filter counts for sidebar
 * GET /marketplace/filter-counts
 */
async function getFilterCounts(params) {
    const baseFilter = { verificationStatus: types_1.VerificationStatus.VERIFIED };
    if (params.specialism && params.specialism !== 'all') {
        baseFilter.specialisms = params.specialism;
    }
    if (params.state && params.state !== 'all') {
        baseFilter.state = params.state;
    }
    // Search filter if provided
    let userIds;
    if (params.search?.trim()) {
        const users = await User_model_1.UserModel.find({ $text: { $search: params.search.trim() }, role: 'lawyer' }, { _id: 1 });
        userIds = users.map((u) => u._id);
        if (userIds.length)
            baseFilter.userId = { $in: userIds };
        else
            return { specialisms: {}, states: {} };
    }
    // Get specialism counts
    const specialismAgg = await LawyerProfile_model_1.LawyerProfileModel.aggregate([
        { $match: baseFilter },
        { $unwind: { path: '$specialisms', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$specialisms', count: { $sum: 1 } } },
    ]);
    const specialisms = {};
    for (const item of specialismAgg) {
        if (item._id)
            specialisms[item._id] = item.count;
    }
    // Get state counts
    const stateAgg = await LawyerProfile_model_1.LawyerProfileModel.aggregate([
        { $match: baseFilter },
        { $match: { state: { $exists: true, $ne: '' } } },
        { $group: { _id: '$state', count: { $sum: 1 } } },
    ]);
    const states = {};
    for (const item of stateAgg) {
        if (item._id)
            states[item._id] = item.count;
    }
    return { specialisms, states };
}
async function getMarketplaceLawyers(params = {}) {
    const { specialism, state, search, sortBy = 'rating', page = 1, pageSize = 20, subscribedOnly, } = params;
    const filter = {
        verificationStatus: types_1.VerificationStatus.VERIFIED,
    };
    if (subscribedOnly) {
        filter.subscriptionTier = { $ne: 'basic' };
    }
    if (specialism && specialism !== 'all') {
        filter.specialisms = specialism;
    }
    if (state && state !== 'all') {
        filter.state = state;
    }
    // Handle search across user names
    let userIds;
    if (search?.trim()) {
        const users = await User_model_1.UserModel.find({ $text: { $search: search.trim() }, role: 'lawyer' }, { _id: 1 });
        userIds = users.map((u) => u._id);
        if (userIds.length) {
            filter.userId = { $in: userIds };
        }
        else {
            return {
                data: [],
                total: 0,
                page,
                pageSize,
                totalPages: 0,
            };
        }
    }
    // Build sort object
    let sortObj = {};
    switch (sortBy) {
        case 'rating':
            sortObj = { ratingAvg: -1 };
            break;
        case 'reviews':
            sortObj = { reviewCount: -1 };
            break;
        case 'response':
            sortObj = { responseTimeLabel: 1 };
            break;
        case 'fee':
            sortObj = { 'fees.message': 1 };
            break;
        default:
            sortObj = { ratingAvg: -1 };
    }
    const skip = (page - 1) * pageSize;
    const [profiles, total] = await Promise.all([
        LawyerProfile_model_1.LawyerProfileModel.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(pageSize)
            .populate('userId', 'firstName lastName email avatarUrl')
            .populate('specialisms', 'name displayName'),
        LawyerProfile_model_1.LawyerProfileModel.countDocuments(filter),
    ]);
    const data = profiles.map((profile) => (0, formatReturn_1.lawyerObject)(profile));
    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
/**
 * Get lawyer by SCN number (public)
 * GET /marketplace/lawyers/:scnNumber
 */
async function getLawyerByScnNumber(scnNumber) {
    const profile = await LawyerProfile_model_1.LawyerProfileModel.findOne({ scnNumber: scnNumber.replace(/-/g, "/") })
        .populate('userId', 'firstName lastName email avatarUrl')
        .populate('specialisms');
    if (!profile) {
        throw new error_1.AppError('Lawyer not found', 404, 'NOT_FOUND');
    }
    // Transform to marketplace format
    return (0, formatReturn_1.lawyerObject)(profile);
}
async function requestLawyerMatch(citizenId, input) {
    const documents = [];
    for (const doc of input.documents || []) {
        const { url, publicId } = await cloudinary_1.default.uploadFile(doc.base64, `match-requests/${citizenId}`, 'raw');
        documents.push({
            name: doc.name,
            fileUrl: url,
            publicId,
            sizeBytes: doc.sizeBytes || 0,
            source: 'citizen',
            uploadedAt: new Date(),
        });
    }
    const receiptId = (0, exports.generateRequestId)();
    const request = await Consultation_model_1.LawyerRequestModel.create({
        citizenId,
        specialism: input.specialism,
        urgency: input.urgency,
        location: input.location,
        topic: input.topic,
        mode: input.mode,
        description: input.description,
        notes: input.notes,
        waiver: input.waiver,
        waiverReason: input.waiverReason,
        whenHappened: input.whenHappened,
        receiptId,
        documents,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        timeline: [
            { time: new Date(), label: 'Request submitted', note: 'Awaiting review from our team' },
        ],
    });
    return {
        requestId: request._id,
        receiptId,
        status: request.status,
        documentsAttached: documents.length,
        paymentResult: null
    };
}
/**
 * Get lawyer availability slots
 * GET /marketplace/lawyers/:scnNumber/availability
 */
async function getLawyerAvailability(scnNumber, date) {
    const profile = await LawyerProfile_model_1.LawyerProfileModel.findOne({ scnNumber: scnNumber.replace(/-/g, "/") });
    if (!profile) {
        throw new error_1.AppError('Lawyer not found', 404, 'NOT_FOUND');
    }
    // Generate time slots for the next 7 days (9 AM - 5 PM, hourly)
    const startDate = date ? new Date(date) : new Date();
    startDate.setHours(0, 0, 0, 0);
    const slots = [];
    for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day);
        for (let hour = 9; hour <= 17; hour++) {
            const slotTime = new Date(currentDate);
            slotTime.setHours(hour, 0, 0, 0);
            // Skip past times
            if (slotTime < new Date())
                continue;
            // Check if already booked (simplified - would check existing consultations)
            const existingBooking = await Consultation_model_1.ConsultationModel.findOne({
                lawyerId: profile.userId,
                scheduledAt: slotTime,
                status: { $in: ['pending', 'accepted'] },
            });
            slots.push({
                id: `${slotTime.toISOString()}`,
                startTime: slotTime.toISOString(),
                endTime: new Date(slotTime.getTime() + 60 * 60 * 1000).toISOString(),
                isAvailable: !existingBooking,
                timezone: 'Africa/Lagos',
            });
        }
    }
    return slots;
}
async function submitReview(citizenId, scnNumber, input) {
    const { consultationId, rating, comment, tags } = input;
    // Find the consultation
    const consultation = await Consultation_model_1.ConsultationModel.findOne({
        _id: consultationId,
        citizenId,
        status: 'completed',
    });
    if (!consultation) {
        throw new error_1.AppError('Consultation not found or not completed', 404, 'NOT_FOUND');
    }
    // Check if already reviewed
    if (consultation.citizenRating) {
        throw new error_1.AppError('You have already reviewed this consultation', 400, 'ALREADY_REVIEWED');
    }
    // Update consultation with review
    consultation.citizenRating = rating;
    consultation.citizenReview = comment;
    consultation.reviewedAt = new Date();
    await consultation.save();
    // Update lawyer's ratings
    const lawyerProfile = await LawyerProfile_model_1.LawyerProfileModel.findById(consultation.lawyerProfileId);
    if (lawyerProfile) {
        const newTotalRating = (lawyerProfile.ratingAvg * lawyerProfile.reviewCount) + rating;
        const newReviewCount = lawyerProfile.reviewCount + 1;
        const newRatingAvg = newTotalRating / newReviewCount;
        await lawyerProfile.updateMetrics({
            ratingAvg: newRatingAvg,
            reviewCount: newReviewCount,
        });
        await (0, citizen_service_1.awardXP)(citizenId, 25); // 25 XP for leaving a review
    }
    // Notify lawyer of new review
    await notification_1.default.saveAndSendNotification({
        userId: consultation.lawyerId.toString(),
        title: `⭐ New Review (${rating}/5)`,
        body: `You received a new review: "${comment || 'No comment provided'}"`,
        type: 'review_received',
        clickUrl: `/lawyer/reviews`,
        priority: 'medium'
    }, 'user', { push_notification: true });
    return {
        reviewId: consultation._id,
        status: 'published',
        createdAt: new Date(),
    };
}
//# sourceMappingURL=lawyer.service.js.map