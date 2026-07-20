import { Schema, model, models, Document, Model, Types } from 'mongoose';
import { BillingInterval, ISubscription, SubscriptionStatus } from './types/billing.types';

export interface ISubscriptionDocument extends Omit<ISubscription, '_id'>, Document {
  _id: Types.ObjectId;
  isCurrentlyActive(): boolean;
}

export interface ISubscriptionModel extends Model<ISubscriptionDocument> {
  findActiveForUser(userId: Types.ObjectId | string): Promise<ISubscriptionDocument | null>;
}

const SubscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    planName: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.PENDING,
      index: true,
    },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: true },
    price: { type: Number, required: true, min: 0 },
    interval: { type: String, enum: Object.values(BillingInterval), required: true },
    nextBillingDate: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
    pendingPlanId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
    pendingPaymentRef: { type: String },
    provider: { type: String, default: 'paystack' },
  },
  {
    timestamps: true,
    collection: 'subscriptions',
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

SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ userId: 1, createdAt: -1 });
SubscriptionSchema.index({ pendingPaymentRef: 1 });

SubscriptionSchema.methods.isCurrentlyActive = function (this: ISubscriptionDocument): boolean {
  return this.status === SubscriptionStatus.ACTIVE && this.endDate.getTime() > Date.now();
};

SubscriptionSchema.statics.findActiveForUser = function (
  userId: Types.ObjectId | string
): Promise<ISubscriptionDocument | null> {
  return this.findOne({ userId, status: SubscriptionStatus.ACTIVE }).sort({ createdAt: -1 }).exec();
};

export const SubscriptionModel: ISubscriptionModel =
  (models.Subscription as unknown as ISubscriptionModel) ||
  model<ISubscriptionDocument, ISubscriptionModel>('Subscription', SubscriptionSchema);
