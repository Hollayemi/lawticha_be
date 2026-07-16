import { Router } from 'express';
import { UpdateCitizenProfileHandler, } from '../controllers/citizen.controller';
import { protect } from '../middleware/auth.middleware';
import { submitVerificationHandler } from '../controllers/lawyer.controller';

const router = Router();

router.use(protect);

router.post('/lawyer-profile',  submitVerificationHandler);
router.patch('/me/profile',  UpdateCitizenProfileHandler);

export default router;
