import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';
import {
  // Citizen
  getCitizenConsultations,
  getCitizenConsultationById,
  getCitizenConsultationStats,
  raiseDispute,
  requestRefund,
  submitCitizenRating,
  sendCitizenMessage,
  // Match requests (citizen-facing)
  getMatchRequestsForCitizen,
  getMatchRequestForCitizen,
  addCitizenMatchDocument,
  citizenSelectRecommendedLawyer,
  // Lawyer
  getLawyerConsultations,
  getLawyerConsultationById,
  getLawyerConsultationStats,
  acceptConsultation,
  rejectConsultation,
  sendLawyerMessage,
  completeConsultation,
  // Match requests (lawyer-facing)
  getMatchRequestsForLawyer,
  acceptMatchRequest,
  rejectMatchRequest,
  // Utility
  getAvailableStatuses,
  // Admin
  listConsultations,
  getConsultationById,
  getConsultationStats,
  updateConsultationStatus,
  resolveDispute,
  flagConsultation,
  approveRefund,
  sendLawyerWarning,
  bulkAction,
  exportConsultations,
  listDisputes,
  listRefundRequests,
  listFlaggedConsultations,
  listMatchRequests,
  getMatchRequestById,
  adminAcceptMatchRequest,
  sendAdminMatchMessage,
  scheduleAdminMatchCall,
  adminAddMatchDocument,
  getAutoSuggestedLawyers,
  recommendLawyersForMatch,
  autoSuggestAndRecommend,
  bulkAutoSuggestAndRecommend,
  assignLawyerToMatch,
  updateCitizenMatchStatus,
  expireMatchRequest,
  getLawyerPerformance,
  getTopLawyers,
  getDashboardStats,
  getRecentActivity,
  consultationPayment,
} from '../services/consultation.service';
import PaymentGateway from '../services/payment/payment';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function adminCtx(req: Request) {
  return { adminId: req.admin!.id, adminName: req.admin!.name };
}

// ─── CITIZEN CONTROLLERS ─────────────────────────────────────────────────────

/** GET /consultations/citizen */
export const getCitizenConsultationsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { status, mode, search, page, pageSize, startDate, endDate } = req.query as Record<string, string>;
    const citizenId = req.user!._id.toString();

    const result = await getCitizenConsultations(citizenId, {
      status: status as any,
      mode: mode as any,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      startDate,
      endDate,
    });

    return (res as AppResponse).data(result, 'Consultations fetched.');
  },
);

/** GET /consultations/citizen/stats */
export const getCitizenStatsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const stats = await getCitizenConsultationStats(req.user!._id.toString());
    return (res as AppResponse).data(stats, 'Stats fetched.');
  },
);

/** GET /consultations/citizen/:id */
export const getCitizenConsultationHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const consultation = await getCitizenConsultationById(req.params.id, req.user!._id.toString());
    return (res as AppResponse).data(consultation, 'Consultation fetched.');
  },
);

/** POST /consultations/citizen/:id/dispute */
export const raiseDisputeHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reason } = req.body;
    if (!reason?.trim()) return next(new AppError('Reason is required.', 400, 'VALIDATION_ERROR'));

    const result = await raiseDispute(req.params.id, req.user!._id.toString(), reason);
    return (res as AppResponse).data(result, 'Dispute raised.');
  },
);

/** POST /consultations/citizen/:id/refund-request */
export const requestRefundHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await requestRefund(req.params.id, req.user!._id.toString(), req.body.reason);
    return (res as AppResponse).data(result, 'Refund request submitted.');
  },
);

/** POST /consultations/citizen/:id/rating */
export const submitRatingHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return next(new AppError('Rating must be between 1 and 5.', 400, 'VALIDATION_ERROR'));

    const result = await submitCitizenRating(req.params.id, req.user!._id.toString(), Number(rating), comment);
    return (res as AppResponse).data(result, 'Rating submitted.');
  },
);

/** POST /consultations/citizen/:id/messages */
export const sendCitizenMessageHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { text } = req.body;
    if (!text?.trim()) return next(new AppError('Message text is required.', 400, 'VALIDATION_ERROR'));

    const result = await sendCitizenMessage(req.params.id, req.user!._id.toString(), text);
    return (res as AppResponse).data(result, 'Message sent.');
  },
);


/** PATCH /consultations/pay/:id */
export const consultationPaymentHandler = asyncHandler(
  async(req:Request, res: Response, _next: NextFunction) => {
    const payment = await consultationPayment(req.params.id)
    console.log(payment)
    return (res as AppResponse).data(payment, 'Payment Initialized Successfully.');
  }
)

