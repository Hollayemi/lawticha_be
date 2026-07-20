import { Router } from 'express';
import { protectAdmin } from '../../middleware/adminAuth';
import {
  adminListPlansHandler,
  adminGetPlanHandler,
  adminCreatePlanHandler,
  adminUpdatePlanHandler,
  adminDeletePlanHandler,
  adminListSubscribersHandler,
  adminGetSubscriberHandler,
  adminUpdateSubscriberHandler,
  adminDeleteSubscriberHandler,
  adminListInvoicesHandler,
  adminGetInvoiceHandler,
  adminUpdateInvoiceHandler,
  adminDeleteInvoiceHandler,
  adminGetSubscriptionStatsHandler,
} from '../../controllers/subscription.controller';

const router = Router();

// All subscription admin routes require a valid admin token
router.use(protectAdmin);

// Stats
router.get('/stats', adminGetSubscriptionStatsHandler);

// Plans
router.get('/plans', adminListPlansHandler);
router.get('/plans/:id', adminGetPlanHandler);
router.post('/plans', adminCreatePlanHandler);
router.patch('/plans/:id', adminUpdatePlanHandler);
router.delete('/plans/:id', adminDeletePlanHandler);

// Subscribers
router.get('/subscribers', adminListSubscribersHandler);
router.get('/subscribers/:id', adminGetSubscriberHandler);
router.patch('/subscribers/:id', adminUpdateSubscriberHandler);
router.delete('/subscribers/:id', adminDeleteSubscriberHandler);

// Invoices
router.get('/invoices', adminListInvoicesHandler);
router.get('/invoices/:id', adminGetInvoiceHandler);
router.patch('/invoices/:id', adminUpdateInvoiceHandler);
router.delete('/invoices/:id', adminDeleteInvoiceHandler);

export default router;
