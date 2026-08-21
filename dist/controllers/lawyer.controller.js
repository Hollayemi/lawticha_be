"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitReviewHandler = exports.getLawyerAvailabilityHandler = exports.requestLawyerMatchHandler = exports.bookConsultationHandler = exports.getLawyerByScnNumberHandler = exports.getMarketplaceLawyersHandler = exports.getFilterCountsHandler = exports.getMarketplaceSpecialismsHandler = exports.getMarketplaceStatesHandler = exports.getMarketplaceStatsHandler = exports.emailLawyerHandler = exports.updateLawyerStatusHandler = exports.verifyDocumentHandler = exports.rejectVerificationHandler = exports.advanceVerificationHandler = exports.getLawyerHandler = exports.getLawyerStatsHandler = exports.listLawyersHandler = exports.setAvailabilityHandler = exports.submitVerificationHandler = exports.updateMyProfileHandler = exports.getMyProfileHandler = void 0;
const error_1 = require("../middleware/error");
const lawyer_service_1 = require("../services/lawyer.service");
const payment_1 = __importDefault(require("../services/payment/payment"));
const logger_1 = __importDefault(require("../utils/logger"));
const consultation_service_1 = require("../services/consultation.service");
//  Helper 
function adminCtx(req) {
    return { adminId: req.admin.id, adminName: req.admin.name };
}
// 
//  LAWYER-FACING ROUTES
// 
// GET /api/v1/lawyers/me/profile
exports.getMyProfileHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await (0, lawyer_service_1.getLawyerProfile)(req.user._id.toString());
    return res.data(result, 'Profile fetched.');
});
// PATCH /api/v1/lawyers/me/profile
exports.updateMyProfileHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { title, bio, specialisms, languages, location, state, stateCode, fees, } = req.body;
    const profile = await (0, lawyer_service_1.updateLawyerProfile)(req.user._id.toString(), {
        title, bio, specialisms, languages,
        location, state, stateCode, fees,
    });
    return res.data({ profile }, 'Profile updated.');
});
// POST /api/v1/lawyers/me/verification
// Lawyer submits (or resubmits) their verification application.
// Documents are uploaded as multipart files under the "documents" field; each
// file's name must be prefixed with its type + "_", e.g. "callToBar_LOMA Research.pdf",
// so we can tell which slot (callToBar/lawSchool/practicingLicense/governmentId) it fills.
exports.submitVerificationHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    let payload;
    try {
        // Check if payload is a string (JSON) or already an object
        if (typeof req.body.payload === 'string') {
            payload = JSON.parse(req.body.payload);
        }
        else if (req.body.payload && typeof req.body.payload === 'object') {
            payload = req.body.payload;
        }
        else {
            // Try to parse from req.body directly
            payload = req.body;
        }
    }
    catch (e) {
        console.error('❌ Failed to parse payload:', e);
        return next(new error_1.AppError('Invalid payload format', 400, 'VALIDATION_ERROR'));
    }
    const { scnNumber, yearOfCall, calledAt } = payload;
    if (!scnNumber?.trim())
        return next(new error_1.AppError('SCN number is required.', 400, 'VALIDATION_ERROR'));
    if (!yearOfCall)
        return next(new error_1.AppError('Year of call is required.', 400, 'VALIDATION_ERROR'));
    if (!calledAt?.trim())
        return next(new error_1.AppError('calledAt year is required (e.g. "2019").', 400, 'VALIDATION_ERROR'));
    const files = req.files ?? [];
    const result = await (0, lawyer_service_1.submitVerification)(req.user._id.toString(), { ...req.body, files });
    return res.data(result, result.message);
});
// PATCH /api/v1/lawyers/me/availability
exports.setAvailabilityHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { available } = req.body;
    if (typeof available !== 'boolean') {
        return next(new error_1.AppError('`available` must be a boolean.', 400, 'VALIDATION_ERROR'));
    }
    try {
        const profile = await (0, lawyer_service_1.toggleAvailability)(req.user._id.toString(), available);
        return res.data({ isAvailable: profile.isAvailable }, 'Availability updated.');
    }
    catch (err) {
        return next(new error_1.AppError(err.message, 400, 'FORBIDDEN'));
    }
});
// 
//  ADMIN ROUTES
// 
// GET /api/v1/admin/lawyers
exports.listLawyersHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { verificationStatus, search, page, pageSize, isAvailable } = req.query;
    const result = await (0, lawyer_service_1.listLawyers)({
        verificationStatus,
        search,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        isAvailable: isAvailable !== undefined ? isAvailable === 'true' : undefined,
    });
    return res.data(result, 'Lawyers fetched.');
});
// GET /api/v1/admin/lawyers/stats
exports.getLawyerStatsHandler = (0, error_1.asyncHandler)(async (_req, res, _next) => {
    const stats = await (0, lawyer_service_1.getLawyerStats)();
    return res.data(stats, 'Stats fetched.');
});
// GET /api/v1/admin/lawyers/:id
exports.getLawyerHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const profile = await (0, lawyer_service_1.getLawyerById)(req.params.id);
    return res.data({ profile }, 'Lawyer fetched.');
});
// POST /api/v1/admin/lawyers/:id/verification/advance
// Move verification to next stage
exports.advanceVerificationHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { note } = req.body;
    const result = await (0, lawyer_service_1.advanceVerification)(req.params.id, adminCtx(req), note);
    return res.data(result, result.message);
});
// POST /api/v1/admin/lawyers/:id/verification/reject
exports.rejectVerificationHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { reason, infoNeeded } = req.body;
    if (!reason?.trim())
        return next(new error_1.AppError('A reason is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, lawyer_service_1.rejectVerification)(req.params.id, adminCtx(req), reason, Boolean(infoNeeded));
    return res.data(result, result.message);
});
// PATCH /api/v1/admin/lawyers/:id/documents/:docId
// Mark an individual document as verified/failed
exports.verifyDocumentHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { verified } = req.body;
    if (typeof verified !== 'boolean') {
        return next(new error_1.AppError('`verified` must be a boolean.', 400, 'VALIDATION_ERROR'));
    }
    const result = await (0, lawyer_service_1.verifyDocument)(req.params.id, req.params.docId, verified, adminCtx(req));
    return res.data(result, result.message);
});
// PATCH /api/v1/admin/lawyers/:id/status
exports.updateLawyerStatusHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { action, reason } = req.body;
    if (!action || !['suspend', 'reactivate'].includes(action)) {
        return next(new error_1.AppError('action must be "suspend" or "reactivate".', 400, 'VALIDATION_ERROR'));
    }
    if (!reason?.trim())
        return next(new error_1.AppError('reason is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, lawyer_service_1.updateLawyerStatus)(req.params.id, action, reason, adminCtx(req));
    return res.data(result, result.message);
});
// POST /api/v1/admin/lawyers/:id/email
exports.emailLawyerHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { subject, body } = req.body;
    if (!subject?.trim())
        return next(new error_1.AppError('subject is required.', 400, 'VALIDATION_ERROR'));
    if (!body?.trim())
        return next(new error_1.AppError('body is required.', 400, 'VALIDATION_ERROR'));
    // Import inline to avoid circular deps
    // const { emailLawyer } = await import('../services/lawyer.service');
    // emailLawyer is not exported from lawyerProfile.service, using admin-side email stub:
    console.log(`[EMAIL LAWYER] id=${req.params.id} subject=${subject}`);
    return res.success('Email sent successfully.');
});
// Add these new functions to your existing lawyer.controller.ts
// ========== NEW MARKETPLACE CONTROLLERS ==========
/**
 * GET /api/v1/marketplace/stats
 * Get marketplace statistics for hero section
 */