// ─── CITIZEN MATCH REQUEST CONTROLLERS ───────────────────────────────────────

/** GET /consultations/citizen/match-requests */
export const getCitizenMatchRequestsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { status, search, page, pageSize } = req.query as Record<string, string>;
    const result = await getMatchRequestsForCitizen(req.user!._id.toString(), {
      status: status as any,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return (res as AppResponse).data(result, 'Match requests fetched.');
  },
);

/** GET /consultations/citizen/match-requests/:id */
export const getCitizenMatchRequestHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await getMatchRequestForCitizen(req.params.id, req.user!._id.toString());
    return (res as AppResponse).data(result, 'Match request fetched.');
  },
);

/** POST /consultations/citizen/match-requests/:id/documents */
export const addCitizenMatchDocumentHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, sizeBytes, label } = req.body;
    const file = req.file?.buffer

    console.log({ name, sizeBytes, label, file: req.file?.originalname, mimetype: req.file?.mimetype, size: req.file?.size })

    if (!name?.trim()) return next(new AppError('Document name is required.', 400, 'VALIDATION_ERROR'));
    if (!file) return next(new AppError('File is required.', 400, 'VALIDATION_ERROR'));

    const result = await addCitizenMatchDocument(req.params.id, req.user!._id.toString(), { name, file, sizeBytes, label });
    return (res as AppResponse).data(result, 'Document attached.');
  },
);

/** POST /consultations/citizen/match-requests/:id/select-lawyer */
export const selectRecommendedLawyerHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { lawyerProfileId } = req.body;
    if (!lawyerProfileId) return next(new AppError('lawyerProfileId is required.', 400, 'VALIDATION_ERROR'));

    const result = await citizenSelectRecommendedLawyer(
      req.params.id,
      req.user!._id.toString(),
      req.user!.fullName,
      lawyerProfileId
    );

    const paymentGateway = new PaymentGateway();
    const paymentReference = paymentGateway.generatePaymentReference(result.book.receiptId);
    const paymentResult = await paymentGateway.initializePayment('paystack', {
      email: req.user!.email,
      amount: result.book.fee,
      reference: paymentReference,
      coreId: result.book.consultationId.toString(),
      userId: req.user?.id,
      description: 'Consultation Payment',
      phone: req.user!.phone || '',
      metadata: {
        type: 'purchase',
        coreId: result.book.consultationId.toString(),
        orderSlug: result.book.receiptId,
        redirect: 'consultations',
      },
    });

    return (res as AppResponse).data({ result, payment: paymentResult }, 'Lawyer selected — proceed to payment.');
  },
);

// ─── LAWYER CONTROLLERS ───────────────────────────────────────────────────────

/** GET /consultations/lawyer */
export const getLawyerConsultationsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { status, mode, search, page, pageSize, startDate, endDate } = req.query as Record<string, string>;
    const lawyerId = req.user!._id.toString();

    const result = await getLawyerConsultations(lawyerId, {
      status: status as any,
      mode: mode as any,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      startDate,
      endDate,
    });

    return (res as AppResponse).data(result, 'Consultations fetched.');
  },
);

/** GET /consultations/lawyer/stats */
export const getLawyerStatsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const stats = await getLawyerConsultationStats(req.user!._id.toString());
    return (res as AppResponse).data(stats, 'Stats fetched.');
  },
);

/** GET /consultations/lawyer/:id */
export const getLawyerConsultationHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const consultation = await getLawyerConsultationById(req.params.id, req.user!._id.toString());
    return (res as AppResponse).data(consultation, 'Consultation fetched.');
  },
);

/** POST /consultations/lawyer/:id/accept */
export const acceptConsultationHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await acceptConsultation(req.params.id, req.user!._id.toString());
    return (res as AppResponse).data(result, 'Consultation accepted.');
  },
);

/** POST /consultations/lawyer/:id/reject */
export const rejectConsultationHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reason } = req.body;
    if (!reason?.trim()) return next(new AppError('Reason is required.', 400, 'VALIDATION_ERROR'));

    const result = await rejectConsultation(req.params.id, req.user!._id.toString(), reason);
    return (res as AppResponse).data(result, 'Consultation rejected.');
  },
);

