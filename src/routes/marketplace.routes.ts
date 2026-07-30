import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getMarketplaceStatsHandler,
  getMarketplaceStatesHandler,
  getMarketplaceSpecialismsHandler,
  getFilterCountsHandler,
  getMarketplaceLawyersHandler,
  getLawyerByScnNumberHandler,
  bookConsultationHandler,
  requestLawyerMatchHandler,
  getLawyerAvailabilityHandler,
  submitReviewHandler,
} from '../controllers/lawyer.controller';

const router = Router();

// Public marketplace routes (no authentication required)
router.get('/stats', getMarketplaceStatsHandler);
router.get('/states', getMarketplaceStatesHandler);
router.get('/specialisms', getMarketplaceSpecialismsHandler);
router.get('/filter-counts', getFilterCountsHandler);
router.get('/lawyers', getMarketplaceLawyersHandler);
router.get('/lawyers/:scnNumber', getLawyerByScnNumberHandler);
router.get('/lawyers/:scnNumber/availability', getLawyerAvailabilityHandler);

// Protected routes (require authentication)
router.use(protect);
router.post('/consultations', bookConsultationHandler);
router.post('/match-requests', requestLawyerMatchHandler);
router.post('/lawyers/:scnNumber/reviews', submitReviewHandler);

export default router;