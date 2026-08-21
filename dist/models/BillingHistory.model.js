"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingHistoryModel = void 0;
const mongoose_1 = require("mongoose");
const billing_types_1 = require("./types/billing.types");
const BillingHistorySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscriptionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Subscription', index: true },
    planId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: Object.values(billing_types_1.InvoiceStatus),
        default: billing_types_1.InvoiceStatus.PENDING,
        index: true,
    },
    invoiceUrl: { type: String },
    paymentMethod: { type: String, default: 'paystack' },
    transactionId: { type: String, index: true },
}, {
    timestamps: true,
    collection: 'billing_history',
    toJSON: {
        transform: function (_doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
BillingHistorySchema.index({ userId: 1, date: -1 });
BillingHistorySchema.index({ status: 1, date: -1 });
exports.BillingHistoryModel = mongoose_1.models.BillingHistory ||
    (0, mongoose_1.model)('BillingHistory', BillingHistorySchema);
//# sourceMappingURL=BillingHistory.model.js.map