/** POST /consultations/lawyer/:id/messages */
export const sendLawyerMessageHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { text } = req.body;
    if (!text?.trim()) return next(new AppError('Message text is required.', 400, 'VALIDATION_ERROR'));

    const result = await sendLawyerMessage(req.params.id, req.user!._id.toString(), text);
    return (res as AppResponse).data(result, 'Message sent.');
  },
);

/** POST /consultations/lawyer/:id/complete */
export const completeConsultationHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await completeConsultation(req.params.id, req.user!._id.toString());
    return (res as AppResponse).data(result, 'Consultation completed.');
  },
);

// ─── MATCH REQUEST CONTROLLERS (lawyer-facing) ────────────────────────────────

/** GET /consultations/matches */
export const getMatchRequestsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { status, search, page, pageSize, urgency } = req.query as Record<string, string>;

    const result = await getMatchRequestsForLawyer(req.user!._id.toString(), {
      status: status as any,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      urgency,
    });

    return (res as AppResponse).data(result, 'Match requests fetched.');
  },
);

/** POST /consultations/matches/:id/accept */
export const acceptMatchRequestHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await acceptMatchRequest(req.params.id, req.user!._id.toString());
    return (res as AppResponse).data(result, 'Match request accepted.');
  },
);

/** POST /consultations/matches/:id/reject */
export const rejectMatchRequestHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await rejectMatchRequest(req.params.id, req.user!._id.toString(), req.body.reason);
    return (res as AppResponse).data(result, 'Match request rejected.');
  },
);

// ─── UTILITY CONTROLLERS ─────────────────────────────────────────────────────

/** GET /consultations/statuses/:role */
export const getAvailableStatusesHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { role } = req.params as { role: 'citizen' | 'lawyer' | 'admin' };
    if (!['citizen', 'lawyer', 'admin'].includes(role)) {
      return next(new AppError('Invalid role.', 400, 'VALIDATION_ERROR'));
    }

    const userId = req.user?._id?.toString();
    const statuses = await getAvailableStatuses(role, userId);
    return (res as AppResponse).data(statuses, 'Statuses fetched.');
  },
);

// ─── ADMIN CONTROLLERS ────────────────────────────────────────────────────────

/** GET /admin/consultations */
export const listConsultationsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { status, mode, search, page, pageSize, startDate, endDate, citizenId, lawyerId, disputed, flagged } = req.query as Record<string, string>;

    const result = await listConsultations({
      status: status as any,
      mode: mode as any,
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

    return (res as AppResponse).data(result, 'Consultations fetched.');
  },
);

/** GET /admin/consultations/stats */
export const getConsultationStatsHandler = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await getConsultationStats();
    return (res as AppResponse).data(stats, 'Stats fetched.');
  },
);

/** GET /admin/consultations/:id */
export const getConsultationHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const consultation = await getConsultationById(req.params.id);
    return (res as AppResponse).data(consultation, 'Consultation fetched.');
  },
);

/** PATCH /admin/consultations/:id/status */
export const updateConsultationStatusHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { status, note } = req.body;
    if (!status) return next(new AppError('Status is required.', 400, 'VALIDATION_ERROR'));

    const result = await updateConsultationStatus(req.params.id, { status, note }, adminCtx(req));
    return (res as AppResponse).data(result, 'Consultation status updated.');
  },
);

/** POST /admin/consultations/:id/dispute/resolve */
export const resolveDisputeHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { decision, refundAmount, reason } = req.body;
    if (!decision || !['citizen', 'lawyer'].includes(decision)) return next(new AppError('Decision must be "citizen" or "lawyer".', 400, 'VALIDATION_ERROR'));
    if (!reason?.trim()) return next(new AppError('Reason is required.', 400, 'VALIDATION_ERROR'));

    const result = await resolveDispute(req.params.id, { decision, refundAmount, reason }, adminCtx(req));
    return (res as AppResponse).data(result, 'Dispute resolved.');
  },
);

/** POST /admin/consultations/:id/flag */
export const flagConsultationHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reason, severity } = req.body;
    if (!reason?.trim()) return next(new AppError('Reason is required.', 400, 'VALIDATION_ERROR'));

    const result = await flagConsultation(req.params.id, { reason, severity: severity || 'medium' }, adminCtx(req));
    return (res as AppResponse).data(result, 'Consultation flagged.');
  },
);

/** POST /admin/consultations/:id/refund */
export const approveRefundHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { approved, adminNote } = req.body;
    if (typeof approved !== 'boolean') return next(new AppError('Approved must be a boolean.', 400, 'VALIDATION_ERROR'));

    const result = await approveRefund(req.params.id, { approved, adminNote }, adminCtx(req));
    return (res as AppResponse).data(result, `Refund ${approved ? 'approved' : 'rejected'}.`);
  },
);