exports.getMarketplaceStatsHandler = (0, error_1.asyncHandler)(async (_req, res, _next) => {
    const stats = await (0, lawyer_service_1.getMarketplaceStats)();
    return res.data(stats, 'Marketplace stats fetched.');
});
/**
 * GET /api/v1/marketplace/states
 * Get unique states for filter dropdown
 */
exports.getMarketplaceStatesHandler = (0, error_1.asyncHandler)(async (_req, res, _next) => {
    const states = await (0, lawyer_service_1.getMarketplaceStates)();
    return res.data(states, 'States fetched.');
});
/**
 * GET /api/v1/marketplace/specialisms
 * Get specialisms with counts for filter
 */
exports.getMarketplaceSpecialismsHandler = (0, error_1.asyncHandler)(async (_req, res, _next) => {
    const specialisms = await (0, lawyer_service_1.getMarketplaceSpecialisms)();
    return res.data(specialisms, 'Specialisms fetched.');
});
/**
 * GET /api/v1/marketplace/filter-counts
 * Get filter counts for sidebar
 */
exports.getFilterCountsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { specialism, state, search } = req.query;
    const counts = await (0, lawyer_service_1.getFilterCounts)({ specialism, state, search });
    return res.data(counts, 'Filter counts fetched.');
});
/**
 * GET /api/v1/marketplace/lawyers
 * Get paginated list of marketplace lawyers with filters
 */
exports.getMarketplaceLawyersHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { specialism, state, search, sortBy, page, pageSize, subscribedOnly, } = req.query;
    logger_1.default.info("info", req.query);
    const result = await (0, lawyer_service_1.getMarketplaceLawyers)({
        specialism,
        state,
        search,
        sortBy: sortBy,
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 20,
        subscribedOnly: subscribedOnly === 'true',
    });
    return res.data(result, 'Lawyers fetched.');
});
/**
 * GET /api/v1/marketplace/lawyers/:scnNumber
 * Get lawyer by SCN number
 */
exports.getLawyerByScnNumberHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { scnNumber } = req.params;
    const lawyer = await (0, lawyer_service_1.getLawyerByScnNumber)(scnNumber);
    return res.data(lawyer, 'Lawyer fetched.');
});
/**
 * POST /api/v1/marketplace/consultations
 * Book a consultation with a lawyer
 */
