import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  listLawyersHandler,
  getLawyerStatsHandler,
  getLawyerHandler,
  // Lawyer-facing routes
  getMyProfileHandler,
  updateMyProfileHandler,
  submitVerificationHandler,
  setAvailabilityHandler,

} from '../controllers/lawyer.controller';

const router = Router();

router.get('/lawyers', listLawyersHandler);
router.get('/stats', getLawyerStatsHandler);
router.get('/:id', getLawyerHandler);

// All admin routes require a valid admin token
router.use(protect);
// GET  /api/v1/lawyers/me/profile
router.get('/me/profile', getMyProfileHandler);

// PATCH /api/v1/lawyers/me/profile
router.patch('/me/profile', updateMyProfileHandler);

// POST /api/v1/lawyers/me/verification
router.post('/me/verification', submitVerificationHandler);

// PATCH /api/v1/lawyers/me/availability
router.patch('/me/availability', setAvailabilityHandler);

export default router;