import { Router } from 'express';
import { protectAdmin } from '../../middleware/adminAuth';
import {
  // Consultation endpoints
  listConsultationsHandler,
  getConsultationHandler,
  getConsultationStatsHandler,
  updateConsultationStatusHandler,
  resolveDisputeHandler,
  flagConsultationHandler,
  approveRefundHandler,
  sendLawyerWarningHandler,
  bulkActionHandler,
  exportConsultationsHandler,
  // Match request endpoints
  listMatchRequestsHandler,
  getMatchRequestHandler,
  assignLawyerToMatchHandler,
  adminUpdateMatchStatusHandler,
  adminAcceptMatchRequestHandler,
  sendAdminMatchMessageHandler,
  scheduleAdminMatchCallHandler,
  adminAddMatchDocumentHandler,
  getAutoSuggestedLawyersHandler,
  recommendLawyersForMatchHandler,
  autoSuggestAndRecommendHandler,
  bulkAutoSuggestHandler,
  expireMatchRequestHandler,
  // Lawyer performance endpoints
  getLawyerPerformanceHandler,
  getTopLawyersHandler,
  // Dashboard endpoints
  getDashboardStatsHandler,
  getRecentActivityHandler,
} from '../../controllers/consultation.controller';

const router = Router();

// All admin routes require authentication
router.use(protectAdmin);

// ========== CONSULTATION ROUTES ==========

// GET /api/v1/admin/consultations/stats - Must be before /:id
router.get('/stats', getConsultationStatsHandler);

// GET /api/v1/admin/consultations/export - Export endpoint
router.get('/export', exportConsultationsHandler);

// POST /api/v1/admin/consultations/bulk - Bulk actions
router.post('/bulk', bulkActionHandler);

// GET /api/v1/admin/consultations - List consultations
router.get('', listConsultationsHandler);

// GET /api/v1/admin/consultations/:id - Get single consultation
router.get('/:id', getConsultationHandler);

// PATCH /api/v1/admin/consultations/:id/status - Update status
router.patch('/:id/status', updateConsultationStatusHandler);

// POST /api/v1/admin/consultations/:id/dispute/resolve - Resolve dispute
router.post('/:id/dispute/resolve', resolveDisputeHandler);

// POST /api/v1/admin/consultations/:id/flag - Flag consultation
router.post('/:id/flag', flagConsultationHandler);

// POST /api/v1/admin/consultations/:id/refund - Approve/reject refund
router.post('/:id/refund', approveRefundHandler);

// POST /api/v1/admin/consultations/:id/lawyer/:lawyerId/warn - Send warning
router.post('/:id/lawyer/:lawyerId/warn', sendLawyerWarningHandler);

// ========== MATCH REQUEST ROUTES ==========
// (Registration order matters: static/bulk paths before '/:id' patterns.)

// POST /api/v1/admin/consultations/match-requests/bulk-auto-match - bulk auto-suggest & recommend
router.post('/match-requests/bulk-auto-match', bulkAutoSuggestHandler);

// GET /api/v1/admin/consultations/request/match-requests - List match requests
router.get('/request/match-requests', listMatchRequestsHandler);

// GET /api/v1/admin/consultations/match-requests/:id - Get single match request
router.get('/match-requests/:id', getMatchRequestHandler);

// GET /api/v1/admin/consultations/match-requests/:id/suggestions - Auto-suggest candidate lawyers (read-only)
router.get('/match-requests/:id/suggestions', getAutoSuggestedLawyersHandler);

// POST /api/v1/admin/consultations/match-requests/:id/auto-match - legacy path, now performs
// auto-suggest + recommend (the citizen still picks who to work with, never auto-booked)
router.post('/match-requests/:id/auto-match', autoSuggestAndRecommendHandler);

// POST /api/v1/admin/consultations/match-requests/:id/accept - Accept for review
router.post('/match-requests/:id/accept', adminAcceptMatchRequestHandler);

// POST /api/v1/admin/consultations/match-requests/:id/message - Send consultation message (message-mode)
router.post('/match-requests/:id/message', sendAdminMatchMessageHandler);

// POST /api/v1/admin/consultations/match-requests/:id/schedule-call - Organize a call/video session
router.post('/match-requests/:id/schedule-call', scheduleAdminMatchCallHandler);

// POST /api/v1/admin/consultations/match-requests/:id/documents - Attach a document or the refined case brief
router.post('/match-requests/:id/documents', adminAddMatchDocumentHandler);

// POST /api/v1/admin/consultations/match-requests/:id/recommend - Send a shortlist of lawyers to the citizen
router.post('/match-requests/:id/recommend', recommendLawyersForMatchHandler);

// POST /api/v1/admin/consultations/match-requests/:id/assign - Directly assign one lawyer (override)
router.post('/match-requests/:id/assign', assignLawyerToMatchHandler);

// POST /api/v1/admin/consultations/match-requests/:id/assign - Directly assign one lawyer (override)
router.patch('/match-requests/:id/status', adminUpdateMatchStatusHandler);

// POST /api/v1/admin/consultations/match-requests/:id/expire - Expire request
router.post('/match-requests/:id/expire', expireMatchRequestHandler);

// ========== LAWYER PERFORMANCE ROUTES ==========

// GET /api/v1/admin/lawyers/performance - Lawyer performance metrics
router.get('/lawyers/performance', getLawyerPerformanceHandler);

// GET /api/v1/admin/lawyers/top-performers - Top lawyers
router.get('/lawyers/top-performers', getTopLawyersHandler);

// ========== DASHBOARD ROUTES ==========

// GET /api/v1/admin/dashboard/stats - Dashboard statistics
router.get('/dashboard/stats', getDashboardStatsHandler);

// GET /api/v1/admin/activity/recent - Recent activity feed
router.get('/activity/recent', getRecentActivityHandler);

export default router;