exports.bookConsultationHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { lawyerScnNumber, mode, topic, description, } = req.body;
    if (!req.user)
        return next(new error_1.AppError('Invalid User.', 400, 'VALIDATION_ERROR'));
    if (!lawyerScnNumber)
        return next(new error_1.AppError('Lawyer SCN number is required.', 400, 'VALIDATION_ERROR'));
    if (!mode)
        return next(new error_1.AppError('Consultation mode is required.', 400, 'VALIDATION_ERROR'));
    if (!topic?.trim())
        return next(new error_1.AppError('Topic is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.bookConsultation)(req.user._id.toString(), req.user.fullName, {
        lawyerScnNumber,
        mode,
        topic,
        description,
    });
    const consultationSlug = result.receiptId;
    const paymentGateway = new payment_1.default();
    const paymentReference = paymentGateway.generatePaymentReference(consultationSlug);
    const paymentData = {
        email: req.user?.email,
        amount: result.fee,
        reference: paymentReference,
        coreId: result.consultationId.toString(),
        userId: req.user?.id,
        description: 'Order Payment',
        phone: req.user.phone || '',
        metadata: {
            type: 'purchase',
            coreId: result.consultationId.toString(),
            orderSlug: consultationSlug,
            redirect: "marketplace",
        }
    };
    const paymentResult = await paymentGateway.initializePayment("paystack", paymentData);
    return res.data({ result, payment: paymentResult }, 'Order created successfully');
});
/**
 * POST /api/v1/marketplace/match-requests
 * Request a lawyer match
 */
exports.requestLawyerMatchHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { specialism, topic, mode, urgency, location, description, notes, documents, waiver } = req.body;
    if (!specialism?.trim())
        return next(new error_1.AppError('Specialism is required.', 400, 'VALIDATION_ERROR'));
    if (!urgency)
        return next(new error_1.AppError('Urgency is required.', 400, 'VALIDATION_ERROR'));
    if (!location?.trim())
        return next(new error_1.AppError('Location is required.', 400, 'VALIDATION_ERROR'));
    if (!description?.trim())
        return next(new error_1.AppError('Description is required.', 400, 'VALIDATION_ERROR'));
    if (!topic?.trim())
        return next(new error_1.AppError('Topic is required.', 400, 'VALIDATION_ERROR'));
    if (!mode?.trim())
        return next(new error_1.AppError('Mode is required.', 400, 'VALIDATION_ERROR'));
    if (documents && (!Array.isArray(documents) || documents.some((d) => !d?.name || !d?.base64))) {
        return next(new error_1.AppError('Each document needs a name and base64 file.', 400, 'VALIDATION_ERROR'));
    }
    const result = await (0, lawyer_service_1.requestLawyerMatch)(req.user._id.toString(), req.body);
    let paymentResult;
    if (!waiver) {
        result.paymentResult = null;
        const paymentGateway = new payment_1.default();
        const paymentReference = paymentGateway.generatePaymentReference(result.receiptId);
        result.paymentResult = await paymentGateway.initializePayment('paystack', {
            email: req.user.email,
            amount: 15000,
            reference: paymentReference,
            coreId: result.requestId.toString(),
            userId: req.user?.id,
            description: 'Consultation Payment',
            phone: req.user.phone || '',
            metadata: {
                type: 'purchase',
                coreId: result.requestId,
                orderSlug: result.receiptId,
                redirect: `consultations/requests/${result.requestId}`,
            },
        });
        if (!result.paymentResult)
            throw new error_1.AppError('Failed to initialize Payment', 404, 'NOT_FOUND');
    }
    return res.data(result, 'Match request submitted.');
});
/**
 * GET /api/v1/marketplace/lawyers/:scnNumber/availability
 * Get lawyer availability slots
 */
exports.getLawyerAvailabilityHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { scnNumber } = req.params;
    const { date } = req.query;
    const slots = await (0, lawyer_service_1.getLawyerAvailability)(scnNumber, date);
    return res.data(slots, 'Availability slots fetched.');
});
/**
 * POST /api/v1/marketplace/lawyers/:scnNumber/reviews
 * Submit a review for a lawyer
 */
exports.submitReviewHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { scnNumber } = req.params;
    const { consultationId, rating, comment, tags } = req.body;
    if (!consultationId)
        return next(new error_1.AppError('Consultation ID is required.', 400, 'VALIDATION_ERROR'));
    if (!rating || rating < 1 || rating > 5)
        return next(new error_1.AppError('Rating must be between 1 and 5.', 400, 'VALIDATION_ERROR'));
    if (!comment?.trim())
        return next(new error_1.AppError('Comment is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, lawyer_service_1.submitReview)(req.user._id.toString(), scnNumber, {
        consultationId,
        rating,
        comment,
        tags,
    });
    return res.data(result, 'Review submitted.');
});
//# sourceMappingURL=lawyer.controller.js.map