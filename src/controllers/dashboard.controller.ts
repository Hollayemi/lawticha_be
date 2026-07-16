import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';
import { getDashboardOverview, getDashboardAnalytics } from '../services/dashboard.service';

type Period = '7d' | '30d' | '90d' | '1y';
const VALID_PERIODS: Period[] = ['7d', '30d', '90d', '1y'];

/**
 * GET /admin/dashboard/overview
 * High-level counts for all stat cards.
 */
export const getDashboardOverviewHandler = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await getDashboardOverview();
    return (res as AppResponse).data(data, 'Dashboard overview fetched.');
  }
);

/**
 * GET /admin/dashboard/analytics?period=30d
 * Time-series charts, top lawyers, activity feed, pending actions.
 */
export const getDashboardAnalyticsHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { period = '30d' } = req.query as { period?: string };

    if (!VALID_PERIODS.includes(period as Period)) {
      return next(
        new AppError(
          `Invalid period. Must be one of: ${VALID_PERIODS.join(', ')}.`,
          400,
          'VALIDATION_ERROR'
        )
      );
    }

    const data = await getDashboardAnalytics(period as Period);
    return (res as AppResponse).data(data, 'Dashboard analytics fetched.');
  }
);
