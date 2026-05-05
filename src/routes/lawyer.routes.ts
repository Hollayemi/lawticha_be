import { Router } from 'express';
import { protectAdmin } from '../middleware/adminAuth';
import {
  listLawyersHandler,
  getLawyerHandler,
  updateLawyerStatusHandler,
  emailLawyerHandler,
} from '../controllers/lawyer.controller';

const router = Router();

// All lawyer admin routes require a valid admin token
router.use(protectAdmin);

// GET  /admin/lawyers          ,  list with filters + pagination
router.get('/',  listLawyersHandler);

// GET  /admin/lawyers/:id      ,  full lawyer profile
router.get('/:id', getLawyerHandler);

// PATCH /admin/lawyers/:id/status,  suspend / reactivate
router.patch('/:id/status', updateLawyerStatusHandler);

// POST  /admin/lawyers/:id/email ,  send direct email
router.post('/:id/email', emailLawyerHandler);

export default router;
