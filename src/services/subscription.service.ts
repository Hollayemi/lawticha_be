import { Types } from 'mongoose';
import { SubscriptionPlanModel, ISubscriptionPlanDocument } from '../models/SubscriptionPlan.model';
import { SubscriptionModel, ISubscriptionDocument } from '../models/Subscription.model';
import { BillingHistoryModel } from '../models/BillingHistory.model';
import { UserModel } from '../models/User.model';
import { AuditLogModel } from '../models/Admin.model';
import { AuditAction } from '../models/types';
import { AppError } from '../middleware/error';
import PaymentGateway from './payment/payment';
import {
  BillingInterval,
  SubscriptionStatus,
  InvoiceStatus,
  ListPlansParams,
  ListSubscribersParams,
  ListInvoicesParams,
  SubscriptionPayload,
  ChangePlanPayload,
} from '../models/types/billing.types';

interface AdminCtx {
  adminId: string;
  adminName: string;
}

//  Helpers 

function addInterval(date: Date, interval: BillingInterval): Date {
  const result = new Date(date);
  if (interval === BillingInterval.YEARLY) {
    result.setFullYear(result.getFullYear() + 1);
  } else {
    result.setMonth(result.getMonth() + 1);
  }
  return result;
}

async function assertPlanUsable(planId: string): Promise<ISubscriptionPlanDocument> {
  const plan = await SubscriptionPlanModel.findById(planId);
  if (!plan) throw new AppError('Subscription plan not found.', 404, 'PLAN_NOT_FOUND');
  if (!plan.isActive) throw new AppError('This plan is no longer available.', 400, 'PLAN_INACTIVE');
  return plan;
}

// ==================== PUBLIC / CITIZEN: PLANS ====================

export async function listPublicPlans(interval?: BillingInterval) {
  const filter: Record<string, unknown> = { isActive: true };
  if (interval) filter.interval = interval;
  return SubscriptionPlanModel.find(filter).sort({ price: 1 });
}

// ==================== CITIZEN: MY SUBSCRIPTION ====================

export async function getMySubscription(userId: string) {
  const subscription = await SubscriptionModel.findOne({ userId })
    .sort({ createdAt: -1 })
    .populate('planId');

  if (!subscription) return null;
  return subscription;
}

export async function subscribeToPlan(
  userId: string,
  payload: SubscriptionPayload
) {
  const { planId, interval, autoRenew = true, promoCode } = payload;

  const user = await UserModel.findById(userId);
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');

  const plan = await assertPlanUsable(planId);

  const existingActive = await SubscriptionModel.findOne({
    userId,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING] },
  });
  if (existingActive) {
    throw new AppError(
      'You already have an active or pending subscription. Use change-plan to switch plans.',
      400,
      'SUBSCRIPTION_EXISTS'
    );
  }

  const chosenInterval = interval || plan.interval;
  const now = new Date();

  const subscription = await SubscriptionModel.create({
    userId,
    planId: plan._id,
    planName: plan.name,
    status: SubscriptionStatus.PENDING,
    startDate: now,
    endDate: addInterval(now, chosenInterval),
    autoRenew,
    price: plan.price,
    interval: chosenInterval,
    pendingPlanId: plan._id,
    provider: 'paystack',
  });

  const paymentGateway = new PaymentGateway();
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
    subscription.status = SubscriptionStatus.INACTIVE;
    await subscription.save();
    throw new AppError(paymentResult.error || 'Failed to initialize payment.', 400, 'PAYMENT_INIT_FAILED');
  }

  subscription.pendingPaymentRef = paymentResult.data.reference;
  await subscription.save();

  return { subscription, payment: paymentResult.data };
}

// TODO(billing): this charges the FULL new-plan price on every change-plan request,
// it does not prorate for time already paid/unused on the current cycle. If proration
// is needed later, compute a credit from (subscription.endDate - now) against the
// current plan's daily rate and subtract it from newPlan.price before calling
// paymentGateway.initializePayment below.
export async function changePlan(userId: string, payload: ChangePlanPayload) {
  const { planId, interval } = payload;

  const user = await UserModel.findById(userId);
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');

  const subscription = await SubscriptionModel.findOne({
    userId,
    status: SubscriptionStatus.ACTIVE,
  });
  if (!subscription) {
    throw new AppError('You have no active subscription to change. Subscribe to a plan first.', 400, 'NO_ACTIVE_SUBSCRIPTION');
  }

  const newPlan = await assertPlanUsable(planId);
  const chosenInterval = interval || newPlan.interval;

  if (
    subscription.planId.toString() === newPlan._id.toString() &&
    subscription.interval === chosenInterval
  ) {
    throw new AppError('You are already subscribed to this plan.', 400, 'SAME_PLAN');
  }

  const paymentGateway = new PaymentGateway();
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
    throw new AppError(paymentResult.error || 'Failed to initialize payment.', 400, 'PAYMENT_INIT_FAILED');
  }

  subscription.pendingPlanId = newPlan._id;
  subscription.pendingPaymentRef = paymentResult.data.reference;
  await subscription.save();

  return { subscription, payment: paymentResult.data };
}

