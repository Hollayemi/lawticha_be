"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPublicPlans = listPublicPlans;
exports.getMySubscription = getMySubscription;
exports.subscribeToPlan = subscribeToPlan;
exports.changePlan = changePlan;
exports.cancelSubscription = cancelSubscription;
exports.reactivateSubscription = reactivateSubscription;
exports.updateAutoRenew = updateAutoRenew;
exports.getMyBillingHistory = getMyBillingHistory;
exports.getMyInvoiceById = getMyInvoiceById;
exports.activateSubscriptionFromPayment = activateSubscriptionFromPayment;
exports.adminListPlans = adminListPlans;
exports.adminGetPlanById = adminGetPlanById;
exports.adminCreatePlan = adminCreatePlan;
exports.adminUpdatePlan = adminUpdatePlan;
exports.adminDeletePlan = adminDeletePlan;
exports.adminListSubscribers = adminListSubscribers;
exports.adminGetSubscriberById = adminGetSubscriberById;
exports.adminUpdateSubscriber = adminUpdateSubscriber;
exports.adminDeleteSubscriber = adminDeleteSubscriber;
exports.adminListInvoices = adminListInvoices;
exports.adminGetInvoiceById = adminGetInvoiceById;
exports.adminUpdateInvoice = adminUpdateInvoice;
exports.adminDeleteInvoice = adminDeleteInvoice;
exports.adminGetSubscriptionStats = adminGetSubscriptionStats;
const mongoose_1 = require("mongoose");
const SubscriptionPlan_model_1 = require("../models/SubscriptionPlan.model");
const Subscription_model_1 = require("../models/Subscription.model");
const BillingHistory_model_1 = require("../models/BillingHistory.model");
const User_model_1 = require("../models/User.model");
const Admin_model_1 = require("../models/Admin.model");
const types_1 = require("../models/types");
const error_1 = require("../middleware/error");
const payment_1 = __importDefault(require("./payment/payment"));
const billing_types_1 = require("../models/types/billing.types");
const notification_1 = __importDefault(require("../controllers/others/notification"));
//  Helpers 
function addInterval(date, interval) {
    const result = new Date(date);
    if (interval === billing_types_1.BillingInterval.YEARLY) {
        result.setFullYear(result.getFullYear() + 1);
    }
    else {
        result.setMonth(result.getMonth() + 1);
    }
    return result;
}
async function assertPlanUsable(planId) {
    const plan = await SubscriptionPlan_model_1.SubscriptionPlanModel.findById(planId);
    if (!plan)
        throw new error_1.AppError('Subscription plan not found.', 404, 'PLAN_NOT_FOUND');
    if (!plan.isActive)
        throw new error_1.AppError('This plan is no longer available.', 400, 'PLAN_INACTIVE');
    return plan;
}
// ==================== PUBLIC / CITIZEN: PLANS ====================
async function listPublicPlans(interval) {
    const filter = { isActive: true };
    if (interval)
        filter.interval = interval;
    return SubscriptionPlan_model_1.SubscriptionPlanModel.find(filter).sort({ price: 1 });
}
// ==================== CITIZEN: MY SUBSCRIPTION ====================
async function getMySubscription(userId) {
    const subscription = await Subscription_model_1.SubscriptionModel.findOne({ userId })
        .sort({ createdAt: -1 })
        .populate('planId');
    if (!subscription)
        return null;
    return subscription;
}
async function subscribeToPlan(userId, payload) {
    const { planId, interval, autoRenew = true, promoCode } = payload;
    const user = await User_model_1.UserModel.findById(userId);
    if (!user)
        throw new error_1.AppError('User not found.', 404, 'NOT_FOUND');
    const plan = await assertPlanUsable(planId);
    const existingActive = await Subscription_model_1.SubscriptionModel.findOne({
        userId,
        status: { $in: [billing_types_1.SubscriptionStatus.ACTIVE, billing_types_1.SubscriptionStatus.PENDING] },
    });
    if (existingActive) {
        throw new error_1.AppError('You already have an active or pending subscription. Use change-plan to switch plans.', 400, 'SUBSCRIPTION_EXISTS');
    }
    const chosenInterval = interval || plan.interval;
    const now = new Date();
    const subscription = await Subscription_model_1.SubscriptionModel.create({
        userId,
        planId: plan._id,
        planName: plan.name,
        status: billing_types_1.SubscriptionStatus.PENDING,
        startDate: now,
        endDate: addInterval(now, chosenInterval),
        autoRenew,
        price: plan.price,
        interval: chosenInterval,
        pendingPlanId: plan._id,
        provider: 'paystack',
    });
    const paymentGateway = new payment_1.default();
    const paymentReference = paymentGateway.generatePaymentReference(`SUB${subscription._id}`);
    const paymentResult = await paymentGateway.initializePayment('paystack', {
        email: user.email,
        amount: plan.price,
        reference: paymentReference,
        coreId: subscription._id.toString(),
        userId: userId,
        description: `Subscription to ${plan.name} (${chosenInterval})`,
        phone: user.phone,
        metadata: {
            type: 'settings',
            coreId: subscription._id.toString(),
            redirect: 'subscription',
            promoCode,
        },
    });
    if (!paymentResult.success) {
        subscription.status = billing_types_1.SubscriptionStatus.INACTIVE;
        await subscription.save();
        throw new error_1.AppError(paymentResult.error || 'Failed to initialize payment.', 400, 'PAYMENT_INIT_FAILED');
    }
    subscription.pendingPaymentRef = paymentResult.data.reference;
    await subscription.save();
    // Notify user of subscription initiation
    await notification_1.default.saveAndSendNotification({
        userId: userId,
        title: '📋 Subscription Initiated',
        body: `Your subscription to "${plan.name}" has been initiated. Complete payment to activate.`,
        type: 'subscription_initiated',
        clickUrl: '/subscription/status',
        priority: 'high'
    }, 'user', { push_notification: true, email_notification: true });
    return { subscription, payment: paymentResult.data };
}
// TODO(billing): this charges the FULL new-plan price on every change-plan request,
// it does not prorate for time already paid/unused on the current cycle. If proration
// is needed later, compute a credit from (subscription.endDate - now) against the
// current plan's daily rate and subtract it from newPlan.price before calling
// paymentGateway.initializePayment below.
async function changePlan(userId, payload) {
    const { planId, interval } = payload;
    const user = await User_model_1.UserModel.findById(userId);
    if (!user)
        throw new error_1.AppError('User not found.', 404, 'NOT_FOUND');
    const subscription = await Subscription_model_1.SubscriptionModel.findOne({
        userId,
        status: billing_types_1.SubscriptionStatus.ACTIVE,
    });
    if (!subscription) {
        throw new error_1.AppError('You have no active subscription to change. Subscribe to a plan first.', 400, 'NO_ACTIVE_SUBSCRIPTION');
    }
    const newPlan = await assertPlanUsable(planId);
    const chosenInterval = interval || newPlan.interval;
    if (subscription.planId.toString() === newPlan._id.toString() &&
        subscription.interval === chosenInterval) {
        throw new error_1.AppError('You are already subscribed to this plan.', 400, 'SAME_PLAN');
    }
    const paymentGateway = new payment_1.default();
    const paymentReference = paymentGateway.generatePaymentReference(`SUB${subscription._id}`);
    const paymentResult = await paymentGateway.initializePayment('paystack', {
        email: user.email,
        amount: newPlan.price,
        reference: paymentReference,
        coreId: subscription._id.toString(),
        userId: userId,
        description: `Change plan to ${newPlan.name} (${chosenInterval})`,
        phone: user.phone,
        metadata: {
            type: 'subscription',
            coreId: subscription._id.toString(),
            redirect: 'subscription',
        },
    });
    if (!paymentResult.success) {
        throw new error_1.AppError(paymentResult.error || 'Failed to initialize payment.', 400, 'PAYMENT_INIT_FAILED');
    }
    subscription.pendingPlanId = newPlan._id;
    subscription.pendingPaymentRef = paymentResult.data.reference;
    await subscription.save();
    return { subscription, payment: paymentResult.data };
}
async function cancelSubscription(userId, reason, immediate = false) {
    const subscription = await Subscription_model_1.SubscriptionModel.findOne({
        userId,
        status: billing_types_1.SubscriptionStatus.ACTIVE,
    });
    if (!subscription) {
        throw new error_1.AppError('You have no active subscription to cancel.', 404, 'NO_ACTIVE_SUBSCRIPTION');
    }
    subscription.cancelReason = reason;
    subscription.cancelledAt = new Date();
    subscription.autoRenew = false;
    if (immediate) {
        subscription.status = billing_types_1.SubscriptionStatus.CANCELLED;
        subscription.endDate = new Date();
        subscription.cancelAtPeriodEnd = false;
    }
    else {
        subscription.cancelAtPeriodEnd = true;
    }
    await subscription.save();
    // Notify user of cancellation
    await notification_1.default.saveAndSendNotification({
        userId: userId,
        title: '❌ Subscription Cancelled',
        body: immediate
            ? `Your "${subscription.planName}" subscription has been immediately cancelled.`
            : `Your "${subscription.planName}" subscription has been cancelled. You'll have access until ${subscription.endDate.toLocaleDateString()}.`,
        type: 'subscription_cancelled',
        clickUrl: '/subscription/status',
        priority: 'high'
    }, 'user', { push_notification: true, email_notification: true });
    return subscription;
}
async function reactivateSubscription(userId) {
    const subscription = await Subscription_model_1.SubscriptionModel.findOne({ userId }).sort({ createdAt: -1 });
    if (!subscription) {
        throw new error_1.AppError('No subscription found to reactivate.', 404, 'NOT_FOUND');
    }
    if (subscription.status === billing_types_1.SubscriptionStatus.ACTIVE &&
        subscription.cancelAtPeriodEnd &&
        subscription.endDate.getTime() > Date.now()) {
        subscription.cancelAtPeriodEnd = false;
        subscription.autoRenew = true;
        subscription.cancelledAt = undefined;
        subscription.cancelReason = undefined;
        await subscription.save();
        // Notify user of reactivation
        await notification_1.default.saveAndSendNotification({
            userId: userId,
            title: '✅ Subscription Reactivated',
            body: `Your "${subscription.planName}" subscription has been reactivated and will continue to renew automatically.`,
            type: 'subscription_reactivated',
            clickUrl: '/subscription/status',
            priority: 'medium'
        }, 'user', { push_notification: true, email_notification: true });
        return subscription;
    }
    throw new error_1.AppError('This subscription cannot be reactivated. Please subscribe to a plan instead.', 400, 'NOT_REACTIVATABLE');
}
async function updateAutoRenew(userId, autoRenew) {
    const subscription = await Subscription_model_1.SubscriptionModel.findOne({
        userId,
        status: billing_types_1.SubscriptionStatus.ACTIVE,
    });
    if (!subscription) {
        throw new error_1.AppError('You have no active subscription.', 404, 'NO_ACTIVE_SUBSCRIPTION');
    }
    subscription.autoRenew = autoRenew;
    if (autoRenew)
        subscription.cancelAtPeriodEnd = false;
    await subscription.save();
    return subscription;
}
// ==================== CITIZEN: BILLING HISTORY ====================
async function getMyBillingHistory(userId, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
        BillingHistory_model_1.BillingHistoryModel.find({ userId }).sort({ date: -1 }).skip(skip).limit(pageSize),
        BillingHistory_model_1.BillingHistoryModel.countDocuments({ userId }),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
async function getMyInvoiceById(userId, invoiceId) {
    const invoice = await BillingHistory_model_1.BillingHistoryModel.findOne({ _id: invoiceId, userId });
    if (!invoice)
        throw new error_1.AppError('Invoice not found.', 404, 'NOT_FOUND');
    return invoice;
}
// ==================== PAYMENT WEBHOOK / CALLBACK HOOK ====================
// Called by the payment gateway once a "SUB" prefixed reference is verified successfully.
async function activateSubscriptionFromPayment(params) {
    const { subscriptionId, transactionId, amount, channel } = params;
    const subscription = await Subscription_model_1.SubscriptionModel.findById(subscriptionId);
    if (!subscription) {
        return { success: false, error: 'Subscription not found for this payment.' };
    }
    const isPlanChange = subscription.status === billing_types_1.SubscriptionStatus.ACTIVE &&
        subscription.pendingPlanId &&
        subscription.pendingPlanId.toString() !== subscription.planId.toString();
    const targetPlan = subscription.pendingPlanId
        ? await SubscriptionPlan_model_1.SubscriptionPlanModel.findById(subscription.pendingPlanId)
        : await SubscriptionPlan_model_1.SubscriptionPlanModel.findById(subscription.planId);
    const now = new Date();
    if (targetPlan) {
        subscription.planId = targetPlan._id;
        subscription.planName = targetPlan.name;
        subscription.price = targetPlan.price;
    }
    subscription.status = billing_types_1.SubscriptionStatus.ACTIVE;
    subscription.startDate = isPlanChange ? subscription.startDate : now;
    subscription.endDate = addInterval(now, subscription.interval);
    subscription.nextBillingDate = subscription.autoRenew ? subscription.endDate : undefined;
    subscription.pendingPlanId = undefined;
    subscription.pendingPaymentRef = undefined;
    await subscription.save();
    await BillingHistory_model_1.BillingHistoryModel.create({
        userId: subscription.userId,
        subscriptionId: subscription._id,
        planId: subscription.planId,
        date: now,
        description: isPlanChange
            ? `Plan change to ${subscription.planName}`
            : `Subscription to ${subscription.planName}`,
        amount,
        status: billing_types_1.InvoiceStatus.PAID,
        paymentMethod: channel || 'paystack',
        transactionId,
    });
    // const lawyer =
    // Notify user of successful activation
    await notification_1.default.saveAndSendNotification({
        userId: subscription.userId.toString(),
        title: isPlanChange ? '🔄 Plan Changed Successfully' : '✅ Subscription Activated!',
        body: isPlanChange
            ? `Your plan has been changed to "${subscription.planName}". Welcome to your new plan!`
            : `Your "${subscription.planName}" subscription is now active. Start enjoying premium features!`,
        type: isPlanChange ? 'plan_changed' : 'subscription_activated',
        clickUrl: '/subscription/status',
        priority: 'high'
    }, 'user', { push_notification: true, email_notification: true });
    return { success: true, subscription };
}
// ==================== ADMIN: PLANS ====================
async function adminListPlans(params = {}) {
    const { isActive, interval, search, page = 1, pageSize = 20 } = params;
    const filter = {};
    if (isActive !== undefined)
        filter.isActive = isActive;
    if (interval)
        filter.interval = interval;
    if (search?.trim()) {
        filter.name = { $regex: search.trim(), $options: 'i' };
    }
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
        SubscriptionPlan_model_1.SubscriptionPlanModel.find(filter).sort({ price: 1 }).skip(skip).limit(pageSize),
        SubscriptionPlan_model_1.SubscriptionPlanModel.countDocuments(filter),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
async function adminGetPlanById(planId) {
    const plan = await SubscriptionPlan_model_1.SubscriptionPlanModel.findById(planId);
    if (!plan)
        throw new error_1.AppError('Plan not found.', 404, 'PLAN_NOT_FOUND');
    return plan;
}
async function adminCreatePlan(input, admin) {
    const plan = await SubscriptionPlan_model_1.SubscriptionPlanModel.create({
        ...input,
        createdBy: new mongoose_1.Types.ObjectId(admin.adminId),
    });
    Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: types_1.AuditAction.PLAN_CREATED,
        targetType: 'plan',
        targetId: plan._id,
        meta: { name: plan.name, price: plan.price },
    }).catch(() => null);
    return plan;
}
async function adminUpdatePlan(planId, updates, admin) {
    const plan = await SubscriptionPlan_model_1.SubscriptionPlanModel.findById(planId);
    if (!plan)
        throw new error_1.AppError('Plan not found.', 404, 'PLAN_NOT_FOUND');
    const ALLOWED_FIELDS = [
        'name', 'description', 'price', 'interval',
        'features', 'isPopular', 'badge', 'isActive',
    ];
    for (const key of ALLOWED_FIELDS) {
        if (updates[key] !== undefined) {
            plan[key] = updates[key];
        }
    }
    await plan.save();
    Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: types_1.AuditAction.PLAN_UPDATED,
        targetType: 'plan',
        targetId: plan._id,
        meta: { updates },
    }).catch(() => null);
    return plan;
}
async function adminDeletePlan(planId, admin) {
    const plan = await SubscriptionPlan_model_1.SubscriptionPlanModel.findById(planId);
    if (!plan)
        throw new error_1.AppError('Plan not found.', 404, 'PLAN_NOT_FOUND');
    const activeSubscribers = await Subscription_model_1.SubscriptionModel.countDocuments({
        planId,
        status: billing_types_1.SubscriptionStatus.ACTIVE,
    });
    if (activeSubscribers > 0) {
        throw new error_1.AppError(`Cannot delete this plan, it has ${activeSubscribers} active subscriber(s). Deactivate it instead.`, 400, 'PLAN_IN_USE');
    }
    await plan.deleteOne();
    Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: types_1.AuditAction.PLAN_DELETED,
        targetType: 'plan',
        targetId: plan._id,
        meta: { name: plan.name },
    }).catch(() => null);
    return { message: 'Plan deleted successfully.' };
}
// ==================== ADMIN: SUBSCRIBERS ====================
async function adminListSubscribers(params = {}) {
    const { status, planId, search, page = 1, pageSize = 20 } = params;
    const filter = {};
    if (status)
        filter.status = status;
    if (planId)
        filter.planId = planId;
    if (search?.trim()) {
        const matchingUsers = await User_model_1.UserModel.find({
            $or: [
                { email: { $regex: search.trim(), $options: 'i' } },
                { firstName: { $regex: search.trim(), $options: 'i' } },
                { lastName: { $regex: search.trim(), $options: 'i' } },
            ],
        }).select('_id');
        filter.userId = { $in: matchingUsers.map((u) => u._id) };
    }
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
        Subscription_model_1.SubscriptionModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .populate('userId', 'firstName lastName email phone')
            .populate('planId'),
        Subscription_model_1.SubscriptionModel.countDocuments(filter),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
async function adminGetSubscriberById(subscriptionId) {
    const subscription = await Subscription_model_1.SubscriptionModel.findById(subscriptionId)
        .populate('userId', 'firstName lastName email phone')
        .populate('planId');
    if (!subscription)
        throw new error_1.AppError('Subscription not found.', 404, 'NOT_FOUND');
    return subscription;
}
async function adminUpdateSubscriber(subscriptionId, updates, admin) {
    const subscription = await Subscription_model_1.SubscriptionModel.findById(subscriptionId);
    if (!subscription)
        throw new error_1.AppError('Subscription not found.', 404, 'NOT_FOUND');
    const ALLOWED_FIELDS = ['status', 'autoRenew', 'cancelAtPeriodEnd', 'endDate'];
    for (const key of ALLOWED_FIELDS) {
        if (updates[key] !== undefined) {
            subscription[key] = updates[key];
        }
    }
    await subscription.save();
    // Notify user of admin update
    await notification_1.default.saveAndSendNotification({
        userId: subscription.userId.toString(),
        title: '📋 Subscription Updated by Admin',
        body: `Your subscription status has been updated to: ${subscription.status}`,
        type: 'subscription_admin_updated',
        clickUrl: '/subscription/status',
        priority: 'medium'
    }, 'user', { push_notification: true, email_notification: true });
    Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: types_1.AuditAction.SUBSCRIPTION_STATUS_CHANGED,
        targetType: 'subscription',
        targetId: subscription._id,
        meta: { updates },
    }).catch(() => null);
    return subscription;
}
async function adminDeleteSubscriber(subscriptionId, admin) {
    const subscription = await Subscription_model_1.SubscriptionModel.findById(subscriptionId);
    if (!subscription)
        throw new error_1.AppError('Subscription not found.', 404, 'NOT_FOUND');
    await subscription.deleteOne();
    Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: types_1.AuditAction.SUBSCRIPTION_STATUS_CHANGED,
        targetType: 'subscription',
        targetId: subscription._id,
        meta: { action: 'deleted' },
    }).catch(() => null);
    return { message: 'Subscription record deleted successfully.' };
}
// ==================== ADMIN: INVOICES / BILLING HISTORY ====================
async function adminListInvoices(params = {}) {
    const { userId, status, startDate, endDate, page = 1, pageSize = 20 } = params;
    const filter = {};
    if (userId)
        filter.userId = userId;
    if (status)
        filter.status = status;
    if (startDate || endDate) {
        filter.date = {
            ...(startDate && { $gte: startDate }),
            ...(endDate && { $lte: endDate }),
        };
    }
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
        BillingHistory_model_1.BillingHistoryModel.find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(pageSize)
            .populate('userId', 'firstName lastName email')
            .populate('planId'),
        BillingHistory_model_1.BillingHistoryModel.countDocuments(filter),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
async function adminGetInvoiceById(invoiceId) {
    const invoice = await BillingHistory_model_1.BillingHistoryModel.findById(invoiceId)
        .populate('userId', 'firstName lastName email')
        .populate('planId');
    if (!invoice)
        throw new error_1.AppError('Invoice not found.', 404, 'NOT_FOUND');
    return invoice;
}
async function adminUpdateInvoice(invoiceId, updates, admin) {
    const invoice = await BillingHistory_model_1.BillingHistoryModel.findById(invoiceId);
    if (!invoice)
        throw new error_1.AppError('Invoice not found.', 404, 'NOT_FOUND');
    const ALLOWED_FIELDS = ['status', 'invoiceUrl', 'description'];
    for (const key of ALLOWED_FIELDS) {
        if (updates[key] !== undefined) {
            invoice[key] = updates[key];
        }
    }
    await invoice.save();
    return invoice;
}
async function adminDeleteInvoice(invoiceId) {
    const invoice = await BillingHistory_model_1.BillingHistoryModel.findById(invoiceId);
    if (!invoice)
        throw new error_1.AppError('Invoice not found.', 404, 'NOT_FOUND');
    await invoice.deleteOne();
    return { message: 'Invoice deleted successfully.' };
}
// ==================== ADMIN: STATS ====================
async function adminGetSubscriptionStats() {
    const [totalPlans, activePlans, totalSubscribers, activeSubscribers, cancelledSubscribers] = await Promise.all([
        SubscriptionPlan_model_1.SubscriptionPlanModel.countDocuments(),
        SubscriptionPlan_model_1.SubscriptionPlanModel.countDocuments({ isActive: true }),
        Subscription_model_1.SubscriptionModel.countDocuments(),
        Subscription_model_1.SubscriptionModel.countDocuments({ status: billing_types_1.SubscriptionStatus.ACTIVE }),
        Subscription_model_1.SubscriptionModel.countDocuments({ status: billing_types_1.SubscriptionStatus.CANCELLED }),
    ]);
    const revenueAgg = await BillingHistory_model_1.BillingHistoryModel.aggregate([
        { $match: { status: billing_types_1.InvoiceStatus.PAID } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return {
        totalPlans,
        activePlans,
        totalSubscribers,
        activeSubscribers,
        cancelledSubscribers,
        totalRevenue: revenueAgg[0]?.total || 0,
    };
}
//# sourceMappingURL=subscription.service.js.map