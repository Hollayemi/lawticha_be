import { Router } from 'express';
import { protectAdmin } from '../middleware/adminAuth';
import {
  listCitizensHandler,
  getCitizenHandler,
  updateCitizenStatusHandler,
  emailCitizenHandler,
} from '../controllers/citizen.controller';

const router = Router();

// All citizen admin routes require a valid admin token
router.use(protectAdmin);

// GET  /admin/citizens          — list with filters + pagination
router.get('/',  listCitizensHandler);

// GET  /admin/citizens/:id      — full citizen profile
router.get('/:id', getCitizenHandler);

// PATCH /admin/citizens/:id/status — suspend / reactivate / flag
router.patch('/:id/status', updateCitizenStatusHandler);

// POST  /admin/citizens/:id/email  — send direct email
router.post('/:id/email', emailCitizenHandler);

export default router;
