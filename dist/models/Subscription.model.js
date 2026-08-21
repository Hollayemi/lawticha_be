"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionModel = void 0;
const mongoose_1 = require("mongoose");
const billing_types_1 = require("./types/billing.types");
const SubscriptionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    planName: { type: String, required: true },
    status: {
        type: String,
        enum: Object.values(billing_types_1.SubscriptionStatus),
        default: billing_types_1.SubscriptionStatus.PENDING,
        index: true,
    },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: true },
    price: { type: Number, required: true, min: 0 },
    interval: { type: String, enum: Object.values(billing_types_1.BillingInterval), required: true },
    nextBillingDate: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
    pendingPlanId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
    pendingPaymentRef: { type: String },
    provider: { type: String, default: 'paystack' },
}, {
    timestamps: true,
    collection: 'subscriptions',
    toJSON: {
        transform: function (_doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ userId: 1, createdAt: -1 });
SubscriptionSchema.index({ pendingPaymentRef: 1 });
SubscriptionSchema.methods.isCurrentlyActive = function () {
    return this.status === billing_types_1.SubscriptionStatus.ACTIVE && this.endDate.getTime() > Date.now();
};
SubscriptionSchema.statics.findActiveForUser = function (userId) {
    return this.findOne({ userId, status: billing_types_1.SubscriptionStatus.ACTIVE }).sort({ createdAt: -1 }).exec();
};
exports.SubscriptionModel = mongoose_1.models.Subscription ||
    (0, mongoose_1.model)('Subscription', SubscriptionSchema);
//# sourceMappingURL=Subscription.model.js.map