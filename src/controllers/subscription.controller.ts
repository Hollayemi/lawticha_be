import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';
import {
  listPublicPlans,
  getMySubscription,
  subscribeToPlan,
  changePlan,
  cancelSubscription,
  reactivateSubscription,
  updateAutoRenew,
  getMyBillingHistory,
  getMyInvoiceById,
  adminListPlans,
  adminGetPlanById,
  adminCreatePlan,
  adminUpdatePlan,
  adminDeletePlan,
  adminListSubscribers,
  adminGetSubscriberById,
  adminUpdateSubscriber,
  adminDeleteSubscriber,
  adminListInvoices,
  adminGetInvoiceById,
  adminUpdateInvoice,
  adminDeleteInvoice,
  adminGetSubscriptionStats,
} from '../services/subscription.service';
import { BillingInterval } from '../models/types/billing.types';

function adminCtx(req: Request) {
  const admin = req.admin!;
  return { adminId: admin.id, adminName: admin.name };
}

function userId(req: Request) {
  return (req as any).user?._id?.toString();
}

function assertValidInterval(interval: string | undefined, next: NextFunction): boolean {
  if (interval && !Object.values(BillingInterval).includes(interval as BillingInterval)) {
    next(
      new AppError(
        `interval must be one of: ${Object.values(BillingInterval).join(', ')}`,
        400,
        'VALIDATION_ERROR'
      )
    );
    return false;
  }
  return true;
}

// ==================== CITIZEN: PLANS ====================

// GET /api/v1/citizens/me/subscription/plans
export const listPlansHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { interval } = req.query as Record<string, string>;
    const plans = await listPublicPlans(interval as BillingInterval | undefined);
    return (res as AppResponse).data(plans, 'Plans fetched successfully');
  }
);

// ==================== CITIZEN: MY SUBSCRIPTION ====================

// GET /api/v1/citizens/me/subscription
export const getMySubscriptionHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const subscription = await getMySubscription(userId(req));
    return (res as AppResponse).data(subscription, 'Subscription fetched successfully');
  }
);

// POST /api/v1/citizens/me/subscription/subscribe
export const subscribeHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { planId, interval, autoRenew, promoCode } = req.body as Record<string, any>;

    if (!planId) return next(new AppError('planId is required', 400, 'VALIDATION_ERROR'));
    if (!interval) return next(new AppError('interval is required', 400, 'VALIDATION_ERROR'));
    if (!assertValidInterval(interval, next)) return;

    const result = await subscribeToPlan(userId(req), { planId, interval, autoRenew, promoCode });
    return (res as AppResponse).data(result, 'Subscription initiated. Complete payment to activate.');
  }
);

// POST /api/v1/citizens/me/subscription/change-plan
export const changePlanHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { planId, interval } = req.body as Record<string, any>;

    if (!planId) return next(new AppError('planId is required', 400, 'VALIDATION_ERROR'));
    if (!assertValidInterval(interval, next)) return;

    const result = await changePlan(userId(req), { planId, interval });
    return (res as AppResponse).data(result, 'Plan change initiated. Complete payment to switch.');
  }
);

// POST /api/v1/citizens/me/subscription/cancel
export const cancelSubscriptionHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { reason, immediate } = req.body as Record<string, any>;
    const subscription = await cancelSubscription(userId(req), reason, Boolean(immediate));
    return (res as AppResponse).data(subscription, 'Subscription cancelled successfully');
  }
);

// POST /api/v1/citizens/me/subscription/reactivate
export const reactivateSubscriptionHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const subscription = await reactivateSubscription(userId(req));
    return (res as AppResponse).data(subscription, 'Subscription reactivated successfully');
  }
);

// PUT /api/v1/citizens/me/subscription/auto-renew
export const updateAutoRenewHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { autoRenew } = req.body as Record<string, any>;
    if (autoRenew === undefined) {
      return next(new AppError('autoRenew is required', 400, 'VALIDATION_ERROR'));
    }
    const subscription = await updateAutoRenew(userId(req), Boolean(autoRenew));
    return (res as AppResponse).data(subscription, 'Auto-renew preference updated');
  }
);

// ==================== CITIZEN: BILLING HISTORY ====================

// GET /api/v1/citizens/me/billing-history
export const getBillingHistoryHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { page, pageSize } = req.query as Record<string, string>;
    const result = await getMyBillingHistory(
      userId(req),
      page ? Number(page) : undefined,
      pageSize ? Number(pageSize) : undefined
    );
    return (res as AppResponse).data(result, 'Billing history fetched successfully');
  }
);

// GET /api/v1/citizens/me/subscription/invoice/:invoiceId
export const getInvoiceHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const invoice = await getMyInvoiceById(userId(req), req.params.invoiceId);
    return (res as AppResponse).data(invoice, 'Invoice fetched successfully');
  }
);

