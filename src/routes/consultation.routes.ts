import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  // Citizen (user) routes
  getCitizenConsultationsHandler,
  getCitizenStatsHandler,
  getCitizenConsultationHandler,
  raiseDisputeHandler,
  requestRefundHandler,
  submitRatingHandler,
  sendCitizenMessageHandler,
  consultationPaymentHandler,

  // Citizen match-request routes
  getCitizenMatchRequestsHandler,
  getCitizenMatchRequestHandler,
  addCitizenMatchDocumentHandler,
  getAutoSuggestedLawyersHandler,
  selectRecommendedLawyerHandler,

  // Lawyer routes
  getLawyerConsultationsHandler,
  getLawyerStatsHandler,
  getLawyerConsultationHandler,
  acceptConsultationHandler,
  rejectConsultationHandler,
  sendLawyerMessageHandler,
  completeConsultationHandler,
  
  // Match request routes (lawyer-facing)
  getMatchRequestsHandler,
  acceptMatchRequestHandler,
  rejectMatchRequestHandler,
  
  // Utility routes
  getAvailableStatusesHandler,
} from '../controllers/consultation.controller';
import { upload } from '../utils/cloudinary';

const router = Router();
router.use(protect);

// ========== UTILITY ROUTES (no specific role required) ==========
// GET /api/v1/consultations/statuses/citizen
// GET /api/v1/consultations/statuses/lawyer
// GET /api/v1/consultations/statuses/admin
router.get('/statuses/:role', getAvailableStatusesHandler);

// ========== CITIZEN (USER) ROUTES ==========
// Patch /api/v1/consultations/pay/:id
router.patch('/pay/:id', consultationPaymentHandler);

// GET /api/v1/consultations/citizen
router.get('/citizen', getCitizenConsultationsHandler);

// GET /api/v1/consultations/citizen/stats
router.get('/citizen/stats', getCitizenStatsHandler);

// ========== CITIZEN MATCH REQUEST ROUTES (firm-assisted flow) ==========
// Registered before the generic '/citizen/:id' route below so 'match-requests'
// isn't swallowed as an :id param.

// GET /api/v1/consultations/citizen/match-requests
router.get('/citizen/match-requests', getCitizenMatchRequestsHandler);

// GET /api/v1/consultations/citizen/match-requests/suggested/:matchRequestId
router.get('/citizen/match-requests/suggested/:matchRequestId', getAutoSuggestedLawyersHandler);

// GET /api/v1/consultations/citizen/match-requests/:id
router.get('/citizen/match-requests/:id', getCitizenMatchRequestHandler);

// POST /api/v1/consultations/citizen/match-requests/:id/documents
router.post('/citizen/match-requests/:id/documents', upload.single("file"), addCitizenMatchDocumentHandler);

// POST /api/v1/consultations/citizen/match-requests/:id/select-lawyer
router.post('/citizen/match-requests/:id/select-lawyer', selectRecommendedLawyerHandler);

// GET /api/v1/consultations/citizen/:id
router.get('/citizen/:id', getCitizenConsultationHandler);

// POST /api/v1/consultations/citizen/:id/dispute
router.post('/citizen/:id/dispute', raiseDisputeHandler);

// POST /api/v1/consultations/citizen/:id/refund-request
router.post('/citizen/:id/refund-request', requestRefundHandler);

// POST /api/v1/consultations/citizen/:id/rating
router.post('/citizen/:id/rating', submitRatingHandler);

// POST /api/v1/consultations/citizen/:id/messages
router.post('/citizen/:id/messages', sendCitizenMessageHandler);

// ========== LAWYER ROUTES ==========

// GET /api/v1/consultations/lawyer
router.get('/lawyer', getLawyerConsultationsHandler);

// GET /api/v1/consultations/lawyer/stats
router.get('/lawyer/stats', getLawyerStatsHandler);

// GET /api/v1/consultations/lawyer/:id
router.get('/lawyer/:id', getLawyerConsultationHandler);

// POST /api/v1/consultations/lawyer/:id/accept
router.post('/lawyer/:id/accept', acceptConsultationHandler);

// POST /api/v1/consultations/lawyer/:id/reject
router.post('/lawyer/:id/reject', rejectConsultationHandler);

// POST /api/v1/consultations/lawyer/:id/messages
router.post('/lawyer/:id/messages', sendLawyerMessageHandler);

// POST /api/v1/consultations/lawyer/:id/complete
router.post('/lawyer/:id/complete', completeConsultationHandler);

// ========== MATCH REQUEST ROUTES (lawyer-facing) ==========

// GET /api/v1/consultations/matches
router.get('/matches', getMatchRequestsHandler);

// POST /api/v1/consultations/matches/:id/accept
router.post('/matches/:id/accept', acceptMatchRequestHandler);

// POST /api/v1/consultations/matches/:id/reject
router.post('/matches/:id/reject', rejectMatchRequestHandler);

export default router;