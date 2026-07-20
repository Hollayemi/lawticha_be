import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  listPlansHandler,
  getMySubscriptionHandler,
  subscribeHandler,
  changePlanHandler,
  cancelSubscriptionHandler,
  reactivateSubscriptionHandler,
  updateAutoRenewHandler,
  getBillingHistoryHandler,
  getInvoiceHandler,
} from '../controllers/subscription.controller';

const router = Router();

// All routes here require a logged-in citizen
router.use(protect);

// GET   /api/v1/citizens/subscription/plans
router.get('/subscription/plans', listPlansHandler);

// GET   /api/v1/citizens/subscription
router.get('/subscription', getMySubscriptionHandler);

// POST  /api/v1/citizens/subscription/subscribe
router.post('/subscription/subscribe', subscribeHandler);

// POST  /api/v1/citizens/subscription/change-plan
router.post('/subscription/change-plan', changePlanHandler);

// POST  /api/v1/citizens/subscription/cancel
router.post('/subscription/cancel', cancelSubscriptionHandler);

// POST  /api/v1/citizens/subscription/reactivate
router.post('/subscription/reactivate', reactivateSubscriptionHandler);

// PUT   /api/v1/citizens/subscription/auto-renew
router.put('/subscription/auto-renew', updateAutoRenewHandler);

// GET   /api/v1/citizens/subscription/invoice/:invoiceId
router.get('/subscription/invoice/:invoiceId', getInvoiceHandler);

// GET   /api/v1/citizens/billing-history
router.get('/billing-history', getBillingHistoryHandler);

export default router;
