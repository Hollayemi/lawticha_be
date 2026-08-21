"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetSubscriptionStatsHandler = exports.adminDeleteInvoiceHandler = exports.adminUpdateInvoiceHandler = exports.adminGetInvoiceHandler = exports.adminListInvoicesHandler = exports.adminDeleteSubscriberHandler = exports.adminUpdateSubscriberHandler = exports.adminGetSubscriberHandler = exports.adminListSubscribersHandler = exports.adminDeletePlanHandler = exports.adminUpdatePlanHandler = exports.adminCreatePlanHandler = exports.adminGetPlanHandler = exports.adminListPlansHandler = exports.getInvoiceHandler = exports.getBillingHistoryHandler = exports.updateAutoRenewHandler = exports.reactivateSubscriptionHandler = exports.cancelSubscriptionHandler = exports.changePlanHandler = exports.subscribeHandler = exports.getMySubscriptionHandler = exports.listPlansHandler = void 0;
const error_1 = require("../middleware/error");
const subscription_service_1 = require("../services/subscription.service");
const billing_types_1 = require("../models/types/billing.types");
function adminCtx(req) {
    const admin = req.admin;
    return { adminId: admin.id, adminName: admin.name };
}
function userId(req) {
    return req.user?._id?.toString();
}
function assertValidInterval(interval, next) {
    if (interval && !Object.values(billing_types_1.BillingInterval).includes(interval)) {
        next(new error_1.AppError(`interval must be one of: ${Object.values(billing_types_1.BillingInterval).join(', ')}`, 400, 'VALIDATION_ERROR'));
        return false;
    }
    return true;
}
// ==================== CITIZEN: PLANS ====================
// GET /api/v1/citizens/me/subscription/plans
exports.listPlansHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { interval } = req.query;
    const plans = await (0, subscription_service_1.listPublicPlans)(interval);
    return res.data(plans, 'Plans fetched successfully');
});
// ==================== CITIZEN: MY SUBSCRIPTION ====================
// GET /api/v1/citizens/me/subscription
exports.getMySubscriptionHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const subscription = await (0, subscription_service_1.getMySubscription)(userId(req));
    return res.data(subscription, 'Subscription fetched successfully');
});
// POST /api/v1/citizens/me/subscription/subscribe
exports.subscribeHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { planId, interval, autoRenew, promoCode } = req.body;
    if (!planId)
        return next(new error_1.AppError('planId is required', 400, 'VALIDATION_ERROR'));
    if (!interval)
        return next(new error_1.AppError('interval is required', 400, 'VALIDATION_ERROR'));
    if (!assertValidInterval(interval, next))
        return;
    const result = await (0, subscription_service_1.subscribeToPlan)(userId(req), { planId, interval, autoRenew, promoCode });
    return res.data(result, 'Subscription initiated. Complete payment to activate.');
});
// POST /api/v1/citizens/me/subscription/change-plan
exports.changePlanHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { planId, interval } = req.body;
    if (!planId)
        return next(new error_1.AppError('planId is required', 400, 'VALIDATION_ERROR'));
    if (!assertValidInterval(interval, next))
        return;
    const result = await (0, subscription_service_1.changePlan)(userId(req), { planId, interval });
    return res.data(result, 'Plan change initiated. Complete payment to switch.');
});
// POST /api/v1/citizens/me/subscription/cancel
exports.cancelSubscriptionHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { reason, immediate } = req.body;
    const subscription = await (0, subscription_service_1.cancelSubscription)(userId(req), reason, Boolean(immediate));
    return res.data(subscription, 'Subscription cancelled successfully');
});
// POST /api/v1/citizens/me/subscription/reactivate
exports.reactivateSubscriptionHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const subscription = await (0, subscription_service_1.reactivateSubscription)(userId(req));
    return res.data(subscription, 'Subscription reactivated successfully');
});
// PUT /api/v1/citizens/me/subscription/auto-renew
exports.updateAutoRenewHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { autoRenew } = req.body;
    if (autoRenew === undefined) {
        return next(new error_1.AppError('autoRenew is required', 400, 'VALIDATION_ERROR'));
    }
    const subscription = await (0, subscription_service_1.updateAutoRenew)(userId(req), Boolean(autoRenew));
    return res.data(subscription, 'Auto-renew preference updated');
});
// ==================== CITIZEN: BILLING HISTORY ====================
// GET /api/v1/citizens/me/billing-history
exports.getBillingHistoryHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { page, pageSize } = req.query;
    const result = await (0, subscription_service_1.getMyBillingHistory)(userId(req), page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined);
    return res.data(result, 'Billing history fetched successfully');
});
// GET /api/v1/citizens/me/subscription/invoice/:invoiceId
exports.getInvoiceHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const invoice = await (0, subscription_service_1.getMyInvoiceById)(userId(req), req.params.invoiceId);
    return res.data(invoice, 'Invoice fetched successfully');
});
// ==================== ADMIN: PLANS ====================
// GET /api/v1/admin/subscriptions/plans
exports.adminListPlansHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { isActive, interval, search, page, pageSize } = req.query;
    const result = await (0, subscription_service_1.adminListPlans)({
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        interval: interval,
        search,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return res.data(result, 'Plans fetched successfully');
});
// GET /api/v1/admin/subscriptions/plans/:id
exports.adminGetPlanHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const plan = await (0, subscription_service_1.adminGetPlanById)(req.params.id);
    return res.data(plan, 'Plan fetched successfully');
});
// POST /api/v1/admin/subscriptions/plans
exports.adminCreatePlanHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { name, description, price, interval, features, isPopular, badge, isActive } = req.body;
    if (!name)
        return next(new error_1.AppError('name is required', 400, 'VALIDATION_ERROR'));
    if (!description)
        return next(new error_1.AppError('description is required', 400, 'VALIDATION_ERROR'));
    if (price === undefined)
        return next(new error_1.AppError('price is required', 400, 'VALIDATION_ERROR'));
    if (!interval)
        return next(new error_1.AppError('interval is required', 400, 'VALIDATION_ERROR'));
    if (!assertValidInterval(interval, next))
        return;
    if (price < 0)
        return next(new error_1.AppError('price cannot be negative', 400, 'VALIDATION_ERROR'));
    const plan = await (0, subscription_service_1.adminCreatePlan)({ name, description, price, interval, features, isPopular, badge, isActive }, adminCtx(req));
    return res.data(plan, 'Plan created successfully', 201);
});
// PATCH /api/v1/admin/subscriptions/plans/:id
exports.adminUpdatePlanHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    if (!assertValidInterval(req.body?.interval, next))
        return;
    const plan = await (0, subscription_service_1.adminUpdatePlan)(req.params.id, req.body, adminCtx(req));
    return res.data(plan, 'Plan updated successfully');
});
// DELETE /api/v1/admin/subscriptions/plans/:id
exports.adminDeletePlanHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await (0, subscription_service_1.adminDeletePlan)(req.params.id, adminCtx(req));
    return res.success(result.message);
});
// ==================== ADMIN: SUBSCRIBERS ====================
// GET /api/v1/admin/subscriptions/subscribers
exports.adminListSubscribersHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { status, planId, search, page, pageSize } = req.query;
    const result = await (0, subscription_service_1.adminListSubscribers)({
        status: status,
        planId,
        search,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return res.data(result, 'Subscribers fetched successfully');
});
// GET /api/v1/admin/subscriptions/subscribers/:id
exports.adminGetSubscriberHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const subscription = await (0, subscription_service_1.adminGetSubscriberById)(req.params.id);
    return res.data(subscription, 'Subscriber fetched successfully');
});
// PATCH /api/v1/admin/subscriptions/subscribers/:id
exports.adminUpdateSubscriberHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const subscription = await (0, subscription_service_1.adminUpdateSubscriber)(req.params.id, req.body, adminCtx(req));
    return res.data(subscription, 'Subscriber updated successfully');
});
// DELETE /api/v1/admin/subscriptions/subscribers/:id
exports.adminDeleteSubscriberHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await (0, subscription_service_1.adminDeleteSubscriber)(req.params.id, adminCtx(req));
    return res.success(result.message);
});
// ==================== ADMIN: INVOICES ====================
// GET /api/v1/admin/subscriptions/invoices
exports.adminListInvoicesHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { userId: uid, status, startDate, endDate, page, pageSize } = req.query;
    const result = await (0, subscription_service_1.adminListInvoices)({
        userId: uid,
        status: status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return res.data(result, 'Invoices fetched successfully');
});
// GET /api/v1/admin/subscriptions/invoices/:id
exports.adminGetInvoiceHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const invoice = await (0, subscription_service_1.adminGetInvoiceById)(req.params.id);
    return res.data(invoice, 'Invoice fetched successfully');
});
// PATCH /api/v1/admin/subscriptions/invoices/:id
exports.adminUpdateInvoiceHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const invoice = await (0, subscription_service_1.adminUpdateInvoice)(req.params.id, req.body, adminCtx(req));
    return res.data(invoice, 'Invoice updated successfully');
});
// DELETE /api/v1/admin/subscriptions/invoices/:id
exports.adminDeleteInvoiceHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await (0, subscription_service_1.adminDeleteInvoice)(req.params.id);
    return res.success(result.message);
});
// ==================== ADMIN: STATS ====================
// GET /api/v1/admin/subscriptions/stats
exports.adminGetSubscriptionStatsHandler = (0, error_1.asyncHandler)(async (_req, res, _next) => {
    const stats = await (0, subscription_service_1.adminGetSubscriptionStats)();
    return res.data(stats, 'Subscription stats fetched successfully');
});
//# sourceMappingURL=subscription.controller.js.map