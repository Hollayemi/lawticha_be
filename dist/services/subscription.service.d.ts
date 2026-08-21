import { Types } from 'mongoose';
import { ISubscriptionDocument } from '../models/Subscription.model';
import { BillingInterval, SubscriptionStatus, InvoiceStatus, ListPlansParams, ListSubscribersParams, ListInvoicesParams, SubscriptionPayload, ChangePlanPayload } from '../models/types/billing.types';
interface AdminCtx {
    adminId: string;
    adminName: string;
}
export declare function listPublicPlans(interval?: BillingInterval): Promise<any[]>;
export declare function getMySubscription(userId: string): Promise<(import("mongoose").Document<unknown, {}, ISubscriptionDocument, {}, {}> & ISubscriptionDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function subscribeToPlan(userId: string, payload: SubscriptionPayload): Promise<{
    subscription: import("mongoose").Document<unknown, {}, ISubscriptionDocument, {}, {}> & ISubscriptionDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    };
    payment: any;
}>;
export declare function changePlan(userId: string, payload: ChangePlanPayload): Promise<{
    subscription: import("mongoose").Document<unknown, {}, ISubscriptionDocument, {}, {}> & ISubscriptionDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    };
    payment: any;
}>;
export declare function cancelSubscription(userId: string, reason?: string, immediate?: boolean): Promise<import("mongoose").Document<unknown, {}, ISubscriptionDocument, {}, {}> & ISubscriptionDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function reactivateSubscription(userId: string): Promise<import("mongoose").Document<unknown, {}, ISubscriptionDocument, {}, {}> & ISubscriptionDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function updateAutoRenew(userId: string, autoRenew: boolean): Promise<import("mongoose").Document<unknown, {}, ISubscriptionDocument, {}, {}> & ISubscriptionDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function getMyBillingHistory(userId: string, page?: number, pageSize?: number): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare function getMyInvoiceById(userId: string, invoiceId: string): Promise<any>;
export declare function activateSubscriptionFromPayment(params: {
    subscriptionId: string;
    transactionId?: string;
    amount: number;
    channel?: string;
}): Promise<{
    success: boolean;
    error: string;
    subscription?: undefined;
} | {
    success: boolean;
    subscription: import("mongoose").Document<unknown, {}, ISubscriptionDocument, {}, {}> & ISubscriptionDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    };
    error?: undefined;
}>;
export declare function adminListPlans(params?: ListPlansParams): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare function adminGetPlanById(planId: string): Promise<any>;
export declare function adminCreatePlan(input: {
    name: string;
    description: string;
    price: number;
    interval: BillingInterval;
    features?: string[];
    isPopular?: boolean;
    badge?: string;
    isActive?: boolean;
}, admin: AdminCtx): Promise<any>;
export declare function adminUpdatePlan(planId: string, updates: Partial<{
    name: string;
    description: string;
    price: number;
    interval: BillingInterval;
    features: string[];
    isPopular: boolean;
    badge: string;
    isActive: boolean;
}>, admin: AdminCtx): Promise<any>;
export declare function adminDeletePlan(planId: string, admin: AdminCtx): Promise<{
    message: string;
}>;
export declare function adminListSubscribers(params?: ListSubscribersParams): Promise<{
    data: (import("mongoose").Document<unknown, {}, ISubscriptionDocument, {}, {}> & ISubscriptionDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare function adminGetSubscriberById(subscriptionId: string): Promise<import("mongoose").Document<unknown, {}, ISubscriptionDocument, {}, {}> & ISubscriptionDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function adminUpdateSubscriber(subscriptionId: string, updates: Partial<{
    status: SubscriptionStatus;
    autoRenew: boolean;
    cancelAtPeriodEnd: boolean;
    endDate: Date;
}>, admin: AdminCtx): Promise<import("mongoose").Document<unknown, {}, ISubscriptionDocument, {}, {}> & ISubscriptionDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function adminDeleteSubscriber(subscriptionId: string, admin: AdminCtx): Promise<{
    message: string;
}>;
export declare function adminListInvoices(params?: ListInvoicesParams): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare function adminGetInvoiceById(invoiceId: string): Promise<any>;
export declare function adminUpdateInvoice(invoiceId: string, updates: Partial<{
    status: InvoiceStatus;
    invoiceUrl: string;
    description: string;
}>, admin: AdminCtx): Promise<any>;
export declare function adminDeleteInvoice(invoiceId: string): Promise<{
    message: string;
}>;
export declare function adminGetSubscriptionStats(): Promise<{
    totalPlans: number;
    activePlans: number;
    totalSubscribers: number;
    activeSubscribers: number;
    cancelledSubscribers: number;
    totalRevenue: any;
}>;
export {};
//# sourceMappingURL=subscription.service.d.ts.map