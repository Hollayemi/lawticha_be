import { Router } from 'express';
import { protectAdmin } from '../../middleware/adminAuth';
import {
  getDashboardOverviewHandler,
  getDashboardAnalyticsHandler,
} from '../../controllers/dashboard.controller';

const router = Router();

// All dashboard routes require a valid admin token
router.use(protectAdmin);

/**
 * GET /api/v1/admin/dashboard/overview
 * Stat-card counts: citizens, lawyers, consultations, revenue, community, library.
 */
router.get('/overview', getDashboardOverviewHandler);

/**
 * GET /api/v1/admin/dashboard/analytics?period=7d|30d|90d|1y
 * Time-series data, top lawyers, recent activity, pending actions.
 */
router.get('/analytics', getDashboardAnalyticsHandler);

export default router;
