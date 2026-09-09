import { Router } from 'express';
import { protectAdmin } from '../../middleware/adminAuth';
import {
  listInstructorRequestsHandler,
  approveInstructorRequestHandler,
  rejectInstructorRequestHandler,
} from '../../controllers/instructor.controller';

const router = Router();

router.use(protectAdmin);

// GET /admin/instructors/requests?status=pending
router.get('/requests', listInstructorRequestsHandler);

// PATCH /admin/instructors/requests/:lawyerProfileId/approve
router.patch('/requests/:lawyerProfileId/approve', approveInstructorRequestHandler);

// PATCH /admin/instructors/requests/:lawyerProfileId/reject
router.patch('/requests/:lawyerProfileId/reject', rejectInstructorRequestHandler);

export default router;
