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
exports.generateConsultId = void 0;
exports.uploadDocument = uploadDocument;
exports.formatConsultation = formatConsultation;
exports.bookConsultation = bookConsultation;
exports.getCitizenConsultations = getCitizenConsultations;
exports.getCitizenConsultationById = getCitizenConsultationById;
exports.getCitizenConsultationStats = getCitizenConsultationStats;
exports.raiseDispute = raiseDispute;
exports.requestRefund = requestRefund;
exports.submitCitizenRating = submitCitizenRating;
exports.sendCitizenMessage = sendCitizenMessage;
exports.getLawyerConsultations = getLawyerConsultations;
exports.getLawyerConsultationById = getLawyerConsultationById;
exports.getLawyerConsultationStats = getLawyerConsultationStats;
exports.acceptConsultation = acceptConsultation;
exports.rejectConsultation = rejectConsultation;
exports.sendLawyerMessage = sendLawyerMessage;
exports.completeConsultation = completeConsultation;
exports.getMatchRequestsForLawyer = getMatchRequestsForLawyer;
exports.getMatchRequestsForCitizen = getMatchRequestsForCitizen;
exports.getMatchRequestForCitizen = getMatchRequestForCitizen;
exports.addCitizenMatchDocument = addCitizenMatchDocument;
exports.citizenSelectRecommendedLawyer = citizenSelectRecommendedLawyer;
exports.getAvailableStatuses = getAvailableStatuses;
exports.listConsultations = listConsultations;
exports.getConsultationById = getConsultationById;
exports.getConsultationStats = getConsultationStats;
exports.listDisputes = listDisputes;
exports.listRefundRequests = listRefundRequests;
exports.listFlaggedConsultations = listFlaggedConsultations;
exports.updateConsultationStatus = updateConsultationStatus;
exports.resolveDispute = resolveDispute;
exports.flagConsultation = flagConsultation;
exports.approveRefund = approveRefund;
exports.sendLawyerWarning = sendLawyerWarning;
exports.bulkAction = bulkAction;
exports.exportConsultations = exportConsultations;
exports.listMatchRequests = listMatchRequests;
exports.getMatchRequestById = getMatchRequestById;
exports.adminAcceptMatchRequest = adminAcceptMatchRequest;
exports.updateCitizenMatchStatus = updateCitizenMatchStatus;
exports.sendAdminMatchMessage = sendAdminMatchMessage;
exports.scheduleAdminMatchCall = scheduleAdminMatchCall;
exports.adminAddMatchDocument = adminAddMatchDocument;
exports.getAutoSuggestedLawyers = getAutoSuggestedLawyers;
exports.recommendLawyersForMatch = recommendLawyersForMatch;
exports.assignLawyerToMatch = assignLawyerToMatch;
exports.bulkAutoSuggestAndRecommend = bulkAutoSuggestAndRecommend;
exports.autoSuggestAndRecommend = autoSuggestAndRecommend;
exports.expireMatchRequest = expireMatchRequest;
exports.consultationPayment = consultationPayment;
exports.getLawyerPerformance = getLawyerPerformance;
exports.getTopLawyers = getTopLawyers;
exports.getDashboardStats = getDashboardStats;
exports.getRecentActivity = getRecentActivity;
const mongoose_1 = require("mongoose");
const Consultation_model_1 = require("../models/Consultation.model");
const LawyerProfile_model_1 = require("../models/LawyerProfile.model");
const User_model_1 = require("../models/User.model");
const Admin_model_1 = require("../models/Admin.model");
const types_1 = require("../models/types");
const error_1 = require("../middleware/error");
const payment_1 = __importDefault(require("./payment/payment"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const notification_1 = __importDefault(require("../controllers/others/notification"));
const productPurchaseLog_1 = __importStar(require("../models/billing/productPurchaseLog"));
const server_1 = require("../server");
// ─── Shared helpers ───────────────────────────────────────────────────────────
function getInitials(name) {
    return name
        .split(' ')
        .map(p => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
const generateConsultId = () => `CST-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
exports.generateConsultId = generateConsultId;
function getRandomColor() {
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#F97316'];
    return colors[Math.floor(Math.random() * colors.length)];
}
/**
 * Uploads a single document (PDF, image, Word doc, etc.) to Cloudinary as a raw asset
 * and returns the metadata shape stored on a match request.
 */
async function uploadDocument(input, source, location) {
    const { url, publicId } = await cloudinary_1.default.uploadFile(input.file, location || 'files', 'raw');
    return {
        name: input.name,
        fileUrl: url,
        publicId,
        sizeBytes: input.sizeBytes || 0,
        label: input.label,
        source,
        uploadedAt: new Date(),
    };
}
/** Maps a lawyer profile document into the lightweight snapshot stored on recommendedLawyers/matched fields. */
function toRecommendedLawyerRef(profile) {
    console.log(profile);
    const user = profile.userId;
    console.log({ user });
    const name = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown';
    return {
        lawyerId: user?._id || profile.userId,
        lawyerProfileId: profile._id,
        name,
        picture: user.avatarUrl,
        initials: getInitials(name),
        color: profile.colorA || getRandomColor(),
        scnNumber: profile.scnNumber || '',
        title: profile.title,
    };
}
/** Maps a raw LawyerRequest mongoose document into the DTO shape consumed by the frontend. */
function mapMatchRequestToDTO(req) {
    const citizen = req.citizenId;
    console.log({ law: req.matchedLawyerProfileId });
    const name = citizen?.fullName || `${citizen?.firstName || ''} ${citizen?.lastName || ''}`.trim() || 'Unknown';
    return {
        id: req._id,
        citizen: {
            id: citizen?._id?.toString(),
            name,
            initials: getInitials(name),
            color: getRandomColor(),
            email: citizen?.email,
            phone: citizen?.phone,
            state: citizen?.state,
        },
        specialism: req.specialism,
        urgency: req.urgency,
        mode: req.mode,
        topic: req.topic,
        description: req.description,
        notes: req.notes,
        documents: (req.documents || []).map((d) => ({
            name: d.name,
            fileUrl: d.fileUrl,
            sizeBytes: d.sizeBytes,
            label: d.label,
            source: d.source,
            uploadedAt: d.uploadedAt?.toISOString?.() || d.uploadedAt,
        })),
        caseBrief: req.caseBrief
            ? {
                name: req.caseBrief.name,
                fileUrl: req.caseBrief.fileUrl,
                sizeBytes: req.caseBrief.sizeBytes,
                label: req.caseBrief.label,
                source: req.caseBrief.source,
                uploadedAt: req.caseBrief.uploadedAt?.toISOString?.() || req.caseBrief.uploadedAt,
            }
            : undefined,
        adminMessage: req.adminMessage,
        adminMessageAt: req.adminMessageAt?.toISOString?.(),
        scheduledCall: req.scheduledCall
            ? {
                dateTime: req.scheduledCall.dateTime?.toISOString?.() || req.scheduledCall.dateTime,
                link: req.scheduledCall.link,
                note: req.scheduledCall.note,
            }
            : undefined,
        recommendedLawyers: req.recommendedLawyers,
        rejectedLawyers: req.rejectedLawyers || [],
        status: req.status,
        createdAt: req.createdAt?.toISOString(),
        expiresAt: req.expiresAt?.toISOString(),
        matchedLawyer: req.matchedLawyerProfileId,
        matchedLawyerId: req.matchedLawyerId ? {
            initials: getInitials(`${req.matchedLawyerId?.firstName} ${req.matchedLawyerId?.lastName}`),
            name: `${req.matchedLawyerId?.firstName} ${req.matchedLawyerId?.lastName}`,
            picture: req.matchedLawyerId.avatarUrl,
        } : {},
        consultationId: req.consultationId?.toString(),
    };
}
async function getCitizenInfo(citizenId) {
    const user = await User_model_1.UserModel.findById(citizenId);
    if (!user)
        return null;
    const name = `${user.firstName} ${user.lastName}`.trim();
    return {
        id: user._id.toString(),
        name,
        initials: getInitials(name),
        color: getRandomColor(),
        email: user.email,
        phone: user.phone,
    };
}
async function getLawyerInfo(lawyerProfileId, lawyerId) {
    const profile = await LawyerProfile_model_1.LawyerProfileModel.findById(lawyerProfileId)
        .populate('userId', 'firstName lastName fullName email')
        .populate("specialisms", "displayName");
    if (!profile)
        return null;
    const user = profile.userId;
    const name = user?.fullName || `${user?.firstName} ${user?.lastName}` || 'Unknown';
    return {
        id: profile._id.toString(),
        name,
        initials: getInitials(name),
        color: profile.colorA || getRandomColor(),
        specialisms: profile.specialisms || [],
        scnNumber: profile.scnNumber || '',
        myPayout: profile.fees,
    };
}
/** Shared shape returned to both citizen and lawyer views */
async function formatConsultation(consult) {
    const citizenInfo = await getCitizenInfo(consult.citizenId._id ?? consult.citizenId);
    const lawyerInfo = await getLawyerInfo(consult.lawyerProfileId._id ?? consult.lawyerProfileId, consult.lawyerId._id ?? consult.lawyerId);
    return {
        id: consult._id,
        citizen: citizenInfo,
        lawyer: lawyerInfo,
        mode: consult.mode,
        conversationId: consult.conversationId,
        topic: consult.topic,
        detail: consult.detail || '',
        status: consult.status,
        fee: consult.feePaid,
        receiptId: consult.generateConsultId,
        platformFee: consult.platformFee || Math.round(consult.feePaid * 0.15),
        lawyerPayout: consult.lawyerPayout || Math.round(consult.feePaid * 0.85),
        createdAt: consult.createdAt?.toISOString(),
        completedAt: consult.completedAt?.toISOString(),
        rating: consult.citizenRating,
        ratingNote: consult.citizenReview,
        duration: consult.durationMins ? `${consult.durationMins} min` : undefined,
        disputed: consult.disputed || false,
        disputeReason: consult.disputeReason,
        transcript: consult.transcript || [],
        flagged: consult.flagged || false,
        flagReason: consult.flagReason,
        refundRequested: consult.refundRequested || false,
        refundApproved: consult.refundApproved,
        refundReason: consult.refundReason,
        paymentRef: consult.paymentRef,
        lawyerResponseAt: consult.lawyerResponseAt,
    };
}
async function bookConsultation(citizenId, citizenName, input) {
    const { lawyerScnNumber, mode, topic, description, waiver, requestId, receiptId: requestReceipt } = input;
    // Find lawyer by SCN number
    const profile = await LawyerProfile_model_1.LawyerProfileModel.findOne({ scnNumber: lawyerScnNumber })
        .populate('userId', 'firstName lastName email avatarUrl')
        .populate('specialisms', 'name displayName');
    if (!profile) {
        throw new error_1.AppError('Lawyer not found', 404, 'NOT_FOUND');
    }
    if (!profile.isAvailable) {
        throw new error_1.AppError('Lawyer is not available for consultations', 400, 'LAWYER_UNAVAILABLE');
    }
    // Get fee based on mode
    let feePaid = 0;
    switch (mode) {
        case 'message':
            feePaid = profile.fees?.message || 5000;
            break;
        case 'call':
            feePaid = profile.fees?.call || 12000;
            break;
        case 'video':
            feePaid = profile.fees?.video || 18000;
            break;
    }
    const receiptId = requestReceipt ?? (0, exports.generateConsultId)();
    const verifyPayment = await productPurchaseLog_1.default.findOne({ "meta.coreId": requestId });
    // Create consultation
    const consultation = await Consultation_model_1.ConsultationModel.create({
        citizenId,
        lawyerId: profile.userId,
        lawyerProfileId: profile._id,
        mode,
        topic,
        detail: description,
        status: waiver ? "awaiting_lawyer" : verifyPayment?.payment_status === productPurchaseLog_1.PaymentStatus.PAYMENT_CONFIRMED ? 'awaiting_lawyer' : 'pending',
        feePaid,
        receiptId,
        timeline: [
            { time: new Date(), label: 'Request sent', note: `Consultation requested via ${mode}` },
        ],
    });
    const lawyerUser = profile.userId;
    const conversation = await server_1.chatService.findOrCreateConversation({
        contextType: 'consultation',
        contextId: consultation._id.toString(),
        participants: [
            {
                userId: new mongoose_1.Types.ObjectId(citizenId),
                role: 'citizen',
                name: citizenName,
            },
            {
                userId: lawyerUser._id.toString(),
                role: 'lawyer',
                name: `${lawyerUser.firstName} ${lawyerUser.lastName}`.trim(),
                avatarUrl: lawyerUser.avatarUrl,
            },
        ],
        metadata: {
            consultationId: consultation._id.toString(),
            mode: input.mode,
            feePaid: feePaid,
        },
    });
    await Consultation_model_1.ConsultationModel.updateOne({ _id: consultation._id }, { $set: { conversationId: conversation.conversation._id } });
    return {
        consultationId: consultation._id,
        receiptId,
        status: consultation.status,
        fee: feePaid,
        lawyerResponseTime: profile.responseTimeLabel || 'Under 2 hours',
        estimatedResponseAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    };
}
/**
 * GET /consultations/citizen
 * All consultations belonging to the authenticated citizen.
 */
async function getCitizenConsultations(citizenId, params = {}) {
    const { status, mode, search, page = 1, pageSize = 20, startDate, endDate } = params;
    const filter = { citizenId: new mongoose_1.Types.ObjectId(citizenId) };
    if (status && status !== 'all')
        filter.status = status;
    if (mode && mode !== 'all')
        filter.mode = mode;
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate)
            filter.createdAt.$gte = new Date(startDate);
        if (endDate)
            filter.createdAt.$lte = new Date(endDate);
    }
    if (search?.trim()) {
        filter.topic = { $regex: search.trim(), $options: 'i' };
    }
    console.log({ filter });
    const skip = (page - 1) * pageSize;
    const [consultations, total] = await Promise.all([
        Consultation_model_1.ConsultationModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .populate('citizenId', 'firstName lastName fullName email')
            .populate('lawyerId', 'firstName lastName fullName email')
            .populate('lawyerProfileId'),
        Consultation_model_1.ConsultationModel.countDocuments(filter),
    ]);
    const data = await Promise.all(consultations.map(formatConsultation));
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
/**
 * GET /consultations/citizen/:id
 * Single consultation for the authenticated citizen (ownership check).
 */
async function getCitizenConsultationById(consultationId, citizenId) {
    const consult = await Consultation_model_1.ConsultationModel.findOne({
        _id: consultationId,
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
    })
        .populate('citizenId', 'firstName lastName fullName email')
        .populate('lawyerId', 'firstName lastName fullName email')
        .populate('lawyerProfileId');
    if (!consult)
        throw new error_1.AppError('Consultation not found', 404, 'NOT_FOUND');
    return formatConsultation(consult);
}
/**
 * GET /consultations/citizen/stats
 * Aggregate stats for the citizen dashboard.
 */
async function getCitizenConsultationStats(citizenId) {
    const cid = new mongoose_1.Types.ObjectId(citizenId);
    const [total, active, disputed, completed, pendingPayment, awaitingLawyer, cancelled, refunded] = await Promise.all([
        Consultation_model_1.ConsultationModel.countDocuments({ citizenId: cid }),
        Consultation_model_1.ConsultationModel.countDocuments({ citizenId: cid, status: { $in: ['active', 'awaiting_lawyer'] } }),
        Consultation_model_1.ConsultationModel.countDocuments({ citizenId: cid, disputed: true }),
        Consultation_model_1.ConsultationModel.countDocuments({ citizenId: cid, status: { $in: ['completed', 'disputed', 'refunded'] } }),
        Consultation_model_1.ConsultationModel.countDocuments({ citizenId: cid, status: 'pending' }),
        Consultation_model_1.ConsultationModel.countDocuments({ citizenId: cid, status: 'awaiting_lawyer' }),
        Consultation_model_1.ConsultationModel.countDocuments({ citizenId: cid, status: 'cancelled' }),
        Consultation_model_1.ConsultationModel.countDocuments({ citizenId: cid, status: 'refunded' }),
    ]);
    const revenueAgg = await Consultation_model_1.ConsultationModel.aggregate([
        { $match: { citizenId: cid, status: { $ne: 'pending' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$feePaid' } } },
    ]);
    return {
        total,
        active,
        disputed,
        completed,
        pendingPayment,
        awaitingLawyer,
        cancelled,
        refunded,
        totalRevenue: revenueAgg[0]?.totalRevenue || 0,
        platformRevenue: 0,
        lawyerPayoutTotal: 0,
    };
}
/**
 * POST /consultations/citizen/:id/dispute
 * Citizen raises a dispute on an active/completed consultation.
 */
async function raiseDispute(consultationId, citizenId, reason) {
    const consult = await Consultation_model_1.ConsultationModel.findOne({
        _id: consultationId,
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
    });
    if (!consult)
        throw new error_1.AppError('Consultation not found', 404, 'NOT_FOUND');
    const allowed = ['active', 'completed', 'awaiting_lawyer'];
    if (!allowed.includes(consult.status)) {
        throw new error_1.AppError('Disputes can only be raised on active or completed consultations', 400, 'INVALID_STATUS');
    }
    if (consult.disputed)
        throw new error_1.AppError('A dispute has already been raised on this consultation', 400, 'ALREADY_DISPUTED');
    consult.disputed = true;
    consult.disputeReason = reason;
    consult.disputeRaisedAt = new Date();
    consult.status = 'disputed';
    consult.timeline.push({ time: new Date(), label: 'Dispute raised', note: reason });
    await consult.save();
    // Notify admin about dispute
    await notification_1.default.saveAndSendNotification({
        userId: consult.lawyerId.toString(),
        title: '⚠️ Dispute Raised',
        body: `A dispute has been raised on consultation ${consultationId}. Reason: ${reason}`,
        type: 'dispute_raised',
        clickUrl: `/consultations/${consultationId}`,
        priority: 'high'
    }, 'admin', { push_notification: true, email_notification: true });
    // Notify citizen that dispute was submitted
    await notification_1.default.saveAndSendNotification({
        userId: citizenId,
        title: 'Dispute Submitted 📝',
        body: 'Your dispute has been submitted. Our team will review it within 24-48 hours.',
        type: 'dispute_submitted',
        clickUrl: `/consultations/${consultationId}`,
        priority: 'medium'
    }, 'user', { push_notification: true });
    return formatConsultation(consult);
}
/**
 * POST /consultations/citizen/:id/refund-request
 * Citizen requests a refund.
 */
async function requestRefund(consultationId, citizenId, reason) {
    const consult = await Consultation_model_1.ConsultationModel.findOne({
        _id: consultationId,
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
    });
    if (!consult)
        throw new error_1.AppError('Consultation not found', 404, 'NOT_FOUND');
    if (consult.refundRequested)
        throw new error_1.AppError('A refund request already exists', 400, 'ALREADY_REQUESTED');
    consult.refundRequested = true;
    consult.refundReason = reason;
    consult.timeline.push({ time: new Date(), label: 'Refund requested', note: reason || '' });
    await consult.save();
    // Notify admin about refund request
    await notification_1.default.saveAndSendNotification({
        userId: consult.lawyerId.toString(),
        title: '💰 Refund Requested',
        body: `A refund has been requested for consultation ${consultationId}.`,
        type: 'refund_requested',
        clickUrl: `/consultations/${consultationId}`,
        priority: 'high'
    }, 'admin', { push_notification: true, email_notification: true });
    return formatConsultation(consult);
}
/**
 * POST /consultations/citizen/:id/rating
 * Citizen submits a rating/review after a completed consultation.
 */
async function submitCitizenRating(consultationId, citizenId, rating, comment) {
    const consult = await Consultation_model_1.ConsultationModel.findOne({
        _id: consultationId,
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
        status: 'completed',
    });
    if (!consult)
        throw new error_1.AppError('Completed consultation not found', 404, 'NOT_FOUND');
    if (consult.citizenRating)
        throw new error_1.AppError('You have already rated this consultation', 400, 'ALREADY_RATED');
    consult.citizenRating = rating;
    consult.citizenReview = comment;
    consult.reviewedAt = new Date();
    consult.timeline.push({ time: new Date(), label: 'Review submitted', note: comment || '' });
    await consult.save();
    // Update lawyer profile aggregate rating
    const profile = await LawyerProfile_model_1.LawyerProfileModel.findById(consult.lawyerProfileId);
    if (profile) {
        const newTotal = profile.ratingAvg * profile.reviewCount + rating;
        const newCount = profile.reviewCount + 1;
        await profile.updateMetrics({ ratingAvg: newTotal / newCount, reviewCount: newCount });
    }
    return formatConsultation(consult);
}
/**
 * POST /consultations/citizen/:id/messages
 * Citizen sends a message inside an active consultation transcript.
 */
async function sendCitizenMessage(consultationId, citizenId, text) {
    const consult = await Consultation_model_1.ConsultationModel.findOne({
        _id: consultationId,
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
    });
    if (!consult)
        throw new error_1.AppError('Consultation not found', 404, 'NOT_FOUND');
    const user = await User_model_1.UserModel.findById(citizenId);
    const senderName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Citizen';
    const message = {
        id: new mongoose_1.Types.ObjectId().toString(),
        conversationId: consultationId,
        sender: 'citizen',
        senderRole: 'citizen',
        senderName,
        senderId: new mongoose_1.Types.ObjectId(citizenId),
        text,
        body: text,
        time: new Date(),
        read: false,
        isRead: false,
        isDeleted: false,
    };
    consult.transcript.push(message);
    await consult.save();
    // Notify lawyer of new message
    await notification_1.default.saveAndSendNotification({
        userId: consult.lawyerId.toString(),
        title: '💬 New Message from Citizen',
        body: `${senderName} sent you a message: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`,
        type: 'message_received',
        clickUrl: `/consultations/${consultationId}`,
        priority: 'high'
    }, 'user', { push_notification: true });
    return { message, consultationId };
}
// ─── LAWYER SERVICES ──────────────────────────────────────────────────────────
/**
 * GET /consultations/lawyer
 * All consultations belonging to the authenticated lawyer.
 */
async function getLawyerConsultations(lawyerId, params = {}) {
    const { status, mode, search, page = 1, pageSize = 20, startDate, endDate } = params;
    const filter = { lawyerId: new mongoose_1.Types.ObjectId(lawyerId) };
    if (status && status !== 'all')
        filter.status = status;
    if (mode && mode !== 'all')
        filter.mode = mode;
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate)
            filter.createdAt.$gte = new Date(startDate);
        if (endDate)
            filter.createdAt.$lte = new Date(endDate);
    }
    if (search?.trim()) {
        filter.topic = { $regex: search.trim(), $options: 'i' };
    }
    console.log({ filter });
    const skip = (page - 1) * pageSize;
    const [consultations, total] = await Promise.all([
        Consultation_model_1.ConsultationModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .populate('citizenId', 'firstName lastName fullName email')
            .populate('lawyerId', 'firstName lastName fullName email')
            .populate('lawyerProfileId'),
        Consultation_model_1.ConsultationModel.countDocuments(filter),
    ]);
    const data = await Promise.all(consultations.map(formatConsultation));
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
/**
 * GET /consultations/lawyer/:id
 * Single consultation for the authenticated lawyer (ownership check).
 */
async function getLawyerConsultationById(consultationId, lawyerId) {
    const consult = await Consultation_model_1.ConsultationModel.findOne({
        _id: consultationId,
        lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
    })
        .populate('citizenId', 'firstName lastName fullName email')
        .populate('lawyerId', 'firstName lastName fullName email')
        .populate('lawyerProfileId');
    if (!consult)
        throw new error_1.AppError('Consultation not found', 404, 'NOT_FOUND');
    return formatConsultation(consult);
}
/**
 * GET /consultations/lawyer/stats
 */
async function getLawyerConsultationStats(lawyerId) {
    const lid = new mongoose_1.Types.ObjectId(lawyerId);
    const [total, active, awaitingLawyer, completed, disputed, cancelled] = await Promise.all([
        Consultation_model_1.ConsultationModel.countDocuments({ lawyerId: lid }),
        Consultation_model_1.ConsultationModel.countDocuments({ lawyerId: lid, status: 'active' }),
        Consultation_model_1.ConsultationModel.countDocuments({ lawyerId: lid, status: 'awaiting_lawyer' }),
        Consultation_model_1.ConsultationModel.countDocuments({ lawyerId: lid, status: 'completed' }),
        Consultation_model_1.ConsultationModel.countDocuments({ lawyerId: lid, disputed: true }),
        Consultation_model_1.ConsultationModel.countDocuments({ lawyerId: lid, status: 'cancelled' }),
    ]);
    const earningsAgg = await Consultation_model_1.ConsultationModel.aggregate([
        { $match: { lawyerId: lid, status: 'completed' } },
        {
            $group: {
                _id: null,
                totalEarnings: { $sum: { $multiply: ['$feePaid', 0.85] } },
                ratingSum: { $sum: { $ifNull: ['$citizenRating', 0] } },
                ratingCount: { $sum: { $cond: [{ $ne: ['$citizenRating', null] }, 1, 0] } },
            },
        },
    ]);
    const totalEarnings = earningsAgg[0]?.totalEarnings || 0;
    const ratingCount = earningsAgg[0]?.ratingCount || 0;
    const averageRating = ratingCount > 0 ? earningsAgg[0].ratingSum / ratingCount : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, active, awaitingLawyer, completed, disputed, cancelled, totalEarnings, averageRating, completionRate };
}
/**
 * POST /consultations/lawyer/:id/accept
 * Lawyer accepts a consultation that is in `awaiting_lawyer` status.
 */
async function acceptConsultation(consultationId, lawyerId) {
    const consult = await Consultation_model_1.ConsultationModel.findOne({
        _id: consultationId,
        lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
    });
    if (!consult)
        throw new error_1.AppError('Consultation not found', 404, 'NOT_FOUND');
    if (consult.status !== 'awaiting_lawyer' && consult.status !== 'paid') {
        throw new error_1.AppError('Consultation is not in a state that can be accepted', 400, 'INVALID_STATUS');
    }
    consult.status = 'active';
    consult.lawyerResponseAt = new Date().toISOString();
    consult.timeline.push({ time: new Date(), label: 'Consultation accepted by lawyer' });
    await consult.save();
    // Notify citizen that lawyer accepted
    await notification_1.default.saveAndSendNotification({
        userId: consult.citizenId.toString(),
        title: '✅ Consultation Accepted',
        body: 'Your consultation request has been accepted. Your lawyer will be with you shortly.',
        type: 'consultation_accepted',
        clickUrl: `/consultations/${consultationId}`,
        priority: 'high'
    }, 'user', { push_notification: true });
    return formatConsultation(consult);
}
/**
 * POST /consultations/lawyer/:id/reject
 * Lawyer rejects/declines a consultation request.
 *
 * If this consultation originated from a match request (a "case" the citizen already
 * paid for), rejecting it does NOT close out the case — it reopens the match request
 * so the citizen can pick a different lawyer without paying again. The rejecting
 * lawyer is excluded from future suggestions/selection for that same case.
 */
async function rejectConsultation(consultationId, lawyerId, reason) {
    const consult = await Consultation_model_1.ConsultationModel.findOne({
        _id: consultationId,
        lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
    });
    if (!consult)
        throw new error_1.AppError('Consultation not found', 404, 'NOT_FOUND');
    if (!['awaiting_lawyer', 'paid', 'active'].includes(consult.status)) {
        throw new error_1.AppError('Consultation cannot be rejected at this stage', 400, 'INVALID_STATUS');
    }
    consult.status = 'cancelled';
    consult.declineReason = reason;
    consult.cancelledBy = 'lawyer';
    consult.timeline.push({ time: new Date(), label: 'Consultation rejected by lawyer', note: reason });
    await consult.save();
    const reopenedCase = await reopenMatchRequestAfterRejection(consult, reason);
    // Notify citizen that their request was declined
    await notification_1.default.saveAndSendNotification({
        userId: consult.citizenId.toString(),
        title: '❌ Consultation Declined',
        body: reopenedCase
            ? `Your lawyer declined this consultation. Reason: ${reason || 'No reason provided'}. You can pick another lawyer for this case at no extra cost.`
            : `Your consultation request has been declined. Reason: ${reason || 'No reason provided'}`,
        type: 'consultation_declined',
        clickUrl: reopenedCase ? `/match-requests/${reopenedCase._id}` : `/consultations/${consultationId}`,
        priority: 'medium'
    }, 'user', { push_notification: true });
    return formatConsultation(consult);
}
/**
 * Helper for rejectConsultation: if the rejected consultation is tied to a paid-for
 * match request (case), puts that request back into a selectable state instead of
 * leaving it stuck at "matched" — this is what lets the citizen choose a new lawyer
 * without triggering a new payment (bookConsultation reuses the case's existing
 * PurchaseLog when the same requestId is passed back in).
 */
async function reopenMatchRequestAfterRejection(consult, reason) {
    if (!consult.requestId)
        return null;
    const request = await Consultation_model_1.LawyerRequestModel.findById(consult.requestId);
    if (!request)
        return null;
    const rejectedProfileId = consult.lawyerProfileId.toString();
    // Track who has already rejected this case so they're never re-suggested/re-selectable.
    const rejectedLawyers = new Set((request.rejectedLawyers ?? []).map(String));
    rejectedLawyers.add(rejectedProfileId);
    request.rejectedLawyers = Array.from(rejectedLawyers);
    // Drop the rejecting lawyer from the shortlist the citizen sees.
    request.recommendedLawyers = (request.recommendedLawyers ?? []).filter((id) => id.toString() !== rejectedProfileId);
    // Clear the stale match so the request no longer looks "resolved".
    request.matchedLawyerId = undefined;
    request.matchedLawyerProfileId = undefined;
    request.matchedLawyerName = undefined;
    request.matchedAt = undefined;
    request.consultationId = undefined;
    // If there's still someone left on the shortlist, let the citizen pick immediately;
    // otherwise fall back to "unassigned" so admin/auto-suggest can offer new candidates.
    request.status = request.recommendedLawyers.length > 0 ? 'recommended' : 'unassigned';
    request.timeline.push({
        time: new Date(),
        label: 'Lawyer declined consultation — case reopened for reselection',
        note: reason,
    });
    await request.save();
    return request;
}
/**
 * POST /consultations/lawyer/:id/messages
 * Lawyer sends a message inside the consultation transcript.
 */
async function sendLawyerMessage(consultationId, lawyerId, text) {
    const consult = await Consultation_model_1.ConsultationModel.findOne({
        _id: consultationId,
        lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
    });
    if (!consult)
        throw new error_1.AppError('Consultation not found', 404, 'NOT_FOUND');
    const user = await User_model_1.UserModel.findById(lawyerId);
    const senderName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Lawyer';
    const message = {
        id: new mongoose_1.Types.ObjectId().toString(),
        conversationId: consultationId,
        sender: 'lawyer',
        senderRole: 'lawyer',
        senderName,
        senderId: new mongoose_1.Types.ObjectId(lawyerId),
        text,
        body: text,
        time: new Date(),
        read: false,
        isRead: false,
        isDeleted: false,
    };
    consult.transcript.push(message);
    await consult.save();
    // Notify citizen of new message
    await notification_1.default.saveAndSendNotification({
        userId: consult.citizenId.toString(),
        title: '💬 New Message from Lawyer',
        body: `${senderName} sent you a message: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`,
        type: 'message_received',
        clickUrl: `/consultations/${consultationId}`,
        priority: 'high'
    }, 'user', { push_notification: true });
    return { message, consultationId };
}
/**
 * POST /consultations/lawyer/:id/complete
 * Lawyer marks the consultation as completed.
 */
async function completeConsultation(consultationId, lawyerId) {
    const consult = await Consultation_model_1.ConsultationModel.findOne({
        _id: consultationId,
        lawyerId: new mongoose_1.Types.ObjectId(lawyerId),
        status: 'active',
    });
    if (!consult)
        throw new error_1.AppError('Active consultation not found', 404, 'NOT_FOUND');
    consult.status = 'completed';
    consult.completedAt = new Date();
    consult.timeline.push({ time: new Date(), label: 'Consultation marked complete by lawyer' });
    await consult.save();
    // Increment lawyer consultation count
    await LawyerProfile_model_1.LawyerProfileModel.findByIdAndUpdate(consult.lawyerProfileId, {
        $inc: { consultationCount: 1 },
    });
    // Notify citizen of completion
    await notification_1.default.saveAndSendNotification({
        userId: consult.citizenId.toString(),
        title: '✅ Consultation Completed',
        body: 'Your consultation has been marked as completed. Please leave a review!',
        type: 'consultation_completed',
        clickUrl: `/consultations/${consultationId}`,
        priority: 'high'
    }, 'user', { push_notification: true });
    // Notify lawyer
    await notification_1.default.saveAndSendNotification({
        userId: lawyerId,
        title: '✅ Consultation Completed',
        body: `You have successfully completed consultation ${consultationId}.`,
        type: 'consultation_completed',
        clickUrl: `/consultations/${consultationId}`,
        priority: 'medium'
    }, 'user', { push_notification: true });
    return formatConsultation(consult);
}
// ─── MATCH REQUEST SERVICES (Lawyer-facing) ───────────────────────────────────
/**
 * GET /consultations/matches
 * Match requests visible to a lawyer — only cases the firm has specifically
 * recommended them for (the old "browse the open pool" behaviour is retired
 * now that the firm reviews and shortlists cases before a lawyer ever sees them).
 */
async function getMatchRequestsForLawyer(lawyerId, params = {}) {
    const { status, search, page = 1, pageSize = 20, urgency } = params;
    const profile = await LawyerProfile_model_1.LawyerProfileModel.findOne({ userId: new mongoose_1.Types.ObjectId(lawyerId) });
    if (!profile)
        throw new error_1.AppError('Lawyer profile not found', 404, 'NOT_FOUND');
    const filter = {
        'recommendedLawyers.lawyerId': new mongoose_1.Types.ObjectId(lawyerId),
        status: status && status !== 'all' ? status : { $in: ['recommended', 'matched'] },
    };
    if (urgency)
        filter.urgency = { $regex: urgency, $options: 'i' };
    if (search?.trim()) {
        filter.$or = [
            { specialism: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }
    const skip = (page - 1) * pageSize;
    const [requests, total] = await Promise.all([
        Consultation_model_1.LawyerRequestModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .populate('citizenId', 'firstName lastName fullName email state')
            .populate('specialism'),
        Consultation_model_1.LawyerRequestModel.countDocuments(filter),
    ]);
    const data = requests.map(mapMatchRequestToDTO);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
// ─── CITIZEN MATCH REQUEST SERVICES ──────────────────────────────────────────
/**
 * GET /consultations/citizen/match-requests
 */
async function getMatchRequestsForCitizen(citizenId, params = {}) {
    const { status, search, page = 1, pageSize = 20 } = params;
    const filter = { citizenId: new mongoose_1.Types.ObjectId(citizenId) };
    if (status && status !== 'all')
        filter.status = status;
    if (search?.trim())
        filter.$or = [{ specialism: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
    const skip = (page - 1) * pageSize;
    const [requests, total] = await Promise.all([
        Consultation_model_1.LawyerRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).populate('citizenId', 'firstName lastName fullName email phone state'),
        Consultation_model_1.LawyerRequestModel.countDocuments(filter),
    ]);
    return { data: requests.map(mapMatchRequestToDTO), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
/**
 * GET /consultations/citizen/match-requests/:id
 */
async function getMatchRequestForCitizen(matchRequestId, citizenId) {
    const request = await Consultation_model_1.LawyerRequestModel.findById(matchRequestId).populate('citizenId', 'firstName lastName fullName email phone state').populate('matchedLawyerId', 'firstName lastName avatarUrl');
    if (!request)
        throw new error_1.AppError('Match request not found', 404, 'NOT_FOUND');
    const citizen = request.citizenId;
    if (citizen._id.toString() !== citizenId)
        throw new error_1.AppError('You do not have access to this request', 403, 'FORBIDDEN');
    return mapMatchRequestToDTO(request);
}
/**
 * POST /consultations/citizen/match-requests/:id/documents
 * A citizen attaching supporting documents, either at intake or afterwards.
 */
async function addCitizenMatchDocument(matchRequestId, citizenId, input) {
    const request = await Consultation_model_1.LawyerRequestModel.findById(matchRequestId);
    if (!request)
        throw new error_1.AppError('Match request not found', 404, 'NOT_FOUND');
    if (request.citizenId.toString() !== citizenId)
        throw new error_1.AppError('You do not have access to this request', 403, 'FORBIDDEN');
    const doc = await uploadDocument(input, 'citizen', `match-requests/${citizenId}`);
    request.documents.push(doc);
    request.timeline.push({ time: new Date(), label: 'Document attached by citizen', note: doc.name });
    await request.save();
    return mapMatchRequestToDTO(request);
}
/**
 * POST /consultations/citizen/match-requests/:id/select-lawyer
 * The citizen picks a lawyer from their recommended shortlist. This finalizes
 * the match and creates the paid consultation (mirroring the direct-booking flow).
 */
async function citizenSelectRecommendedLawyer(matchRequestId, citizenId, citizenName, lawyerProfileId) {
    const request = await Consultation_model_1.LawyerRequestModel.findById(matchRequestId);
    if (!request)
        throw new error_1.AppError('Match request not found', 404, 'NOT_FOUND');
    if (request.citizenId.toString() !== citizenId)
        throw new error_1.AppError('You do not have access to this request', 403, 'FORBIDDEN');
    if (request.status === 'matched')
        throw new error_1.AppError('This request has already been matched', 400, 'INVALID_STATUS');
    if (request.status !== 'recommended')
        throw new error_1.AppError('No recommendations are available to choose from yet', 400, 'INVALID_STATUS');
    console.log(request, request.recommendedLawyers, lawyerProfileId);
    if ((request.rejectedLawyers ?? []).map(String).includes(lawyerProfileId)) {
        throw new error_1.AppError('This lawyer already declined your case — please choose a different lawyer', 400, 'INVALID_SELECTION');
    }
    const suggestions = await getAutoSuggestedLawyers(matchRequestId);
    const chosen = suggestions.find((l) => l?.id === lawyerProfileId);
    if (!chosen)
        throw new error_1.AppError('That lawyer is not part of your recommended shortlist', 400, 'INVALID_SELECTION');
    const profile = await LawyerProfile_model_1.LawyerProfileModel.findById(lawyerProfileId);
    if (!profile)
        throw new error_1.AppError('Lawyer not found', 404, 'NOT_FOUND');
    request.status = 'matched';
    request.matchedLawyerId = chosen.lawyerId;
    request.matchedLawyerProfileId = profile._id;
    request.matchedLawyerName = chosen.name;
    request.matchedAt = new Date();
    request.timeline.push({ time: new Date(), label: `Citizen selected ${chosen.name}` });
    await request.save();
    const book = await bookConsultation(citizenId, citizenName, {
        lawyerScnNumber: profile.scnNumber,
        mode: request.mode,
        topic: request.topic || request.specialism,
        description: [request.description, request.notes].filter(Boolean).join('\n\n'),
        receiptId: request.receiptId,
        requestId: matchRequestId,
        waiver: request.waiver,
    });
    request.consultationId = book.consultationId;
    await request.save();
    // Notify the selected lawyer
    await notification_1.default.saveAndSendNotification({
        userId: chosen.lawyerId,
        title: '👤 Citizen Selected You!',
        body: `${citizenName} has selected you for their case. Consultation is now active.`,
        type: 'lawyer_selected',
        clickUrl: `/consultations/${book.consultationId}`,
        priority: 'high'
    }, 'user', { push_notification: true });
    return { book, ...mapMatchRequestToDTO(request) };
}
// ─── UTILITY SERVICES ─────────────────────────────────────────────────────────
/**
 * GET /consultations/statuses/:role
 * Returns filterable status options with live counts.
 */
async function getAvailableStatuses(role, userId) {
    const statuses = ['pending', 'paid', 'processing', 'awaiting_lawyer', 'active', 'completed', 'disputed', 'cancelled', 'refunded'];
    const filter = {};
    if (role === 'citizen' && userId)
        filter.citizenId = new mongoose_1.Types.ObjectId(userId);
    if (role === 'lawyer' && userId)
        filter.lawyerId = new mongoose_1.Types.ObjectId(userId);
    const counts = await Consultation_model_1.ConsultationModel.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map(c => [c._id, c.count]));
    const labelMap = {
        pending: 'Pending Payment',
        paid: 'Paid',
        processing: 'Processing',
        awaiting_lawyer: 'Awaiting Lawyer',
        active: 'Active',
        completed: 'Completed',
        disputed: 'Disputed',
        cancelled: 'Cancelled',
        refunded: 'Refunded',
    };
    return statuses.map(s => ({ value: s, label: labelMap[s] || s, count: countMap.get(s) || 0 }));
}
// ─── ADMIN SERVICES ───────────────────────────────────────────────────────────
/**
 * Admin: List consultations (all) with full filters.
 */
async function listConsultations(params = {}) {
    const { status, mode, search, page = 1, pageSize = 20, startDate, endDate, citizenId, lawyerId, disputed, flagged } = params;
    const filter = {};
    if (status && status !== 'all')
        filter.status = status;
    if (mode && mode !== 'all')
        filter.mode = mode;
    if (citizenId)
        filter.citizenId = new mongoose_1.Types.ObjectId(citizenId);
    if (lawyerId)
        filter.lawyerId = new mongoose_1.Types.ObjectId(lawyerId);
    if (disputed !== undefined)
        filter.disputed = disputed;
    if (flagged !== undefined)
        filter.flagged = flagged;
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate)
            filter.createdAt.$gte = new Date(startDate);
        if (endDate)
            filter.createdAt.$lte = new Date(endDate);
    }
    if (search?.trim()) {
        const citizenUsers = await User_model_1.UserModel.find({ $text: { $search: search.trim() }, role: 'citizen' }, { _id: 1 });
        const citizenIds = citizenUsers.map(u => u._id);
        const lawyerProfiles = await LawyerProfile_model_1.LawyerProfileModel.find({ $text: { $search: search.trim() } }, { userId: 1 });
        const lawyerIds = lawyerProfiles.map(p => p.userId);
        const orConditions = [{ topic: { $regex: search, $options: 'i' } }];
        if (citizenIds.length)
            orConditions.push({ citizenId: { $in: citizenIds } });
        if (lawyerIds.length)
            orConditions.push({ lawyerId: { $in: lawyerIds } });
        filter.$or = orConditions;
    }
    const skip = (page - 1) * pageSize;
    const [consultations, total] = await Promise.all([
        Consultation_model_1.ConsultationModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .populate('citizenId', 'firstName lastName fullName email state')
            .populate('lawyerId', 'firstName lastName fullName email')
            .populate('lawyerProfileId'),
        Consultation_model_1.ConsultationModel.countDocuments(filter),
    ]);
    const data = await Promise.all(consultations.map(formatConsultation));
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
/**
 * Admin: Get single consultation by ID (no ownership check).
 */
async function getConsultationById(consultationId) {
    const consult = await Consultation_model_1.ConsultationModel.findById(consultationId)
        .populate('citizenId', '_id firstName lastName fullName email state phone')
        .populate('lawyerId', 'firstName lastName fullName email')
        .populate('lawyerProfileId');
    if (!consult)
        throw new error_1.AppError('Consultation not found', 404, 'NOT_FOUND');
    return formatConsultation(consult);
}
/**
 * Admin: Aggregate consultation statistics.
 */
async function getConsultationStats() {
    const [total, active, disputed, completed, pendingPayment, awaitingLawyer, cancelled, refunded] = await Promise.all([
        Consultation_model_1.ConsultationModel.countDocuments(),
        Consultation_model_1.ConsultationModel.countDocuments({ status: { $in: ['active', 'awaiting_lawyer'] } }),
        Consultation_model_1.ConsultationModel.countDocuments({ disputed: true }),
        Consultation_model_1.ConsultationModel.countDocuments({ status: 'completed' }),
        Consultation_model_1.ConsultationModel.countDocuments({ status: 'pending' }),
        Consultation_model_1.ConsultationModel.countDocuments({ status: 'awaiting_lawyer' }),
        Consultation_model_1.ConsultationModel.countDocuments({ status: 'cancelled' }),
        Consultation_model_1.ConsultationModel.countDocuments({ status: 'refunded' }),
    ]);
    const revenueAgg = await Consultation_model_1.ConsultationModel.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$feePaid' }, platformRevenue: { $sum: { $multiply: ['$feePaid', 0.15] } }, lawyerPayout: { $sum: { $multiply: ['$feePaid', 0.85] } } } },
    ]);
    return {
        total, active, disputed, completed, pendingPayment, awaitingLawyer, cancelled, refunded,
        totalRevenue: revenueAgg[0]?.totalRevenue || 0,
        platformRevenue: revenueAgg[0]?.platformRevenue || 0,
        lawyerPayoutTotal: revenueAgg[0]?.lawyerPayout || 0,
    };
}
/**
 * Admin: List all disputed consultations.
 */
async function listDisputes(params = {}) {
    const { status, page = 1, pageSize = 20 } = params;
    const filter = { disputed: true };
    if (status === 'pending')
        filter.disputeResolvedAt = { $exists: false };
    if (status === 'resolved')
        filter.disputeResolvedAt = { $exists: true };
    const skip = (page - 1) * pageSize;
    const [consultations, total] = await Promise.all([
        Consultation_model_1.ConsultationModel.find(filter)
            .sort({ disputeRaisedAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .populate('citizenId', 'firstName lastName fullName email')
            .populate('lawyerId', 'firstName lastName fullName email')
            .populate('lawyerProfileId'),
        Consultation_model_1.ConsultationModel.countDocuments(filter),
    ]);
    const data = await Promise.all(consultations.map(formatConsultation));
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
/**
 * Admin: List all refund requests.
 */
async function listRefundRequests(params = {}) {
    const { status, page = 1, pageSize = 20 } = params;
    const filter = { refundRequested: true };
    if (status === 'pending')
        filter.refundApproved = { $exists: false };
    if (status === 'approved')
        filter.refundApproved = true;
    if (status === 'rejected')
        filter.refundApproved = false;
    const skip = (page - 1) * pageSize;
    const [consultations, total] = await Promise.all([
        Consultation_model_1.ConsultationModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .populate('citizenId', 'firstName lastName fullName email')
            .populate('lawyerId', 'firstName lastName fullName email')
            .populate('lawyerProfileId'),
        Consultation_model_1.ConsultationModel.countDocuments(filter),
    ]);
    const data = await Promise.all(consultations.map(formatConsultation));
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
/**
 * Admin: List all flagged consultations.
 */
async function listFlaggedConsultations(params = {}) {
    const { severity, resolved, page = 1, pageSize = 20 } = params;
    const filter = { flagged: true };
    if (severity)
        filter.flagSeverity = severity;
    if (resolved !== undefined)
        filter.flagResolved = resolved;
    const skip = (page - 1) * pageSize;
    const [consultations, total] = await Promise.all([
        Consultation_model_1.ConsultationModel.find(filter)
            .sort({ flaggedAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .populate('citizenId', 'firstName lastName fullName email')
            .populate('lawyerId', 'firstName lastName fullName email')
            .populate('lawyerProfileId'),
        Consultation_model_1.ConsultationModel.countDocuments(filter),
    ]);
    const data = await Promise.all(consultations.map(formatConsultation));
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
/**
 * Admin: Update consultation status.
 */
async function updateConsultationStatus(consultationId, payload, admin) {
    const consultation = await Consultation_model_1.ConsultationModel.findById(consultationId);
    if (!consultation)
        throw new error_1.AppError('Consultation not found', 404, 'NOT_FOUND');
    const oldStatus = consultation.status;
    consultation.status = payload.status;
    if (payload.status === 'completed')
        consultation.completedAt = new Date();
    consultation.timeline.push({ time: new Date(), label: `Status changed to ${payload.status}`, note: payload.note || `Changed by admin: ${admin.adminName}` });
    await consultation.save();
    Admin_model_1.AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: types_1.AuditAction.CONSULTATION_STATUS_CHANGED, targetType: 'consultation', targetId: consultation._id, meta: { from: oldStatus, to: payload.status, note: payload.note } }).catch(() => null);
    return getConsultationById(consultationId);
}
/**
 * Admin: Resolve a dispute.
 */
async function resolveDispute(consultationId, payload, admin) {
    const consultation = await Consultation_model_1.ConsultationModel.findById(consultationId);
    if (!consultation)
        throw new error_1.AppError('Consultation not found', 404, 'NOT_FOUND');
    if (!consultation.disputed)
        throw new error_1.AppError('This consultation is not disputed', 400, 'NOT_DISPUTED');
    consultation.disputed = false;
    consultation.disputeResolvedAt = new Date();
    consultation.disputeResolution = payload.reason;
    if (payload.decision === 'citizen' && payload.refundAmount) {
        consultation.status = 'refunded';
        consultation.refundApproved = true;
        consultation.refundedAt = new Date();
    }
    consultation.timeline.push({ time: new Date(), label: `Dispute resolved in favor of ${payload.decision}`, note: payload.reason });
    await consultation.save();
    // Notify citizen of dispute resolution
    await notification_1.default.saveAndSendNotification({
        userId: consultation.citizenId.toString(),
        title: '⚖️ Dispute Resolved',
        body: `Your dispute has been resolved in favor of ${payload.decision}. ${payload.reason}`,
        type: 'dispute_resolved',
        clickUrl: `/consultations/${consultationId}`,
        priority: 'high'
    }, 'user', { push_notification: true, email_notification: true });
    // Notify lawyer of dispute resolution
    await notification_1.default.saveAndSendNotification({
        userId: consultation.lawyerId.toString(),
        title: '⚖️ Dispute Resolved',
        body: `The dispute on consultation ${consultationId} has been resolved in favor of ${payload.decision}.`,
        type: 'dispute_resolved',
        clickUrl: `/consultations/${consultationId}`,
        priority: 'high'
    }, 'user', { push_notification: true, email_notification: true });
    Admin_model_1.AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: types_1.AuditAction.DISPUTE_RESOLVED, targetType: 'consultation', targetId: consultation._id, meta: { decision: payload.decision, reason: payload.reason } }).catch(() => null);
    return getConsultationById(consultationId);
}
/**
 * Admin: Flag consultation for review.
 */
async function flagConsultation(consultationId, payload, admin) {
    const consultation = await Consultation_model_1.ConsultationModel.findById(consultationId);
    if (!consultation)
        throw new error_1.AppError('Consultation not found', 404, 'NOT_FOUND');
    consultation.flagged = true;
    consultation.flagReason = payload.reason;
    consultation.flaggedAt = new Date();
    consultation.flaggedBy = new mongoose_1.Types.ObjectId(admin.adminId);
    consultation.flagSeverity = payload.severity;
    consultation.timeline.push({ time: new Date(), label: 'Flagged for quality review', note: payload.reason });
    await consultation.save();
    Admin_model_1.AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: types_1.AuditAction.CONSULTATION_FLAGGED, targetType: 'consultation', targetId: consultation._id, meta: { reason: payload.reason, severity: payload.severity } }).catch(() => null);
    return getConsultationById(consultationId);
}
/**
 * Admin: Approve or reject a refund request.
 */
async function approveRefund(consultationId, payload, admin) {
    const consultation = await Consultation_model_1.ConsultationModel.findById(consultationId);
    if (!consultation)
        throw new error_1.AppError('Consultation not found', 404, 'NOT_FOUND');
    if (!consultation.refundRequested)
        throw new error_1.AppError('No refund requested for this consultation', 400, 'NO_REFUND_REQUESTED');
    consultation.refundApproved = payload.approved;
    if (payload.approved) {
        consultation.status = 'refunded';
        consultation.refundedAt = new Date();
    }
    consultation.timeline.push({ time: new Date(), label: payload.approved ? 'Refund approved' : 'Refund rejected', note: payload.adminNote });
    await consultation.save();
    // Notify citizen of refund decision
    await notification_1.default.saveAndSendNotification({
        userId: consultation.citizenId.toString(),
        title: payload.approved ? '💰 Refund Approved' : '❌ Refund Rejected',
        body: payload.approved
            ? `Your refund request has been approved. Amount: ₦${consultation.feePaid || 0}`
            : `Your refund request has been rejected. ${payload.adminNote || ''}`,
        type: 'refund_decision',
        clickUrl: `/consultations/${consultationId}`,
        priority: 'high'
    }, 'user', { push_notification: true, email_notification: true });
    Admin_model_1.AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: payload.approved ? types_1.AuditAction.REFUND_APPROVED : types_1.AuditAction.REFUND_REJECTED, targetType: 'consultation', targetId: consultation._id, meta: { approved: payload.approved, note: payload.adminNote } }).catch(() => null);
    return getConsultationById(consultationId);
}
/**
 * Admin: Send warning to lawyer.
 */
async function sendLawyerWarning(consultationId, lawyerId, reason, admin) {
    const consultation = await Consultation_model_1.ConsultationModel.findById(consultationId);
    if (!consultation)
        throw new error_1.AppError('Consultation not found', 404, 'NOT_FOUND');
    Admin_model_1.AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: types_1.AuditAction.LAWYER_WARNING_SENT, targetType: 'lawyer', targetId: lawyerId, meta: { consultationId, reason } }).catch(() => null);
    console.log(`[WARNING] Lawyer ${lawyerId} warned for consultation ${consultationId}: ${reason}`);
    return { message: 'Warning sent successfully' };
}
/**
 * Admin: Bulk action on consultations.
 */
async function bulkAction(consultationIds, action, reason, admin) {
    const results = [];
    for (const id of consultationIds) {
        try {
            const consultation = await Consultation_model_1.ConsultationModel.findById(id);
            if (!consultation)
                continue;
            switch (action) {
                case 'flag':
                    consultation.flagged = true;
                    consultation.flagReason = reason;
                    consultation.flaggedAt = new Date();
                    consultation.flaggedBy = new mongoose_1.Types.ObjectId(admin.adminId);
                    break;
                case 'refund':
                    consultation.refundRequested = true;
                    consultation.refundReason = reason;
                    break;
                case 'cancel':
                    consultation.status = 'cancelled';
                    consultation.cancelReason = reason;
                    consultation.cancelledBy = 'system';
                    break;
            }
            consultation.timeline.push({ time: new Date(), label: `Bulk action: ${action}`, note: reason });
            await consultation.save();
            results.push(id);
        }
        catch (err) {
            console.error(`Failed to process consultation ${id}:`, err);
        }
    }
    Admin_model_1.AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: types_1.AuditAction.BULK_ACTION, targetType: 'consultation', targetId: null, meta: { action, reason, count: results.length, ids: consultationIds } }).catch(() => null);
    return { success: true, message: `${results.length} consultations processed`, affectedCount: results.length, consultationIds: results };
}
/**
 * Admin: Export consultations.
 */
async function exportConsultations(params) {
    const { data } = await listConsultations({ ...params, pageSize: 10000 });
    const headers = ['ID', 'Citizen', 'Lawyer', 'Topic', 'Mode', 'Status', 'Fee', 'Created At', 'Completed At', 'Rating', 'Disputed', 'Flagged'];
    const rows = data.map((c) => [c.id, c.citizen?.name, c.lawyer?.name, c.topic, c.mode, c.status, c.fee, c.createdAt, c.completedAt || '', c.rating || '', c.disputed ? 'Yes' : 'No', c.flagged ? 'Yes' : 'No']);
    return { headers, rows };
}
// ─── ADMIN MATCH REQUEST SERVICES ────────────────────────────────────────────
/**
 * GET /admin/consultations/match-requests
 */
async function listMatchRequests(params = {}) {
    const { status, search, page = 1, pageSize = 20, urgency } = params;
    const filter = {};
    if (status && status !== 'all')
        filter.status = status;
    if (urgency)
        filter.urgency = { $regex: urgency, $options: 'i' };
    if (search?.trim())
        filter.$or = [{ specialism: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
    const skip = (page - 1) * pageSize;
    const [requests, total] = await Promise.all([
        Consultation_model_1.LawyerRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).populate('citizenId', 'firstName lastName fullName email phone state').populate('specialism'),
        Consultation_model_1.LawyerRequestModel.countDocuments(filter),
    ]);
    return { data: requests.map(mapMatchRequestToDTO), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
/**
 * GET /admin/consultations/match-requests/:id
 */
async function getMatchRequestById(matchRequestId) {
    const request = await Consultation_model_1.LawyerRequestModel.findById(matchRequestId).populate('citizenId', 'firstName lastName fullName email phone state').populate('specialism');
    if (!request)
        throw new error_1.AppError('Match request not found', 404, 'NOT_FOUND');
    return mapMatchRequestToDTO(request);
}
/**
 * POST /admin/consultations/match-requests/:id/accept
 * Admin picks up a request and begins reviewing it. This is the entry point into
 * the firm-assisted flow: pending/unassigned -> in_review.
 */
async function adminAcceptMatchRequest(matchRequestId, admin) {
    const request = await Consultation_model_1.LawyerRequestModel.findById(matchRequestId);
    if (!request)
        throw new error_1.AppError('Match request not found', 404, 'NOT_FOUND');
    if (!['pending', 'unassigned'].includes(request.status)) {
        throw new error_1.AppError('This request has already been picked up', 400, 'INVALID_STATUS');
    }
    request.status = 'in_review';
    request.handledByAdminId = new mongoose_1.Types.ObjectId(admin.adminId);
    request.handledByAdminName = admin.adminName;
    request.timeline.push({ time: new Date(), label: 'Accepted for review', note: `By ${admin.adminName}` });
    await request.save();
    Admin_model_1.AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: types_1.AuditAction.MATCH_ACCEPTED, targetType: 'match_request', targetId: request._id }).catch(() => null);
    return getMatchRequestById(matchRequestId);
}
/* POST /admin/consultations/match-requests/:id/message */
async function updateCitizenMatchStatus(matchRequestId, newStatus, admin) {
    const request = await Consultation_model_1.LawyerRequestModel.findById(matchRequestId);
    if (!request)
        throw new error_1.AppError('Match request not found', 404, 'NOT_FOUND');
    request.status = newStatus;
    request.handledByAdminId = new mongoose_1.Types.ObjectId(admin.adminId);
    request.handledByAdminName = admin.adminName;
    request.timeline.push({ time: new Date(), label: `Status updated to ${newStatus}`, note: `By ${admin.adminName}` });
    await request.save();
    Admin_model_1.AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: types_1.AuditAction.MATCH_UPDATED, targetType: 'match_request', targetId: request._id }).catch(() => null);
    await autoSuggestAndRecommend(matchRequestId, admin, 30);
    return mapMatchRequestToDTO(request);
}
/**
 * POST /admin/consultations/match-requests/:id/message
 * Admin conducts the initial (message-mode) consultation themselves, before
 * recommending lawyers.
 */
async function sendAdminMatchMessage(matchRequestId, admin, message) {
    const request = await Consultation_model_1.LawyerRequestModel.findById(matchRequestId);
    if (!request)
        throw new error_1.AppError('Match request not found', 404, 'NOT_FOUND');
    if (request.status === 'matched')
        throw new error_1.AppError('This request has already been matched', 400, 'INVALID_STATUS');
    request.adminMessage = message;
    request.adminMessageAt = new Date();
    if (['pending', 'unassigned'].includes(request.status)) {
        request.status = 'in_review';
        request.handledByAdminId = new mongoose_1.Types.ObjectId(admin.adminId);
        request.handledByAdminName = admin.adminName;
    }
    request.timeline.push({ time: new Date(), label: 'Consultation message sent', note: `By ${admin.adminName}` });
    await request.save();
    Admin_model_1.AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: types_1.AuditAction.MATCH_MESSAGE_SENT, targetType: 'match_request', targetId: request._id }).catch(() => null);
    return getMatchRequestById(matchRequestId);
}
/**
 * POST /admin/consultations/match-requests/:id/schedule-call
 * Admin organizes a call/video consultation on the firm's behalf.
 */
async function scheduleAdminMatchCall(matchRequestId, admin, payload) {
    const request = await Consultation_model_1.LawyerRequestModel.findById(matchRequestId);
    if (!request)
        throw new error_1.AppError('Match request not found', 404, 'NOT_FOUND');
    if (request.status === 'matched')
        throw new error_1.AppError('This request has already been matched', 400, 'INVALID_STATUS');
    request.scheduledCall = { dateTime: new Date(payload.dateTime), link: payload.link, note: payload.note };
    if (['pending', 'unassigned'].includes(request.status)) {
        request.status = 'in_review';
        request.handledByAdminId = new mongoose_1.Types.ObjectId(admin.adminId);
        request.handledByAdminName = admin.adminName;
    }
    request.timeline.push({ time: new Date(), label: 'Call scheduled', note: `By ${admin.adminName} for ${new Date(payload.dateTime).toLocaleString()}` });
    await request.save();
    Admin_model_1.AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: types_1.AuditAction.MATCH_CALL_SCHEDULED, targetType: 'match_request', targetId: request._id }).catch(() => null);
    return getMatchRequestById(matchRequestId);
}
/**
 * POST /admin/consultations/match-requests/:id/documents
 * Admin attaches a document — a supporting file, or (with isCaseBrief) the firm's
 * refined case brief, stored on its own field as a single link.
 */
async function adminAddMatchDocument(matchRequestId, admin, input) {
    const request = await Consultation_model_1.LawyerRequestModel.findById(matchRequestId);
    if (!request)
        throw new error_1.AppError('Match request not found', 404, 'NOT_FOUND');
    const doc = await uploadDocument(input, 'firm', `match-requests/${request.citizenId.toString()}`);
    if (input.isCaseBrief) {
        if (request.caseBrief?.publicId) {
            cloudinary_1.default.deleteFile(request.caseBrief.fileUrl, 'raw').catch(() => null);
        }
        request.caseBrief = doc;
    }
    else {
        request.documents.push(doc);
    }
    if (['pending', 'unassigned'].includes(request.status)) {
        request.status = 'in_review';
        request.handledByAdminId = new mongoose_1.Types.ObjectId(admin.adminId);
        request.handledByAdminName = admin.adminName;
    }
    request.timeline.push({
        time: new Date(),
        label: input.isCaseBrief ? 'Refined case brief attached' : 'Document attached',
        note: `By ${admin.adminName}: ${doc.name}`,
    });
    await request.save();
    Admin_model_1.AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: types_1.AuditAction.MATCH_DOCUMENT_ADDED, targetType: 'match_request', targetId: request._id, meta: { isCaseBrief: !!input.isCaseBrief } }).catch(() => null);
    return getMatchRequestById(matchRequestId);
}
/**
 * GET /admin/consultations/match-requests/:id/suggestions
 * "Auto-suggest" — ranks verified, available lawyers who fit the case, WITHOUT
 * assigning anyone. The admin reviews this list (or picks manually) and then
 * calls recommendLawyersForMatch to actually send a shortlist to the citizen.
 * This replaces the old "auto-match" behaviour, which used to book a
 * consultation with the top match automatically — the citizen no longer gets
 * skipped over.
 */
async function getAutoSuggestedLawyers(matchRequestId, limit = 5) {
    const request = await Consultation_model_1.LawyerRequestModel.findById(matchRequestId);
    if (!request)
        throw new error_1.AppError('Match request not found', 404, 'NOT_FOUND');
    const recommendedLawyerIds = (request.recommendedLawyers ?? []).map((id) => new mongoose_1.Types.ObjectId(String(id)));
    const rejectedLawyerIds = new Set((request.rejectedLawyers ?? []).map((id) => String(id)));
    const candidates = await LawyerProfile_model_1.LawyerProfileModel.find({
        verificationStatus: types_1.VerificationStatus.VERIFIED,
        isAvailable: true,
        specialisms: { $in: [request.specialism] },
        _id: { $nin: Array.from(rejectedLawyerIds, id => new mongoose_1.Types.ObjectId(id)) },
    })
        .sort({ ratingAvg: -1 })
        .limit(limit * 3)
        .populate('userId', 'firstName lastName fullName avatarUrl');
    const recommendedCandidates = await LawyerProfile_model_1.LawyerProfileModel.find({
        _id: { $in: recommendedLawyerIds },
    })
        .sort({ ratingAvg: -1 })
        .limit(limit * 3)
        .populate('userId', 'firstName lastName fullName avatarUrl');
    const fitting = candidates.slice(0, limit);
    const finalCandidates = [...recommendedCandidates, ...fitting.filter(c => !recommendedCandidates.some(rc => rc._id.equals(c._id)))]
        .filter(c => !rejectedLawyerIds.has(c._id.toString()));
    return finalCandidates.map(profile => {
        const ref = toRecommendedLawyerRef(profile);
        // console.log(ref)
        return {
            ...ref,
            id: ref.lawyerProfileId.toString(),
            lawyerId: ref.lawyerId.toString(),
            ratingAvg: profile.ratingAvg,
            responseTimeLabel: profile.responseTimeLabel,
            fee: profile.fees?.[request.mode],
        };
    });
}
/**
 * POST /admin/consultations/match-requests/:id/recommend
 * Admin sends a shortlist of lawyers to the citizen — whether hand-picked or
 * taken from the auto-suggested list. The citizen then picks who to work with.
 */
async function recommendLawyersForMatch(matchRequestId, admin, lawyerProfileIds) {
    if (!lawyerProfileIds?.length)
        throw new error_1.AppError('Select at least one lawyer to recommend', 400, 'VALIDATION_ERROR');
    const request = await Consultation_model_1.LawyerRequestModel.findById(matchRequestId);
    if (!request)
        throw new error_1.AppError('Match request not found', 404, 'NOT_FOUND');
    if (request.status === 'matched')
        throw new error_1.AppError('This request has already been matched', 400, 'INVALID_STATUS');
    console.log({ lawyerProfileIds });
    request.recommendedLawyers = lawyerProfileIds;
    request.status = 'recommended';
    if (!request.handledByAdminId) {
        request.handledByAdminId = new mongoose_1.Types.ObjectId(admin.adminId);
        request.handledByAdminName = admin.adminName;
    }
    request.timeline.push({ time: new Date(), label: `Recommended ${lawyerProfileIds.length} lawyer(s) to citizen`, note: `By ${admin.adminName}` });
    await request.save();
    Admin_model_1.AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: types_1.AuditAction.MATCH_RECOMMENDED, targetType: 'match_request', targetId: request._id, meta: { lawyerProfileIds } }).catch(() => null);
    return getMatchRequestById(matchRequestId);
}
/**
 * POST /admin/consultations/match-requests/:id/assign
 * Admin directly assigns one specific lawyer, skipping the citizen's choice —
 * an override for edge cases (e.g. handling things over the phone).
 */
async function assignLawyerToMatch(matchRequestId, lawyerId, admin) {
    const request = await Consultation_model_1.LawyerRequestModel.findById(matchRequestId).populate('citizenId');
    if (!request)
        throw new error_1.AppError('Match request not found', 404, 'NOT_FOUND');
    if (request.status === 'matched')
        throw new error_1.AppError('This request has already been matched', 400, 'INVALID_STATUS');
    const profile = await LawyerProfile_model_1.LawyerProfileModel.findById(lawyerId).populate('userId', 'firstName lastName fullName');
    if (!profile)
        throw new error_1.AppError('Lawyer not found', 404, 'NOT_FOUND');
    if ((request.rejectedLawyers ?? []).map(String).includes(profile._id.toString())) {
        throw new error_1.AppError('This lawyer already declined this case — assign a different lawyer', 400, 'INVALID_SELECTION');
    }
    const user = profile.userId;
    const lawyerName = user?.fullName || `${user?.firstName} ${user?.lastName}`;
    const citizen = request.citizenId;
    const citizenName = citizen?.fullName || `${citizen?.firstName} ${citizen?.lastName}` || 'Unknown';
    request.status = 'matched';
    request.matchedLawyerId = profile.userId;
    request.matchedLawyerProfileId = profile._id;
    request.matchedLawyerName = lawyerName;
    request.matchedAt = new Date();
    request.timeline.push({ time: new Date(), label: `Matched with ${lawyerName}`, note: `Assigned by admin: ${admin.adminName}` });
    await request.save();
    Admin_model_1.AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: types_1.AuditAction.MATCH_ASSIGNED, targetType: 'match_request', targetId: request._id, meta: { lawyerId, lawyerName } }).catch(() => null);
    const book = await bookConsultation(citizen._id.toString(), citizenName, {
        lawyerScnNumber: profile.scnNumber,
        mode: request.mode,
        topic: request.topic || request.specialism,
        description: [request.description, request.notes].filter(Boolean).join('\n\n'),
    });
    request.consultationId = book.consultationId;
    await request.save();
    return { book, ...(await getMatchRequestById(matchRequestId)) };
}
/**
 * POST /admin/consultations/match-requests/bulk-auto-match (kept for backward compatibility;
 * now performs a bulk AUTO-SUGGEST + recommend instead of an immediate auto-booking).
 * For every unreviewed request, computes the best-fit lawyers and sends that
 * shortlist straight to the citizen — nobody gets booked without the citizen choosing.
 */
async function bulkAutoSuggestAndRecommend(admin, limitPerRequest = 3) {
    const pending = await Consultation_model_1.LawyerRequestModel.find({ status: { $in: ['pending', 'unassigned'] }, expiresAt: { $gt: new Date() } });
    const results = { recommended: 0, failed: [] };
    for (const req of pending) {
        try {
            const suggestions = await getAutoSuggestedLawyers(req._id.toString(), limitPerRequest);
            if (!suggestions.length)
                throw new Error('No matching lawyers found');
            await recommendLawyersForMatch(req._id.toString(), admin, suggestions.map(s => s.id));
            results.recommended++;
        }
        catch {
            results.failed.push(req._id.toString());
        }
    }
    return { success: true, recommendedCount: results.recommended, failedIds: results.failed };
}
/**
 * POST /admin/consultations/match-requests/:id/auto-suggest
 * Quick action for a single request: computes best-fit lawyers and immediately
 * sends that shortlist to the citizen (combines getAutoSuggestedLawyers +
 * recommendLawyersForMatch). This is the direct replacement for the old
 * "auto-match" quick action — the citizen still picks who to work with.
 */
async function autoSuggestAndRecommend(matchRequestId, admin, limit = 3) {
    const suggestions = await getAutoSuggestedLawyers(matchRequestId, limit);
    if (!suggestions.length) {
        throw new error_1.AppError("We couldn't find any lawyers that fit this case right now.", 404, 'NO_LAWYER_AVAILABLE');
    }
    return recommendLawyersForMatch(matchRequestId, admin, suggestions.map(s => s.id));
}
async function expireMatchRequest(matchRequestId, admin) {
    const request = await Consultation_model_1.LawyerRequestModel.findById(matchRequestId);
    if (!request)
        throw new error_1.AppError('Match request not found', 404, 'NOT_FOUND');
    request.status = 'expired';
    request.timeline.push({ time: new Date(), label: 'Request expired', note: `Expired by admin: ${admin.adminName}` });
    await request.save();
    Admin_model_1.AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: types_1.AuditAction.MATCH_EXPIRED, targetType: 'match_request', targetId: request._id }).catch(() => null);
    return getMatchRequestById(matchRequestId);
}
async function consultationPayment(consultationId) {
    const consultation = await getConsultationById(consultationId) || {};
    const consultId = (0, exports.generateConsultId)();
    const paymentGateway = new payment_1.default();
    const paymentReference = paymentGateway.generatePaymentReference(consultId);
    if (!consultation)
        throw new error_1.AppError('Consultation not found', 404, 'NOT_FOUND');
    const paymentData = {
        email: consultation.citizen?.email || "",
        amount: consultation.lawyer?.myPayout[consultation.mode] || 0,
        reference: paymentReference,
        coreId: consultationId.toString(),
        userId: consultation.id,
        description: 'Order Payment',
        phone: consultation.citizen?.phone || '',
        metadata: {
            type: 'purchase',
            coreId: consultationId.toString(),
            orderSlug: consultId,
            redirect: "consultations",
        }
    };
    const paymentResult = await paymentGateway.initializePayment("paystack", paymentData);
    return paymentResult;
}
// ─── LAWYER PERFORMANCE & DASHBOARD ──────────────────────────────────────────
async function getLawyerPerformance(params = {}) {
    const matchFilter = {};
    if (params.startDate)
        matchFilter.createdAt = { $gte: new Date(params.startDate) };
    if (params.endDate)
        matchFilter.createdAt = { ...(matchFilter.createdAt || {}), $lte: new Date(params.endDate) };
    return Consultation_model_1.ConsultationModel.aggregate([
        { $match: matchFilter },
        {
            $group: {
                _id: '$lawyerProfileId',
                totalSessions: { $sum: 1 },
                completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                disputedSessions: { $sum: { $cond: ['$disputed', 1, 0] } },
                totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, { $multiply: ['$feePaid', 0.85] }, 0] } },
                ratingSum: { $sum: { $ifNull: ['$citizenRating', 0] } },
                ratingCount: { $sum: { $cond: [{ $ne: ['$citizenRating', null] }, 1, 0] } },
            },
        },
        { $lookup: { from: 'lawyerprofiles', localField: '_id', foreignField: '_id', as: 'profile' } },
        { $unwind: '$profile' },
        { $lookup: { from: 'users', localField: 'profile.userId', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        {
            $project: {
                lawyerId: '$_id',
                lawyerName: { $ifNull: ['$user.fullName', { $concat: ['$user.firstName', ' ', '$user.lastName'] }] },
                lawyerInitials: { $substrCP: [{ $concat: [{ $substrCP: ['$user.firstName', 0, 1] }, { $substrCP: ['$user.lastName', 0, 1] }] }, 0, 2] },
                lawyerColor: { $ifNull: ['$profile.colorA', '#3B82F6'] },
                scnNumber: '$profile.scnNumber',
                totalSessions: 1,
                completedSessions: 1,
                disputedSessions: 1,
                totalRevenue: 1,
                averageRating: { $cond: [{ $eq: ['$ratingCount', 0] }, 0, { $divide: ['$ratingSum', '$ratingCount'] }] },
            },
        },
        { $addFields: { completionRate: { $cond: [{ $eq: ['$totalSessions', 0] }, 0, { $multiply: [{ $divide: ['$completedSessions', '$totalSessions'] }, 100] }] } } },
        { $sort: { totalSessions: -1 } },
    ]);
}
async function getTopLawyers(limit = 10, sortBy = 'sessions') {
    const all = await getLawyerPerformance();
    const sorted = [...all].sort((a, b) => sortBy === 'revenue' ? b.totalRevenue - a.totalRevenue :
        sortBy === 'rating' ? b.averageRating - a.averageRating :
            b.totalSessions - a.totalSessions);
    return sorted.slice(0, limit);
}
async function getDashboardStats() {
    const [consultationStats, matchAgg, recentActivity] = await Promise.all([
        getConsultationStats(),
        Consultation_model_1.LawyerRequestModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Consultation_model_1.ConsultationModel.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('citizenId', 'firstName lastName fullName')
            .populate('lawyerId', 'firstName lastName fullName'),
    ]);
    const matchStats = { total: 0, unassigned: 0, matching: 0, matched: 0, expired: 0 };
    for (const item of matchAgg) {
        matchStats.total += item.count;
        const key = item._id;
        if (key in matchStats)
            matchStats[key] = item.count;
    }
    const activities = recentActivity.map((c) => ({
        id: c._id,
        type: c.status === 'completed' ? 'consultation_completed' : 'consultation_started',
        description: `${c.citizenId?.fullName || 'A citizen'} ${c.status === 'completed' ? 'completed' : 'started'} a consultation`,
        timestamp: c.createdAt,
    }));
    return { consultations: consultationStats, matchRequests: matchStats, recentActivity: activities };
}
async function getRecentActivity(limit = 20) {
    const consultations = await Consultation_model_1.ConsultationModel.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('citizenId', 'firstName lastName fullName')
        .populate('lawyerId', 'firstName lastName fullName');
    return consultations.map((c) => ({
        id: c._id,
        type: c.status === 'completed' ? 'consultation_completed' : c.disputed ? 'dispute_raised' : 'consultation_started',
        description: `${c.citizenId?.fullName || 'A citizen'} ${c.disputed ? 'raised a dispute' : c.status === 'completed' ? 'completed a consultation' : 'started a consultation'}`,
        timestamp: c.createdAt,
    }));
}
//# sourceMappingURL=consultation.service.js.map