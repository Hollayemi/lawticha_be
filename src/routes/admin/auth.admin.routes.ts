import { Router } from 'express';
import { adminLoginHandler, adminLogoutHandler, adminMeHandler } from '../../controllers/adminAuth.controller';
import { protectAdmin } from '../../middleware/adminAuth';

const router = Router();

//  Public 
router.post('/login',  adminLoginHandler);

//  Protected 
router.use(protectAdmin);
router.post('/logout', adminLogoutHandler);
router.get('/me',      adminMeHandler);

export default router;
