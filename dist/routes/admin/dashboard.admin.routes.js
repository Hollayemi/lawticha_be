"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../../middleware/adminAuth");
const dashboard_controller_1 = require("../../controllers/dashboard.controller");
const router = (0, express_1.Router)();
// All dashboard routes require a valid admin token
router.use(adminAuth_1.protectAdmin);
/**
 * GET /api/v1/admin/dashboard/overview
 * Stat-card counts: citizens, lawyers, consultations, revenue, community, library.
 */
router.get('/overview', dashboard_controller_1.getDashboardOverviewHandler);
/**
 * GET /api/v1/admin/dashboard/analytics?period=7d|30d|90d|1y
 * Time-series data, top lawyers, recent activity, pending actions.
 */
router.get('/analytics', dashboard_controller_1.getDashboardAnalyticsHandler);
exports.default = router;
//# sourceMappingURL=dashboard.admin.routes.js.map