// ==================== ADMIN: PLANS ====================

// GET /api/v1/admin/subscriptions/plans
export const adminListPlansHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { isActive, interval, search, page, pageSize } = req.query as Record<string, string>;
    const result = await adminListPlans({
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      interval: interval as BillingInterval | undefined,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return (res as AppResponse).data(result, 'Plans fetched successfully');
  }
);

// GET /api/v1/admin/subscriptions/plans/:id
export const adminGetPlanHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const plan = await adminGetPlanById(req.params.id);
    return (res as AppResponse).data(plan, 'Plan fetched successfully');
  }
);

// POST /api/v1/admin/subscriptions/plans
export const adminCreatePlanHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, description, price, interval, features, isPopular, badge, isActive } = req.body;

    if (!name) return next(new AppError('name is required', 400, 'VALIDATION_ERROR'));
    if (!description) return next(new AppError('description is required', 400, 'VALIDATION_ERROR'));
    if (price === undefined) return next(new AppError('price is required', 400, 'VALIDATION_ERROR'));
    if (!interval) return next(new AppError('interval is required', 400, 'VALIDATION_ERROR'));
    if (!assertValidInterval(interval, next)) return;
    if (price < 0) return next(new AppError('price cannot be negative', 400, 'VALIDATION_ERROR'));

    const plan = await adminCreatePlan(
      { name, description, price, interval, features, isPopular, badge, isActive },
      adminCtx(req)
    );
    return (res as AppResponse).data(plan, 'Plan created successfully', 201);
  }
);

// PATCH /api/v1/admin/subscriptions/plans/:id
export const adminUpdatePlanHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!assertValidInterval(req.body?.interval, next)) return;

    const plan = await adminUpdatePlan(req.params.id, req.body, adminCtx(req));
    return (res as AppResponse).data(plan, 'Plan updated successfully');
  }
);

// DELETE /api/v1/admin/subscriptions/plans/:id
export const adminDeletePlanHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await adminDeletePlan(req.params.id, adminCtx(req));
    return (res as AppResponse).success(result.message);
  }
);

// ==================== ADMIN: SUBSCRIBERS ====================

// GET /api/v1/admin/subscriptions/subscribers
export const adminListSubscribersHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { status, planId, search, page, pageSize } = req.query as Record<string, string>;
    const result = await adminListSubscribers({
      status: status as any,
      planId,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return (res as AppResponse).data(result, 'Subscribers fetched successfully');
  }
);

// GET /api/v1/admin/subscriptions/subscribers/:id
export const adminGetSubscriberHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const subscription = await adminGetSubscriberById(req.params.id);
    return (res as AppResponse).data(subscription, 'Subscriber fetched successfully');
  }
);

// PATCH /api/v1/admin/subscriptions/subscribers/:id
export const adminUpdateSubscriberHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const subscription = await adminUpdateSubscriber(req.params.id, req.body, adminCtx(req));
    return (res as AppResponse).data(subscription, 'Subscriber updated successfully');
  }
);

// DELETE /api/v1/admin/subscriptions/subscribers/:id
export const adminDeleteSubscriberHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await adminDeleteSubscriber(req.params.id, adminCtx(req));
    return (res as AppResponse).success(result.message);
  }
);

// ==================== ADMIN: INVOICES ====================

// GET /api/v1/admin/subscriptions/invoices
export const adminListInvoicesHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { userId: uid, status, startDate, endDate, page, pageSize } = req.query as Record<string, string>;
    const result = await adminListInvoices({
      userId: uid,
      status: status as any,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return (res as AppResponse).data(result, 'Invoices fetched successfully');
  }
);

// GET /api/v1/admin/subscriptions/invoices/:id
export const adminGetInvoiceHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const invoice = await adminGetInvoiceById(req.params.id);
    return (res as AppResponse).data(invoice, 'Invoice fetched successfully');
  }
);

// PATCH /api/v1/admin/subscriptions/invoices/:id
export const adminUpdateInvoiceHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const invoice = await adminUpdateInvoice(req.params.id, req.body, adminCtx(req));
    return (res as AppResponse).data(invoice, 'Invoice updated successfully');
  }
);

// DELETE /api/v1/admin/subscriptions/invoices/:id
export const adminDeleteInvoiceHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await adminDeleteInvoice(req.params.id);
    return (res as AppResponse).success(result.message);
  }
);

// ==================== ADMIN: STATS ====================

// GET /api/v1/admin/subscriptions/stats
export const adminGetSubscriptionStatsHandler = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await adminGetSubscriptionStats();
    return (res as AppResponse).data(stats, 'Subscription stats fetched successfully');
  }
);
