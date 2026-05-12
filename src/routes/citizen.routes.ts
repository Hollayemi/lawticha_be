import { Router } from 'express';
import { protectAdmin } from '../middleware/adminAuth';
import { submitVerificationHandler } from '../controllers/lawyer.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

// GET  /lawyer-profile
router.post('/lawyer-profile',  submitVerificationHandler);


export default router;
