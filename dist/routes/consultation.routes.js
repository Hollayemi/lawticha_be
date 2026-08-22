"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const consultation_controller_1 = require("../controllers/consultation.controller");
const cloudinary_1 = require("../utils/cloudinary");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
// ========== UTILITY ROUTES (no specific role required) ==========
// GET /api/v1/consultations/statuses/citizen
// GET /api/v1/consultations/statuses/lawyer
// GET /api/v1/consultations/statuses/admin
router.get('/statuses/:role', consultation_controller_1.getAvailableStatusesHandler);
// ========== CITIZEN (USER) ROUTES ==========
// Patch /api/v1/consultations/pay/:id
router.patch('/pay/:id', consultation_controller_1.consultationPaymentHandler);
// GET /api/v1/consultations/citizen
router.get('/citizen', consultation_controller_1.getCitizenConsultationsHandler);
// GET /api/v1/consultations/citizen/stats
router.get('/citizen/stats', consultation_controller_1.getCitizenStatsHandler);
// ========== CITIZEN MATCH REQUEST ROUTES (firm-assisted flow) ==========
// Registered before the generic '/citizen/:id' route below so 'match-requests'
// isn't swallowed as an :id param.
// GET /api/v1/consultations/citizen/match-requests
router.get('/citizen/match-requests', consultation_controller_1.getCitizenMatchRequestsHandler);
// GET /api/v1/consultations/citizen/match-requests/suggested/:matchRequestId
router.get('/citizen/match-requests/suggested/:matchRequestId', consultation_controller_1.getAutoSuggestedLawyersHandler);
// GET /api/v1/consultations/citizen/match-requests/:id
router.get('/citizen/match-requests/:id', consultation_controller_1.getCitizenMatchRequestHandler);
// POST /api/v1/consultations/citizen/match-requests/:id/documents
router.post('/citizen/match-requests/:id/documents', cloudinary_1.upload.single("file"), consultation_controller_1.addCitizenMatchDocumentHandler);
// POST /api/v1/consultations/citizen/match-requests/:id/select-lawyer
router.post('/citizen/match-requests/:id/select-lawyer', consultation_controller_1.selectRecommendedLawyerHandler);
// GET /api/v1/consultations/citizen/:id
router.get('/citizen/:id', consultation_controller_1.getCitizenConsultationHandler);
// POST /api/v1/consultations/citizen/:id/dispute
router.post('/citizen/:id/dispute', consultation_controller_1.raiseDisputeHandler);
// POST /api/v1/consultations/citizen/:id/refund-request
router.post('/citizen/:id/refund-request', consultation_controller_1.requestRefundHandler);
// POST /api/v1/consultations/citizen/:id/rating
router.post('/citizen/:id/rating', consultation_controller_1.submitRatingHandler);
// POST /api/v1/consultations/citizen/:id/messages
router.post('/citizen/:id/messages', consultation_controller_1.sendCitizenMessageHandler);
// ========== LAWYER ROUTES ==========
// GET /api/v1/consultations/lawyer
router.get('/lawyer', consultation_controller_1.getLawyerConsultationsHandler);
// GET /api/v1/consultations/lawyer/stats
router.get('/lawyer/stats', consultation_controller_1.getLawyerStatsHandler);
// GET /api/v1/consultations/lawyer/:id
router.get('/lawyer/:id', consultation_controller_1.getLawyerConsultationHandler);
// POST /api/v1/consultations/lawyer/:id/accept
router.post('/lawyer/:id/accept', consultation_controller_1.acceptConsultationHandler);
// POST /api/v1/consultations/lawyer/:id/reject
router.post('/lawyer/:id/reject', consultation_controller_1.rejectConsultationHandler);
// POST /api/v1/consultations/lawyer/:id/messages
router.post('/lawyer/:id/messages', consultation_controller_1.sendLawyerMessageHandler);
// POST /api/v1/consultations/lawyer/:id/complete
router.post('/lawyer/:id/complete', consultation_controller_1.completeConsultationHandler);
// ========== MATCH REQUEST ROUTES (lawyer-facing) ==========
// GET /api/v1/consultations/matches
router.get('/matches', consultation_controller_1.getMatchRequestsHandler);
// POST /api/v1/consultations/matches/:id/accept
// router.post('/matches/:id/accept', acceptMatchRequestHandler);
// POST /api/v1/consultations/matches/:id/reject
// router.post('/matches/:id/reject', rejectMatchRequestHandler);
exports.default = router;
//# sourceMappingURL=consultation.routes.js.map