import { Request, Response, NextFunction } from 'express';
/** GET /consultations/citizen */
export declare const getCitizenConsultationsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /consultations/citizen/stats */
export declare const getCitizenStatsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /consultations/citizen/:id */
export declare const getCitizenConsultationHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /consultations/citizen/:id/dispute */
export declare const raiseDisputeHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /consultations/citizen/:id/refund-request */
export declare const requestRefundHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /consultations/citizen/:id/rating */
export declare const submitRatingHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /consultations/citizen/:id/messages */
export declare const sendCitizenMessageHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** PATCH /consultations/pay/:id */
export declare const consultationPaymentHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /consultations/citizen/match-requests */
export declare const getCitizenMatchRequestsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /consultations/citizen/match-requests/:id */
export declare const getCitizenMatchRequestHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /consultations/citizen/match-requests/:id/documents */
export declare const addCitizenMatchDocumentHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /consultations/citizen/match-requests/:id/select-lawyer */
export declare const selectRecommendedLawyerHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /consultations/lawyer */
export declare const getLawyerConsultationsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /consultations/lawyer/stats */
export declare const getLawyerStatsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /consultations/lawyer/:id */
export declare const getLawyerConsultationHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /consultations/lawyer/:id/accept */
export declare const acceptConsultationHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /consultations/lawyer/:id/reject */
export declare const rejectConsultationHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /consultations/lawyer/:id/messages */
export declare const sendLawyerMessageHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /consultations/lawyer/:id/complete */
export declare const completeConsultationHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /consultations/matches */
export declare const getMatchRequestsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /consultations/matches/:id/accept */
/** POST /consultations/matches/:id/reject */
/** GET /consultations/statuses/:role */
export declare const getAvailableStatusesHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /admin/consultations */
export declare const listConsultationsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /admin/consultations/stats */
export declare const getConsultationStatsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /admin/consultations/:id */
export declare const getConsultationHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** PATCH /admin/consultations/:id/status */
export declare const updateConsultationStatusHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /admin/consultations/:id/dispute/resolve */
export declare const resolveDisputeHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /admin/consultations/:id/flag */
export declare const flagConsultationHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /admin/consultations/:id/refund */
export declare const approveRefundHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /admin/consultations/:id/lawyer/:lawyerId/warn */
export declare const sendLawyerWarningHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /admin/consultations/bulk */
export declare const bulkActionHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /admin/consultations/export */
export declare const exportConsultationsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /admin/consultations/disputes */
export declare const getDisputesHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /admin/consultations/refunds */
export declare const getRefundRequestsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /admin/consultations/flagged */
export declare const getFlaggedConsultationsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /admin/consultations/dashboard */
export declare const getDashboardStatsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /admin/activity/recent */
export declare const getRecentActivityHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /admin/consultations/request/match-requests (or /admin/matches) */
export declare const listMatchRequestsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /admin/matches/:id */
export declare const getMatchRequestHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /admin/consultations/match-requests/:id/assign */
export declare const assignLawyerToMatchHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /admin/consultations/match-requests/:id/accept */
export declare const adminAcceptMatchRequestHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const adminUpdateMatchStatusHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /admin/consultations/match-requests/:id/message */
export declare const sendAdminMatchMessageHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /admin/consultations/match-requests/:id/schedule-call */
export declare const scheduleAdminMatchCallHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /admin/consultations/match-requests/:id/documents */
export declare const adminAddMatchDocumentHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /admin/consultations/match-requests/:id/suggestions */
export declare const getAutoSuggestedLawyersHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /admin/consultations/match-requests/:id/recommend */
export declare const recommendLawyersForMatchHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /admin/consultations/match-requests/:id/auto-suggest */
export declare const autoSuggestAndRecommendHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /admin/consultations/match-requests/bulk-auto-match */
export declare const bulkAutoSuggestHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** POST /admin/consultations/match-requests/:id/expire */
export declare const expireMatchRequestHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /admin/analytics/lawyer-performance */
export declare const getLawyerPerformanceHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** GET /admin/lawyers/top-performers */
export declare const getTopLawyersHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
//# sourceMappingURL=consultation.controller.d.ts.map