import { Request, Response, NextFunction } from 'express';
/**
 * GET /admin/dashboard/overview
 * High-level counts for all stat cards.
 */
export declare const getDashboardOverviewHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /admin/dashboard/analytics?period=30d
 * Time-series charts, top lawyers, activity feed, pending actions.
 */
export declare const getDashboardAnalyticsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
//# sourceMappingURL=dashboard.controller.d.ts.map