"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../../middleware/adminAuth");
const consultation_controller_1 = require("../../controllers/consultation.controller");
const router = (0, express_1.Router)();
// All admin routes require authentication
router.use(adminAuth_1.protectAdmin);
// ========== CONSULTATION ROUTES ==========
// GET /api/v1/admin/consultations/stats - Must be before /:id
router.get('/stats', consultation_controller_1.getConsultationStatsHandler);
// GET /api/v1/admin/consultations/export - Export endpoint
router.get('/export', consultation_controller_1.exportConsultationsHandler);
// POST /api/v1/admin/consultations/bulk - Bulk actions
router.post('/bulk', consultation_controller_1.bulkActionHandler);
// GET /api/v1/admin/consultations - List consultations
router.get('', consultation_controller_1.listConsultationsHandler);
// GET /api/v1/admin/consultations/:id - Get single consultation
router.get('/:id', consultation_controller_1.getConsultationHandler);
// PATCH /api/v1/admin/consultations/:id/status - Update status
router.patch('/:id/status', consultation_controller_1.updateConsultationStatusHandler);
// POST /api/v1/admin/consultations/:id/dispute/resolve - Resolve dispute
router.post('/:id/dispute/resolve', consultation_controller_1.resolveDisputeHandler);
// POST /api/v1/admin/consultations/:id/flag - Flag consultation
router.post('/:id/flag', consultation_controller_1.flagConsultationHandler);
// POST /api/v1/admin/consultations/:id/refund - Approve/reject refund
router.post('/:id/refund', consultation_controller_1.approveRefundHandler);
// POST /api/v1/admin/consultations/:id/lawyer/:lawyerId/warn - Send warning
router.post('/:id/lawyer/:lawyerId/warn', consultation_controller_1.sendLawyerWarningHandler);
// ========== MATCH REQUEST ROUTES ==========
// (Registration order matters: static/bulk paths before '/:id' patterns.)
// POST /api/v1/admin/consultations/match-requests/bulk-auto-match - bulk auto-suggest & recommend
router.post('/match-requests/bulk-auto-match', consultation_controller_1.bulkAutoSuggestHandler);
// GET /api/v1/admin/consultations/request/match-requests - List match requests
router.get('/request/match-requests', consultation_controller_1.listMatchRequestsHandler);
// GET /api/v1/admin/consultations/match-requests/:id - Get single match request
router.get('/match-requests/:id', consultation_controller_1.getMatchRequestHandler);
// GET /api/v1/admin/consultations/match-requests/:id/suggestions - Auto-suggest candidate lawyers (read-only)
router.get('/match-requests/:id/suggestions', consultation_controller_1.getAutoSuggestedLawyersHandler);
// POST /api/v1/admin/consultations/match-requests/:id/auto-match - legacy path, now performs
// auto-suggest + recommend (the citizen still picks who to work with, never auto-booked)
router.post('/match-requests/:id/auto-match', consultation_controller_1.autoSuggestAndRecommendHandler);
// POST /api/v1/admin/consultations/match-requests/:id/accept - Accept for review
router.post('/match-requests/:id/accept', consultation_controller_1.adminAcceptMatchRequestHandler);
// POST /api/v1/admin/consultations/match-requests/:id/message - Send consultation message (message-mode)
router.post('/match-requests/:id/message', consultation_controller_1.sendAdminMatchMessageHandler);
// POST /api/v1/admin/consultations/match-requests/:id/schedule-call - Organize a call/video session
router.post('/match-requests/:id/schedule-call', consultation_controller_1.scheduleAdminMatchCallHandler);
// POST /api/v1/admin/consultations/match-requests/:id/documents - Attach a document or the refined case brief
router.post('/match-requests/:id/documents', consultation_controller_1.adminAddMatchDocumentHandler);
// POST /api/v1/admin/consultations/match-requests/:id/recommend - Send a shortlist of lawyers to the citizen
router.post('/match-requests/:id/recommend', consultation_controller_1.recommendLawyersForMatchHandler);
// POST /api/v1/admin/consultations/match-requests/:id/assign - Directly assign one lawyer (override)
router.post('/match-requests/:id/assign', consultation_controller_1.assignLawyerToMatchHandler);
// POST /api/v1/admin/consultations/match-requests/:id/assign - Directly assign one lawyer (override)
router.patch('/match-requests/:id/status', consultation_controller_1.adminUpdateMatchStatusHandler);
// POST /api/v1/admin/consultations/match-requests/:id/expire - Expire request
router.post('/match-requests/:id/expire', consultation_controller_1.expireMatchRequestHandler);
// ========== LAWYER PERFORMANCE ROUTES ==========
// GET /api/v1/admin/lawyers/performance - Lawyer performance metrics
router.get('/lawyers/performance', consultation_controller_1.getLawyerPerformanceHandler);
// GET /api/v1/admin/lawyers/top-performers - Top lawyers
router.get('/lawyers/top-performers', consultation_controller_1.getTopLawyersHandler);
// ========== DASHBOARD ROUTES ==========
// GET /api/v1/admin/dashboard/stats - Dashboard statistics
router.get('/dashboard/stats', consultation_controller_1.getDashboardStatsHandler);
// GET /api/v1/admin/activity/recent - Recent activity feed
router.get('/activity/recent', consultation_controller_1.getRecentActivityHandler);
exports.default = router;
//# sourceMappingURL=consultation.admin.routes.js.map