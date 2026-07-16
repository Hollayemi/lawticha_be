import { Router } from 'express';
import { protectAdmin } from '../../middleware/adminAuth';
import {
  // Lawyer-facing routes
  getMyProfileHandler,
  updateMyProfileHandler,
  submitVerificationHandler,
  setAvailabilityHandler,
  
  // Admin routes
  listLawyersHandler,
  getLawyerStatsHandler,
  getLawyerHandler,
  advanceVerificationHandler,
  rejectVerificationHandler,
  verifyDocumentHandler,
  updateLawyerStatusHandler,
  emailLawyerHandler,
} from '../../controllers/lawyer.controller';

const router = Router();

// GET  /api/v1/lawyers/me/profile
router.get('/me/profile', getMyProfileHandler);

// PATCH /api/v1/lawyers/me/profile
router.patch('/me/profile', updateMyProfileHandler);

// POST /api/v1/lawyers/me/verification
router.post('/me/verification', submitVerificationHandler);

// PATCH /api/v1/lawyers/me/availability
router.patch('/me/availability', setAvailabilityHandler);

// All admin routes require a valid admin token
router.use(protectAdmin);

// GET  /admin/lawyers          - list with filters + pagination
router.get('/', listLawyersHandler);

// GET  /admin/lawyers/stats    - get lawyer statistics
router.get('/stats', getLawyerStatsHandler);

// GET  /admin/lawyers/:id      - full lawyer profile
router.get('/:id', getLawyerHandler);

// POST /admin/lawyers/:id/verification/advance - move verification to next stage
router.post('/:id/verification/advance', advanceVerificationHandler);

// POST /admin/lawyers/:id/verification/reject - reject verification application
router.post('/:id/verification/reject', rejectVerificationHandler);

// PATCH /admin/lawyers/:id/documents/:docId - verify/reject specific document
router.patch('/:id/documents/:docId', verifyDocumentHandler);

// PATCH /admin/lawyers/:id/status - suspend/reactivate lawyer
router.patch('/:id/status', updateLawyerStatusHandler);

// POST /admin/lawyers/:id/email - send direct email to lawyer
router.post('/:id/email', emailLawyerHandler);

export default router;