/** POST /admin/consultations/:id/lawyer/:lawyerId/warn */
export const sendLawyerWarningHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reason } = req.body;
    if (!reason?.trim()) return next(new AppError('Reason is required.', 400, 'VALIDATION_ERROR'));

    const result = await sendLawyerWarning(req.params.id, req.params.lawyerId, reason, adminCtx(req));
    return (res as AppResponse).data(result, 'Warning sent.');
  },
);

/** POST /admin/consultations/bulk */
export const bulkActionHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { consultationIds, action, reason } = req.body;
    if (!consultationIds || !Array.isArray(consultationIds) || !consultationIds.length) return next(new AppError('Consultation IDs are required.', 400, 'VALIDATION_ERROR'));
    if (!action || !['flag', 'refund', 'cancel'].includes(action)) return next(new AppError('Action must be "flag", "refund", or "cancel".', 400, 'VALIDATION_ERROR'));
    if (!reason?.trim()) return next(new AppError('Reason is required.', 400, 'VALIDATION_ERROR'));

    const result = await bulkAction(consultationIds, action, reason, adminCtx(req));
    return (res as AppResponse).data(result, 'Bulk action completed.');
  },
);

/** GET /admin/consultations/export */
export const exportConsultationsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { status, mode, search, startDate, endDate, format = 'csv' } = req.query as Record<string, string>;

    const { headers, rows } = await exportConsultations({ status: status as any, mode: mode as any, search, startDate, endDate });

    if (format === 'csv') {
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=consultations_${Date.now()}.csv`);
      return res.send(csv);
    }

    return (res as AppResponse).data({ headers, rows }, 'Export ready.');
  },
);

/** GET /admin/consultations/disputes */
export const getDisputesHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { status, page, pageSize } = req.query as Record<string, string>;
    const result = await listDisputes({ status: status as any, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined });
    return (res as AppResponse).data(result, 'Disputes fetched.');
  },
);

/** GET /admin/consultations/refunds */
export const getRefundRequestsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { status, page, pageSize } = req.query as Record<string, string>;
    const result = await listRefundRequests({ status: status as any, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined });
    return (res as AppResponse).data(result, 'Refund requests fetched.');
  },
);

/** GET /admin/consultations/flagged */
export const getFlaggedConsultationsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { severity, resolved, page, pageSize } = req.query as Record<string, string>;
    const result = await listFlaggedConsultations({ severity: severity as any, resolved: resolved !== undefined ? resolved === 'true' : undefined, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined });
    return (res as AppResponse).data(result, 'Flagged consultations fetched.');
  },
);

/** GET /admin/consultations/dashboard */
export const getDashboardStatsHandler = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await getDashboardStats();
    return (res as AppResponse).data(stats, 'Dashboard stats fetched.');
  },
);

/** GET /admin/activity/recent */
export const getRecentActivityHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { limit = 20 } = req.query as Record<string, string>;
    const activities = await getRecentActivity(Number(limit));
    return (res as AppResponse).data(activities, 'Recent activity fetched.');
  },
);

// ─── ADMIN MATCH REQUEST CONTROLLERS ─────────────────────────────────────────

/** GET /admin/consultations/request/match-requests (or /admin/matches) */
export const listMatchRequestsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { status, search, page, pageSize, urgency } = req.query as Record<string, string>;
    const result = await listMatchRequests({ status: status as any, search, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined, urgency });
    return (res as AppResponse).data(result, 'Match requests fetched.');
  },
);

/** GET /admin/matches/:id */
export const getMatchRequestHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const matchRequest = await getMatchRequestById(req.params.id);
    return (res as AppResponse).data(matchRequest, 'Match request fetched.');
  },
);

/** POST /admin/consultations/match-requests/:id/assign */
export const assignLawyerToMatchHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { lawyerId } = req.body;
    if (!lawyerId) return next(new AppError('Lawyer ID is required.', 400, 'VALIDATION_ERROR'));

    const result = await assignLawyerToMatch(req.params.id, lawyerId, adminCtx(req));
    return (res as AppResponse).data(result, 'Lawyer assigned.');
  },
);

/** POST /admin/consultations/match-requests/:id/accept */
export const adminAcceptMatchRequestHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await adminAcceptMatchRequest(req.params.id, adminCtx(req));
    return (res as AppResponse).data(result, 'Match request accepted for review.');
  },
);


// POST /admin/consultations/match-requests/:id/status
export const adminUpdateMatchStatusHandler = asyncHandler(
 async (req: Request, res: Response, _next: NextFunction) => {
    const result = await updateCitizenMatchStatus(req.params.id, req.body.status, adminCtx(req));
    return (res as AppResponse).data(result, 'Match request accepted for review.');
  },
)

/** POST /admin/consultations/match-requests/:id/message */
export const sendAdminMatchMessageHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { message } = req.body;
    if (!message?.trim()) return next(new AppError('Message is required.', 400, 'VALIDATION_ERROR'));

    const result = await sendAdminMatchMessage(req.params.id, adminCtx(req), message);
    return (res as AppResponse).data(result, 'Message sent to citizen.');
  },
);

/** POST /admin/consultations/match-requests/:id/schedule-call */
export const scheduleAdminMatchCallHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { dateTime, link, note } = req.body;
    if (!dateTime) return next(new AppError('dateTime is required.', 400, 'VALIDATION_ERROR'));

    const result = await scheduleAdminMatchCall(req.params.id, adminCtx(req), { dateTime, link, note });
    return (res as AppResponse).data(result, 'Call scheduled.');
  },
);

/** POST /admin/consultations/match-requests/:id/documents */
export const adminAddMatchDocumentHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, file, sizeBytes, label, isCaseBrief } = req.body;
    if (!name?.trim()) return next(new AppError('Document name is required.', 400, 'VALIDATION_ERROR'));
    if (!file) return next(new AppError('File is required.', 400, 'VALIDATION_ERROR'));

    const result = await adminAddMatchDocument(req.params.id, adminCtx(req), { name, file, sizeBytes, label, isCaseBrief });
    return (res as AppResponse).data(result, isCaseBrief ? 'Case brief attached.' : 'Document attached.');
  },
);

/** GET /admin/consultations/match-requests/:id/suggestions */
export const getAutoSuggestedLawyersHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { limit } = req.query as Record<string, string>;
    const result = await getAutoSuggestedLawyers(req.params.matchRequestId, limit ? Number(limit) : undefined);
    return (res as AppResponse).data(result, 'Suggested lawyers fetched.');
  },
);

/** POST /admin/consultations/match-requests/:id/recommend */
export const recommendLawyersForMatchHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { lawyers: lawyerProfileIds } = req.body;
    if (!Array.isArray(lawyerProfileIds) || !lawyerProfileIds.length) {
      return next(new AppError('lawyerProfileIds must be a non-empty array.', 400, 'VALIDATION_ERROR'));
    }

    const result = await recommendLawyersForMatch(req.params.id, adminCtx(req), lawyerProfileIds);
    return (res as AppResponse).data(result, 'Recommendations sent to citizen.');
  },
);

/** POST /admin/consultations/match-requests/:id/auto-suggest */
export const autoSuggestAndRecommendHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { limit } = req.query as Record<string, string>;
    const result = await autoSuggestAndRecommend(req.params.id, adminCtx(req), limit ? Number(limit) : undefined);
    return (res as AppResponse).data(result, 'Auto-suggested lawyers recommended to citizen.');
  },
);

/** POST /admin/consultations/match-requests/bulk-auto-match */
export const bulkAutoSuggestHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await bulkAutoSuggestAndRecommend(adminCtx(req));
    return (res as AppResponse).data(result, 'Bulk auto-suggest completed — shortlists sent to citizens.');
  },
);

/** POST /admin/consultations/match-requests/:id/expire */
export const expireMatchRequestHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await expireMatchRequest(req.params.id, adminCtx(req));
    return (res as AppResponse).data(result, 'Match request expired.');
  },
);


// ─── LAWYER PERFORMANCE CONTROLLERS ─────────────────────────────────────────

/** GET /admin/analytics/lawyer-performance */
export const getLawyerPerformanceHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { startDate, endDate } = req.query as Record<string, string>;
    const performance = await getLawyerPerformance({ startDate, endDate });
    return (res as AppResponse).data(performance, 'Performance metrics fetched.');
  },
);

/** GET /admin/lawyers/top-performers */
export const getTopLawyersHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { limit = '10', sortBy = 'sessions' } = req.query as Record<string, string>;
    const topLawyers = await getTopLawyers(Number(limit), sortBy as any);
    return (res as AppResponse).data(topLawyers, 'Top performers fetched.');
  },
);