export async function cancelSubscription(
  userId: string,
  reason?: string,
  immediate = false
) {
  const subscription = await SubscriptionModel.findOne({
    userId,
    status: SubscriptionStatus.ACTIVE,
  });
  if (!subscription) {
    throw new AppError('You have no active subscription to cancel.', 404, 'NO_ACTIVE_SUBSCRIPTION');
  }

  subscription.cancelReason = reason;
  subscription.cancelledAt = new Date();
  subscription.autoRenew = false;

  if (immediate) {
    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.endDate = new Date();
    subscription.cancelAtPeriodEnd = false;
  } else {
    subscription.cancelAtPeriodEnd = true;
  }

  await subscription.save();
  return subscription;
}

export async function reactivateSubscription(userId: string) {
  const subscription = await SubscriptionModel.findOne({ userId }).sort({ createdAt: -1 });
  if (!subscription) {
    throw new AppError('No subscription found to reactivate.', 404, 'NOT_FOUND');
  }

  if (
    subscription.status === SubscriptionStatus.ACTIVE &&
    subscription.cancelAtPeriodEnd &&
    subscription.endDate.getTime() > Date.now()
  ) {
    subscription.cancelAtPeriodEnd = false;
    subscription.autoRenew = true;
    subscription.cancelledAt = undefined;
    subscription.cancelReason = undefined;
    await subscription.save();
    return subscription;
  }

  throw new AppError(
    'This subscription cannot be reactivated. Please subscribe to a plan instead.',
    400,
    'NOT_REACTIVATABLE'
  );
}

export async function updateAutoRenew(userId: string, autoRenew: boolean) {
  const subscription = await SubscriptionModel.findOne({
    userId,
    status: SubscriptionStatus.ACTIVE,
  });
  if (!subscription) {
    throw new AppError('You have no active subscription.', 404, 'NO_ACTIVE_SUBSCRIPTION');
  }

  subscription.autoRenew = autoRenew;
  if (autoRenew) subscription.cancelAtPeriodEnd = false;
  await subscription.save();
  return subscription;
}

// ==================== CITIZEN: BILLING HISTORY ====================

