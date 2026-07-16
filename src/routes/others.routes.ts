import { Router } from 'express';
import * as SpacialismController from '../controllers/specialism.controller';

const router = Router();

router.get('/specialisms', SpacialismController.listAllSpeicalism);

export default router;