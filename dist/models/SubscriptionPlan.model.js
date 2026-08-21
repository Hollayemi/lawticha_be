"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionPlanModel = void 0;
const mongoose_1 = require("mongoose");
const billing_types_1 = require("./types/billing.types");
const SubscriptionPlanSchema = new mongoose_1.Schema({
    name: { type: String, required: [true, 'Plan name is required'], trim: true },
    description: { type: String, required: [true, 'Plan description is required'], trim: true },
    price: { type: Number, required: [true, 'Plan price is required'], min: 0 },
    interval: {
        type: String,
        enum: Object.values(billing_types_1.BillingInterval),
        required: [true, 'Billing interval is required'],
    },
    features: { type: [String], default: [] },
    isPopular: { type: Boolean, default: false },
    badge: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AdminUser' },
}, {
    timestamps: true,
    collection: 'subscription_plans',
    toJSON: {
        transform: function (_doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
SubscriptionPlanSchema.index({ isActive: 1, price: 1 });
exports.SubscriptionPlanModel = mongoose_1.models.SubscriptionPlan ||
    (0, mongoose_1.model)('SubscriptionPlan', SubscriptionPlanSchema);
//# sourceMappingURL=SubscriptionPlan.model.js.map