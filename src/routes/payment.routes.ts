import { Router } from 'express';
import PurchaseController from '../controllers/payment.controller';

const router = Router();

router.get('/callback', PurchaseController.paystackCallBackVerify);
router.post('/webhook/:provider', PurchaseController.handleWebhook);

export default router;