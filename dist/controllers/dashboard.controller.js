"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardAnalyticsHandler = exports.getDashboardOverviewHandler = void 0;
const error_1 = require("../middleware/error");
const dashboard_service_1 = require("../services/dashboard.service");
const VALID_PERIODS = ['7d', '30d', '90d', '1y'];
/**
 * GET /admin/dashboard/overview
 * High-level counts for all stat cards.
 */
exports.getDashboardOverviewHandler = (0, error_1.asyncHandler)(async (_req, res, _next) => {
    const data = await (0, dashboard_service_1.getDashboardOverview)();
    return res.data(data, 'Dashboard overview fetched.');
});
/**
 * GET /admin/dashboard/analytics?period=30d
 * Time-series charts, top lawyers, activity feed, pending actions.
 */
exports.getDashboardAnalyticsHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { period = '30d' } = req.query;
    if (!VALID_PERIODS.includes(period)) {
        return next(new error_1.AppError(`Invalid period. Must be one of: ${VALID_PERIODS.join(', ')}.`, 400, 'VALIDATION_ERROR'));
    }
    const data = await (0, dashboard_service_1.getDashboardAnalytics)(period);
    return res.data(data, 'Dashboard analytics fetched.');
});
//# sourceMappingURL=dashboard.controller.js.map