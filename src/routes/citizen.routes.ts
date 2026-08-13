import { Router } from 'express';
import { UpdateCitizenProfileHandler, } from '../controllers/citizen.controller';
import { protect } from '../middleware/auth.middleware';
import { submitVerificationHandler } from '../controllers/lawyer.controller';
import { upload } from '../utils/cloudinary';

const router = Router();

router.use(protect);

router.post('/lawyer-profile',  upload.fields([
    { name: 'documents', maxCount: 10 },
    { name: 'profilePicture', maxCount: 1 }
  ]),  submitVerificationHandler);
router.patch('/me/profile',  UpdateCitizenProfileHandler);

export default router;
