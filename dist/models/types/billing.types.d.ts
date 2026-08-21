import { Types } from 'mongoose';
export declare enum BillingInterval {
    MONTHLY = "monthly",
    YEARLY = "yearly"
}
export declare enum SubscriptionStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    CANCELLED = "cancelled",
    EXPIRED = "expired",
    PENDING = "pending"
}
export declare enum InvoiceStatus {
    PAID = "paid",
    PENDING = "pending",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export interface ISubscriptionPlan {
    _id: Types.ObjectId;
    name: string;
    description: string;
    price: number;
    interval: BillingInterval;
    features: string[];
    isPopular?: boolean;
    badge?: string;
    isActive: boolean;
    createdBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export interface ISubscription {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    planId: Types.ObjectId;
    planName: string;
    status: SubscriptionStatus;
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
    price: number;
    interval: BillingInterval;
    nextBillingDate?: Date;
    cancelAtPeriodEnd?: boolean;
    cancelledAt?: Date;
    cancelReason?: string;
    pendingPlanId?: Types.ObjectId;
    pendingPaymentRef?: string;
    provider?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IBillingHistory {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    subscriptionId?: Types.ObjectId;
    planId?: Types.ObjectId;
    date: Date;
    description: string;
    amount: number;
    status: InvoiceStatus;
    invoiceUrl?: string;
    paymentMethod: string;
    transactionId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface SubscriptionPayload {
    planId: string;
    interval: BillingInterval;
    autoRenew?: boolean;
    promoCode?: string;
}
export interface ChangePlanPayload {
    planId: string;
    interval?: BillingInterval;
}
export interface ListPlansParams {
    isActive?: boolean;
    interval?: BillingInterval;
    search?: string;
    page?: number;
    pageSize?: number;
}
export interface ListSubscribersParams {
    status?: SubscriptionStatus;
    planId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}
export interface ListInvoicesParams {
    userId?: string;
    status?: InvoiceStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
}
//# sourceMappingURL=billing.types.d.ts.map