export async function getMyBillingHistory(
  userId: string,
  page = 1,
  pageSize = 20
) {
  const skip = (page - 1) * pageSize;
  const [data, total] = await Promise.all([
    BillingHistoryModel.find({ userId }).sort({ date: -1 }).skip(skip).limit(pageSize),
    BillingHistoryModel.countDocuments({ userId }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getMyInvoiceById(userId: string, invoiceId: string) {
  const invoice = await BillingHistoryModel.findOne({ _id: invoiceId, userId });
  if (!invoice) throw new AppError('Invoice not found.', 404, 'NOT_FOUND');
  return invoice;
}

// ==================== PAYMENT WEBHOOK / CALLBACK HOOK ====================
// Called by the payment gateway once a "SUB" prefixed reference is verified successfully.

export async function activateSubscriptionFromPayment(params: {
  subscriptionId: string;
  transactionId?: string;
  amount: number;
  channel?: string;
}) {
  const { subscriptionId, transactionId, amount, channel } = params;

  const subscription = await SubscriptionModel.findById(subscriptionId);
  if (!subscription) {
    return { success: false, error: 'Subscription not found for this payment.' };
  }

  const isPlanChange =
    subscription.status === SubscriptionStatus.ACTIVE &&
    subscription.pendingPlanId &&
    subscription.pendingPlanId.toString() !== subscription.planId.toString();

  const targetPlan = subscription.pendingPlanId
    ? await SubscriptionPlanModel.findById(subscription.pendingPlanId)
    : await SubscriptionPlanModel.findById(subscription.planId);

  const now = new Date();

  if (targetPlan) {
    subscription.planId = targetPlan._id as Types.ObjectId;
    subscription.planName = targetPlan.name;
    subscription.price = targetPlan.price;
  }

  subscription.status = SubscriptionStatus.ACTIVE;
  subscription.startDate = isPlanChange ? subscription.startDate : now;
  subscription.endDate = addInterval(now, subscription.interval);
  subscription.nextBillingDate = subscription.autoRenew ? subscription.endDate : undefined;
  subscription.pendingPlanId = undefined;
  subscription.pendingPaymentRef = undefined;

  await subscription.save();

  await BillingHistoryModel.create({
    userId: subscription.userId,
    subscriptionId: subscription._id,
    planId: subscription.planId,
    date: now,
    description: isPlanChange
      ? `Plan change to ${subscription.planName}`
      : `Subscription to ${subscription.planName}`,
    amount,
    status: InvoiceStatus.PAID,
    paymentMethod: channel || 'paystack',
    transactionId,
  });

  return { success: true, subscription };
}

// ==================== ADMIN: PLANS ====================

export async function adminListPlans(params: ListPlansParams = {}) {
  const { isActive, interval, search, page = 1, pageSize = 20 } = params;

  const filter: Record<string, unknown> = {};
  if (isActive !== undefined) filter.isActive = isActive;
  if (interval) filter.interval = interval;
  if (search?.trim()) {
    filter.name = { $regex: search.trim(), $options: 'i' };
  }

  const skip = (page - 1) * pageSize;
  const [data, total] = await Promise.all([
    SubscriptionPlanModel.find(filter).sort({ price: 1 }).skip(skip).limit(pageSize),
    SubscriptionPlanModel.countDocuments(filter),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function adminGetPlanById(planId: string) {
  const plan = await SubscriptionPlanModel.findById(planId);
  if (!plan) throw new AppError('Plan not found.', 404, 'PLAN_NOT_FOUND');
  return plan;
}

export async function adminCreatePlan(
  input: {
    name: string;
    description: string;
    price: number;
    interval: BillingInterval;
    features?: string[];
    isPopular?: boolean;
    badge?: string;
    isActive?: boolean;
  },
  admin: AdminCtx
) {
  const plan = await SubscriptionPlanModel.create({
    ...input,
    createdBy: new Types.ObjectId(admin.adminId),
  });

  AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.PLAN_CREATED,
    targetType: 'plan',
    targetId: plan._id,
    meta: { name: plan.name, price: plan.price },
  }).catch(() => null);

  return plan;
}

export async function adminUpdatePlan(
  planId: string,
  updates: Partial<{
    name: string;
    description: string;
    price: number;
    interval: BillingInterval;
    features: string[];
    isPopular: boolean;
    badge: string;
    isActive: boolean;
  }>,
  admin: AdminCtx
) {
  const plan = await SubscriptionPlanModel.findById(planId);
  if (!plan) throw new AppError('Plan not found.', 404, 'PLAN_NOT_FOUND');

  const ALLOWED_FIELDS = [
    'name', 'description', 'price', 'interval',
    'features', 'isPopular', 'badge', 'isActive',
  ] as const;

  for (const key of ALLOWED_FIELDS) {
    if (updates[key] !== undefined) {
      (plan as any)[key] = updates[key];
    }
  }

  await plan.save();

  AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.PLAN_UPDATED,
    targetType: 'plan',
    targetId: plan._id,
    meta: { updates },
  }).catch(() => null);

  return plan;
}

export async function adminDeletePlan(planId: string, admin: AdminCtx) {
  const plan = await SubscriptionPlanModel.findById(planId);
  if (!plan) throw new AppError('Plan not found.', 404, 'PLAN_NOT_FOUND');

  const activeSubscribers = await SubscriptionModel.countDocuments({
    planId,
    status: SubscriptionStatus.ACTIVE,
  });

  if (activeSubscribers > 0) {
    throw new AppError(
      `Cannot delete this plan, it has ${activeSubscribers} active subscriber(s). Deactivate it instead.`,
      400,
      'PLAN_IN_USE'
    );
  }

  await plan.deleteOne();

  AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.PLAN_DELETED,
    targetType: 'plan',
    targetId: plan._id,
    meta: { name: plan.name },
  }).catch(() => null);

  return { message: 'Plan deleted successfully.' };
}

// ==================== ADMIN: SUBSCRIBERS ====================

export async function adminListSubscribers(params: ListSubscribersParams = {}) {
  const { status, planId, search, page = 1, pageSize = 20 } = params;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (planId) filter.planId = planId;

  if (search?.trim()) {
    const matchingUsers = await UserModel.find({
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
    SubscriptionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('userId', 'firstName lastName email phone')
      .populate('planId'),
    SubscriptionModel.countDocuments(filter),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function adminGetSubscriberById(subscriptionId: string) {
  const subscription = await SubscriptionModel.findById(subscriptionId)
    .populate('userId', 'firstName lastName email phone')
    .populate('planId');
  if (!subscription) throw new AppError('Subscription not found.', 404, 'NOT_FOUND');
  return subscription;
}

export async function adminUpdateSubscriber(
  subscriptionId: string,
  updates: Partial<{
    status: SubscriptionStatus;
    autoRenew: boolean;
    cancelAtPeriodEnd: boolean;
    endDate: Date;
  }>,
  admin: AdminCtx
) {
  const subscription = await SubscriptionModel.findById(subscriptionId);
  if (!subscription) throw new AppError('Subscription not found.', 404, 'NOT_FOUND');

  const ALLOWED_FIELDS = ['status', 'autoRenew', 'cancelAtPeriodEnd', 'endDate'] as const;
  for (const key of ALLOWED_FIELDS) {
    if (updates[key] !== undefined) {
      (subscription as any)[key] = updates[key];
    }
  }

  await subscription.save();

  AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.SUBSCRIPTION_STATUS_CHANGED,
    targetType: 'subscription',
    targetId: subscription._id,
    meta: { updates },
  }).catch(() => null);

  return subscription;
}

export async function adminDeleteSubscriber(subscriptionId: string, admin: AdminCtx) {
  const subscription = await SubscriptionModel.findById(subscriptionId);
  if (!subscription) throw new AppError('Subscription not found.', 404, 'NOT_FOUND');

  await subscription.deleteOne();

  AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.SUBSCRIPTION_STATUS_CHANGED,
    targetType: 'subscription',
    targetId: subscription._id,
    meta: { action: 'deleted' },
  }).catch(() => null);

  return { message: 'Subscription record deleted successfully.' };
}

// ==================== ADMIN: INVOICES / BILLING HISTORY ====================

export async function adminListInvoices(params: ListInvoicesParams = {}) {
  const { userId, status, startDate, endDate, page = 1, pageSize = 20 } = params;

  const filter: Record<string, unknown> = {};
  if (userId) filter.userId = userId;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.date = {
      ...(startDate && { $gte: startDate }),
      ...(endDate && { $lte: endDate }),
    };
  }

  const skip = (page - 1) * pageSize;
  const [data, total] = await Promise.all([
    BillingHistoryModel.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('userId', 'firstName lastName email')
      .populate('planId'),
    BillingHistoryModel.countDocuments(filter),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function adminGetInvoiceById(invoiceId: string) {
  const invoice = await BillingHistoryModel.findById(invoiceId)
    .populate('userId', 'firstName lastName email')
    .populate('planId');
  if (!invoice) throw new AppError('Invoice not found.', 404, 'NOT_FOUND');
  return invoice;
}

export async function adminUpdateInvoice(
  invoiceId: string,
  updates: Partial<{ status: InvoiceStatus; invoiceUrl: string; description: string }>,
  admin: AdminCtx
) {
  const invoice = await BillingHistoryModel.findById(invoiceId);
  if (!invoice) throw new AppError('Invoice not found.', 404, 'NOT_FOUND');

  const ALLOWED_FIELDS = ['status', 'invoiceUrl', 'description'] as const;
  for (const key of ALLOWED_FIELDS) {
    if (updates[key] !== undefined) {
      (invoice as any)[key] = updates[key];
    }
  }

  await invoice.save();
  return invoice;
}

export async function adminDeleteInvoice(invoiceId: string) {
  const invoice = await BillingHistoryModel.findById(invoiceId);
  if (!invoice) throw new AppError('Invoice not found.', 404, 'NOT_FOUND');

  await invoice.deleteOne();
  return { message: 'Invoice deleted successfully.' };
}

// ==================== ADMIN: STATS ====================

export async function adminGetSubscriptionStats() {
  const [totalPlans, activePlans, totalSubscribers, activeSubscribers, cancelledSubscribers] =
    await Promise.all([
      SubscriptionPlanModel.countDocuments(),
      SubscriptionPlanModel.countDocuments({ isActive: true }),
      SubscriptionModel.countDocuments(),
      SubscriptionModel.countDocuments({ status: SubscriptionStatus.ACTIVE }),
      SubscriptionModel.countDocuments({ status: SubscriptionStatus.CANCELLED }),
    ]);

  const revenueAgg = await BillingHistoryModel.aggregate([
    { $match: { status: InvoiceStatus.PAID } },
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
