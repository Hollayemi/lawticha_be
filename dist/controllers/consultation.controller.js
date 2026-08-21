"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLawyerPerformanceHandler = exports.expireMatchRequestHandler = exports.bulkAutoSuggestHandler = exports.autoSuggestAndRecommendHandler = exports.recommendLawyersForMatchHandler = exports.getAutoSuggestedLawyersHandler = exports.adminAddMatchDocumentHandler = exports.scheduleAdminMatchCallHandler = exports.sendAdminMatchMessageHandler = exports.adminUpdateMatchStatusHandler = exports.adminAcceptMatchRequestHandler = exports.assignLawyerToMatchHandler = exports.getMatchRequestHandler = exports.listMatchRequestsHandler = exports.getRecentActivityHandler = exports.getDashboardStatsHandler = exports.getFlaggedConsultationsHandler = exports.getRefundRequestsHandler = exports.getDisputesHandler = exports.exportConsultationsHandler = exports.bulkActionHandler = exports.sendLawyerWarningHandler = exports.approveRefundHandler = exports.flagConsultationHandler = exports.resolveDisputeHandler = exports.updateConsultationStatusHandler = exports.getConsultationHandler = exports.getConsultationStatsHandler = exports.listConsultationsHandler = exports.getAvailableStatusesHandler = exports.getMatchRequestsHandler = exports.completeConsultationHandler = exports.sendLawyerMessageHandler = exports.rejectConsultationHandler = exports.acceptConsultationHandler = exports.getLawyerConsultationHandler = exports.getLawyerStatsHandler = exports.getLawyerConsultationsHandler = exports.selectRecommendedLawyerHandler = exports.addCitizenMatchDocumentHandler = exports.getCitizenMatchRequestHandler = exports.getCitizenMatchRequestsHandler = exports.consultationPaymentHandler = exports.sendCitizenMessageHandler = exports.submitRatingHandler = exports.requestRefundHandler = exports.raiseDisputeHandler = exports.getCitizenConsultationHandler = exports.getCitizenStatsHandler = exports.getCitizenConsultationsHandler = void 0;
exports.getTopLawyersHandler = void 0;
const error_1 = require("../middleware/error");
const consultation_service_1 = require("../services/consultation.service");
// ─── Helpers ─────────────────────────────────────────────────────────────────
function adminCtx(req) {
    return { adminId: req.admin.id, adminName: req.admin.name };
}
// ─── CITIZEN CONTROLLERS ─────────────────────────────────────────────────────
/** GET /consultations/citizen */
exports.getCitizenConsultationsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { status, mode, search, page, pageSize, startDate, endDate } = req.query;
    const citizenId = req.user._id.toString();
    const result = await (0, consultation_service_1.getCitizenConsultations)(citizenId, {
        status: status,
        mode: mode,
        search,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        startDate,
        endDate,
    });
    return res.data(result, 'Consultations fetched.');
});
/** GET /consultations/citizen/stats */
exports.getCitizenStatsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const stats = await (0, consultation_service_1.getCitizenConsultationStats)(req.user._id.toString());
    return res.data(stats, 'Stats fetched.');
});
/** GET /consultations/citizen/:id */
exports.getCitizenConsultationHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const consultation = await (0, consultation_service_1.getCitizenConsultationById)(req.params.id, req.user._id.toString());
    return res.data(consultation, 'Consultation fetched.');
});
/** POST /consultations/citizen/:id/dispute */
exports.raiseDisputeHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { reason } = req.body;
    if (!reason?.trim())
        return next(new error_1.AppError('Reason is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.raiseDispute)(req.params.id, req.user._id.toString(), reason);
    return res.data(result, 'Dispute raised.');
});
/** POST /consultations/citizen/:id/refund-request */
exports.requestRefundHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await (0, consultation_service_1.requestRefund)(req.params.id, req.user._id.toString(), req.body.reason);
    return res.data(result, 'Refund request submitted.');
});
/** POST /consultations/citizen/:id/rating */
exports.submitRatingHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5)
        return next(new error_1.AppError('Rating must be between 1 and 5.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.submitCitizenRating)(req.params.id, req.user._id.toString(), Number(rating), comment);
    return res.data(result, 'Rating submitted.');
});
/** POST /consultations/citizen/:id/messages */
exports.sendCitizenMessageHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { text } = req.body;
    if (!text?.trim())
        return next(new error_1.AppError('Message text is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.sendCitizenMessage)(req.params.id, req.user._id.toString(), text);
    return res.data(result, 'Message sent.');
});
/** PATCH /consultations/pay/:id */
exports.consultationPaymentHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const payment = await (0, consultation_service_1.consultationPayment)(req.params.id);
    console.log(payment);
    return res.data(payment, 'Payment Initialized Successfully.');
});
// ─── CITIZEN MATCH REQUEST CONTROLLERS ───────────────────────────────────────
/** GET /consultations/citizen/match-requests */
exports.getCitizenMatchRequestsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { status, search, page, pageSize } = req.query;
    const result = await (0, consultation_service_1.getMatchRequestsForCitizen)(req.user._id.toString(), {
        status: status,
        search,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return res.data(result, 'Match requests fetched.');
});
/** GET /consultations/citizen/match-requests/:id */
exports.getCitizenMatchRequestHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await (0, consultation_service_1.getMatchRequestForCitizen)(req.params.id, req.user._id.toString());
    return res.data(result, 'Match request fetched.');
});
/** POST /consultations/citizen/match-requests/:id/documents */
exports.addCitizenMatchDocumentHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { name, sizeBytes, label } = req.body;
    const file = req.file?.buffer;
    console.log({ name, sizeBytes, label, file: req.file?.originalname, mimetype: req.file?.mimetype, size: req.file?.size });
    if (!name?.trim())
        return next(new error_1.AppError('Document name is required.', 400, 'VALIDATION_ERROR'));
    if (!file)
        return next(new error_1.AppError('File is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.addCitizenMatchDocument)(req.params.id, req.user._id.toString(), { name, file, sizeBytes, label });
    return res.data(result, 'Document attached.');
});
/** POST /consultations/citizen/match-requests/:id/select-lawyer */
exports.selectRecommendedLawyerHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { lawyerProfileId } = req.body;
    if (!lawyerProfileId)
        return next(new error_1.AppError('lawyerProfileId is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.citizenSelectRecommendedLawyer)(req.params.id, req.user._id.toString(), req.user.fullName, lawyerProfileId);
    return res.data({ result }, 'Lawyer selected — proceed to payment.');
});
// ─── LAWYER CONTROLLERS ───────────────────────────────────────────────────────
/** GET /consultations/lawyer */
exports.getLawyerConsultationsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { status, mode, search, page, pageSize, startDate, endDate } = req.query;
    const lawyerId = req.user._id.toString();
    const result = await (0, consultation_service_1.getLawyerConsultations)(lawyerId, {
        status: status,
        mode: mode,
        search,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        startDate,
        endDate,
    });
    return res.data(result, 'Consultations fetched.');
});
/** GET /consultations/lawyer/stats */
exports.getLawyerStatsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const stats = await (0, consultation_service_1.getLawyerConsultationStats)(req.user._id.toString());
    return res.data(stats, 'Stats fetched.');
});
/** GET /consultations/lawyer/:id */
exports.getLawyerConsultationHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const consultation = await (0, consultation_service_1.getLawyerConsultationById)(req.params.id, req.user._id.toString());
    return res.data(consultation, 'Consultation fetched.');
});
/** POST /consultations/lawyer/:id/accept */
exports.acceptConsultationHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await (0, consultation_service_1.acceptConsultation)(req.params.id, req.user._id.toString());
    return res.data(result, 'Consultation accepted.');
});
/** POST /consultations/lawyer/:id/reject */
exports.rejectConsultationHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { reason } = req.body;
    if (!reason?.trim())
        return next(new error_1.AppError('Reason is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.rejectConsultation)(req.params.id, req.user._id.toString(), reason);
    return res.data(result, 'Consultation rejected.');
});
/** POST /consultations/lawyer/:id/messages */
exports.sendLawyerMessageHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { text } = req.body;
    if (!text?.trim())
        return next(new error_1.AppError('Message text is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.sendLawyerMessage)(req.params.id, req.user._id.toString(), text);
    return res.data(result, 'Message sent.');
});
/** POST /consultations/lawyer/:id/complete */
exports.completeConsultationHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await (0, consultation_service_1.completeConsultation)(req.params.id, req.user._id.toString());
    return res.data(result, 'Consultation completed.');
});
// ─── MATCH REQUEST CONTROLLERS (lawyer-facing) ────────────────────────────────
/** GET /consultations/matches */
exports.getMatchRequestsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { status, search, page, pageSize, urgency } = req.query;
    const result = await (0, consultation_service_1.getMatchRequestsForLawyer)(req.user._id.toString(), {
        status: status,
        search,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        urgency,
    });
    return res.data(result, 'Match requests fetched.');
});
/** POST /consultations/matches/:id/accept */
// export const acceptMatchRequestHandler = asyncHandler(
//   async (req: Request, res: Response, _next: NextFunction) => {
//     const result = await acceptMatchRequest(req.params.id, req.user!._id.toString());
//     return (res as AppResponse).data(result, 'Match request accepted.');
//   },
// );
/** POST /consultations/matches/:id/reject */
// export const rejectMatchRequestHandler = asyncHandler(
//   async (req: Request, res: Response, _next: NextFunction) => {
//     const result = await rejectMatchRequest(req.params.id, req.user!._id.toString(), req.body.reason);
//     return (res as AppResponse).data(result, 'Match request rejected.');
//   },
// );
// ─── UTILITY CONTROLLERS ─────────────────────────────────────────────────────
/** GET /consultations/statuses/:role */
exports.getAvailableStatusesHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { role } = req.params;
    if (!['citizen', 'lawyer', 'admin'].includes(role)) {
        return next(new error_1.AppError('Invalid role.', 400, 'VALIDATION_ERROR'));
    }
    const userId = req.user?._id?.toString();
    const statuses = await (0, consultation_service_1.getAvailableStatuses)(role, userId);
    return res.data(statuses, 'Statuses fetched.');
});
// ─── ADMIN CONTROLLERS ────────────────────────────────────────────────────────
/** GET /admin/consultations */
exports.listConsultationsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { status, mode, search, page, pageSize, startDate, endDate, citizenId, lawyerId, disputed, flagged } = req.query;
    const result = await (0, consultation_service_1.listConsultations)({
        status: status,
        mode: mode,
        search,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        startDate,
        endDate,
        citizenId,
        lawyerId,
        disputed: disputed !== undefined ? disputed === 'true' : undefined,
        flagged: flagged !== undefined ? flagged === 'true' : undefined,
    });
    return res.data(result, 'Consultations fetched.');
});
/** GET /admin/consultations/stats */
exports.getConsultationStatsHandler = (0, error_1.asyncHandler)(async (_req, res, _next) => {
    const stats = await (0, consultation_service_1.getConsultationStats)();
    return res.data(stats, 'Stats fetched.');
});
/** GET /admin/consultations/:id */
exports.getConsultationHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const consultation = await (0, consultation_service_1.getConsultationById)(req.params.id);
    return res.data(consultation, 'Consultation fetched.');
});
/** PATCH /admin/consultations/:id/status */
exports.updateConsultationStatusHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { status, note } = req.body;
    if (!status)
        return next(new error_1.AppError('Status is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.updateConsultationStatus)(req.params.id, { status, note }, adminCtx(req));
    return res.data(result, 'Consultation status updated.');
});
/** POST /admin/consultations/:id/dispute/resolve */
exports.resolveDisputeHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { decision, refundAmount, reason } = req.body;
    if (!decision || !['citizen', 'lawyer'].includes(decision))
        return next(new error_1.AppError('Decision must be "citizen" or "lawyer".', 400, 'VALIDATION_ERROR'));
    if (!reason?.trim())
        return next(new error_1.AppError('Reason is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.resolveDispute)(req.params.id, { decision, refundAmount, reason }, adminCtx(req));
    return res.data(result, 'Dispute resolved.');
});
/** POST /admin/consultations/:id/flag */
exports.flagConsultationHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { reason, severity } = req.body;
    if (!reason?.trim())
        return next(new error_1.AppError('Reason is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.flagConsultation)(req.params.id, { reason, severity: severity || 'medium' }, adminCtx(req));
    return res.data(result, 'Consultation flagged.');
});
/** POST /admin/consultations/:id/refund */
exports.approveRefundHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { approved, adminNote } = req.body;
    if (typeof approved !== 'boolean')
        return next(new error_1.AppError('Approved must be a boolean.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.approveRefund)(req.params.id, { approved, adminNote }, adminCtx(req));
    return res.data(result, `Refund ${approved ? 'approved' : 'rejected'}.`);
});
/** POST /admin/consultations/:id/lawyer/:lawyerId/warn */
exports.sendLawyerWarningHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { reason } = req.body;
    if (!reason?.trim())
        return next(new error_1.AppError('Reason is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.sendLawyerWarning)(req.params.id, req.params.lawyerId, reason, adminCtx(req));
    return res.data(result, 'Warning sent.');
});
/** POST /admin/consultations/bulk */
exports.bulkActionHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { consultationIds, action, reason } = req.body;
    if (!consultationIds || !Array.isArray(consultationIds) || !consultationIds.length)
        return next(new error_1.AppError('Consultation IDs are required.', 400, 'VALIDATION_ERROR'));
    if (!action || !['flag', 'refund', 'cancel'].includes(action))
        return next(new error_1.AppError('Action must be "flag", "refund", or "cancel".', 400, 'VALIDATION_ERROR'));
    if (!reason?.trim())
        return next(new error_1.AppError('Reason is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.bulkAction)(consultationIds, action, reason, adminCtx(req));
    return res.data(result, 'Bulk action completed.');
});
/** GET /admin/consultations/export */
exports.exportConsultationsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { status, mode, search, startDate, endDate, format = 'csv' } = req.query;
    const { headers, rows } = await (0, consultation_service_1.exportConsultations)({ status: status, mode: mode, search, startDate, endDate });
    if (format === 'csv') {
        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=consultations_${Date.now()}.csv`);
        return res.send(csv);
    }
    return res.data({ headers, rows }, 'Export ready.');
});
/** GET /admin/consultations/disputes */
exports.getDisputesHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { status, page, pageSize } = req.query;
    const result = await (0, consultation_service_1.listDisputes)({ status: status, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined });
    return res.data(result, 'Disputes fetched.');
});
/** GET /admin/consultations/refunds */
exports.getRefundRequestsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { status, page, pageSize } = req.query;
    const result = await (0, consultation_service_1.listRefundRequests)({ status: status, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined });
    return res.data(result, 'Refund requests fetched.');
});
/** GET /admin/consultations/flagged */
exports.getFlaggedConsultationsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { severity, resolved, page, pageSize } = req.query;
    const result = await (0, consultation_service_1.listFlaggedConsultations)({ severity: severity, resolved: resolved !== undefined ? resolved === 'true' : undefined, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined });
    return res.data(result, 'Flagged consultations fetched.');
});
/** GET /admin/consultations/dashboard */
exports.getDashboardStatsHandler = (0, error_1.asyncHandler)(async (_req, res, _next) => {
    const stats = await (0, consultation_service_1.getDashboardStats)();
    return res.data(stats, 'Dashboard stats fetched.');
});
/** GET /admin/activity/recent */
exports.getRecentActivityHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { limit = 20 } = req.query;
    const activities = await (0, consultation_service_1.getRecentActivity)(Number(limit));
    return res.data(activities, 'Recent activity fetched.');
});
// ─── ADMIN MATCH REQUEST CONTROLLERS ─────────────────────────────────────────
/** GET /admin/consultations/request/match-requests (or /admin/matches) */
exports.listMatchRequestsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { status, search, page, pageSize, urgency } = req.query;
    const result = await (0, consultation_service_1.listMatchRequests)({ status: status, search, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined, urgency });
    return res.data(result, 'Match requests fetched.');
});
/** GET /admin/matches/:id */
exports.getMatchRequestHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const matchRequest = await (0, consultation_service_1.getMatchRequestById)(req.params.id);
    return res.data(matchRequest, 'Match request fetched.');
});
/** POST /admin/consultations/match-requests/:id/assign */
exports.assignLawyerToMatchHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { lawyerId } = req.body;
    if (!lawyerId)
        return next(new error_1.AppError('Lawyer ID is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.assignLawyerToMatch)(req.params.id, lawyerId, adminCtx(req));
    return res.data(result, 'Lawyer assigned.');
});
/** POST /admin/consultations/match-requests/:id/accept */
exports.adminAcceptMatchRequestHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await (0, consultation_service_1.adminAcceptMatchRequest)(req.params.id, adminCtx(req));
    return res.data(result, 'Match request accepted for review.');
});
// POST /admin/consultations/match-requests/:id/status
exports.adminUpdateMatchStatusHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await (0, consultation_service_1.updateCitizenMatchStatus)(req.params.id, req.body.status, adminCtx(req));
    return res.data(result, 'Match request accepted for review.');
});
/** POST /admin/consultations/match-requests/:id/message */
exports.sendAdminMatchMessageHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { message } = req.body;
    if (!message?.trim())
        return next(new error_1.AppError('Message is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.sendAdminMatchMessage)(req.params.id, adminCtx(req), message);
    return res.data(result, 'Message sent to citizen.');
});
/** POST /admin/consultations/match-requests/:id/schedule-call */
exports.scheduleAdminMatchCallHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { dateTime, link, note } = req.body;
    if (!dateTime)
        return next(new error_1.AppError('dateTime is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.scheduleAdminMatchCall)(req.params.id, adminCtx(req), { dateTime, link, note });
    return res.data(result, 'Call scheduled.');
});
/** POST /admin/consultations/match-requests/:id/documents */
exports.adminAddMatchDocumentHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { name, file, sizeBytes, label, isCaseBrief } = req.body;
    if (!name?.trim())
        return next(new error_1.AppError('Document name is required.', 400, 'VALIDATION_ERROR'));
    if (!file)
        return next(new error_1.AppError('File is required.', 400, 'VALIDATION_ERROR'));
    const result = await (0, consultation_service_1.adminAddMatchDocument)(req.params.id, adminCtx(req), { name, file, sizeBytes, label, isCaseBrief });
    return res.data(result, isCaseBrief ? 'Case brief attached.' : 'Document attached.');
});
/** GET /admin/consultations/match-requests/:id/suggestions */
exports.getAutoSuggestedLawyersHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { limit } = req.query;
    const result = await (0, consultation_service_1.getAutoSuggestedLawyers)(req.params.matchRequestId, limit ? Number(limit) : undefined);
    return res.data(result, 'Suggested lawyers fetched.');
});
/** POST /admin/consultations/match-requests/:id/recommend */
exports.recommendLawyersForMatchHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { lawyers: lawyerProfileIds } = req.body;
    if (!Array.isArray(lawyerProfileIds) || !lawyerProfileIds.length) {
        return next(new error_1.AppError('lawyerProfileIds must be a non-empty array.', 400, 'VALIDATION_ERROR'));
    }
    const result = await (0, consultation_service_1.recommendLawyersForMatch)(req.params.id, adminCtx(req), lawyerProfileIds);
    return res.data(result, 'Recommendations sent to citizen.');
});
/** POST /admin/consultations/match-requests/:id/auto-suggest */
exports.autoSuggestAndRecommendHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { limit } = req.query;
    const result = await (0, consultation_service_1.autoSuggestAndRecommend)(req.params.id, adminCtx(req), limit ? Number(limit) : undefined);
    return res.data(result, 'Auto-suggested lawyers recommended to citizen.');
});
/** POST /admin/consultations/match-requests/bulk-auto-match */
exports.bulkAutoSuggestHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await (0, consultation_service_1.bulkAutoSuggestAndRecommend)(adminCtx(req));
    return res.data(result, 'Bulk auto-suggest completed — shortlists sent to citizens.');
});
/** POST /admin/consultations/match-requests/:id/expire */
exports.expireMatchRequestHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await (0, consultation_service_1.expireMatchRequest)(req.params.id, adminCtx(req));
    return res.data(result, 'Match request expired.');
});
// ─── LAWYER PERFORMANCE CONTROLLERS ─────────────────────────────────────────
/** GET /admin/analytics/lawyer-performance */
exports.getLawyerPerformanceHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { startDate, endDate } = req.query;
    const performance = await (0, consultation_service_1.getLawyerPerformance)({ startDate, endDate });
    return res.data(performance, 'Performance metrics fetched.');
});
/** GET /admin/lawyers/top-performers */
exports.getTopLawyersHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { limit = '10', sortBy = 'sessions' } = req.query;
    const topLawyers = await (0, consultation_service_1.getTopLawyers)(Number(limit), sortBy);
    return res.data(topLawyers, 'Top performers fetched.');
});
//# sourceMappingURL=consultation.controller.js.map