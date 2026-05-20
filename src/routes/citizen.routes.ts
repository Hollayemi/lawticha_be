import { Router } from 'express';
import { UpdateCitizenProfileHandler } from '../controllers/citizen.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

// GET  /lawyer-profile
// router.post('/lawyer-profile',  submitVerificationHandler);
router.patch('/me/profile',  UpdateCitizenProfileHandler);


export default router;
