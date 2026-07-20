import { Schema, model, models, Document, Types } from 'mongoose';
import { BillingInterval, ISubscriptionPlan } from './types/billing.types';

export interface ISubscriptionPlanDocument
  extends Omit<ISubscriptionPlan, '_id'>,
    Document {
  _id: Types.ObjectId;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlanDocument>(
  {
    name: { type: String, required: [true, 'Plan name is required'], trim: true },
    description: { type: String, required: [true, 'Plan description is required'], trim: true },
    price: { type: Number, required: [true, 'Plan price is required'], min: 0 },
    interval: {
      type: String,
      enum: Object.values(BillingInterval),
      required: [true, 'Billing interval is required'],
    },
    features: { type: [String], default: [] },
    isPopular: { type: Boolean, default: false },
    badge: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
  },
  {
    timestamps: true,
    collection: 'subscription_plans',
    toJSON: {
      transform: function (_doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

SubscriptionPlanSchema.index({ isActive: 1, price: 1 });

export const SubscriptionPlanModel =
  models.SubscriptionPlan ||
  model<ISubscriptionPlanDocument>('SubscriptionPlan', SubscriptionPlanSchema);
