import { Schema, model, models, Document, Types } from 'mongoose';
import { IBillingHistory, InvoiceStatus } from './types/billing.types';

export interface IBillingHistoryDocument extends Omit<IBillingHistory, '_id'>, Document {
  _id: Types.ObjectId;
}

const BillingHistorySchema = new Schema<IBillingHistoryDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.PENDING,
      index: true,
    },
    invoiceUrl: { type: String },
    paymentMethod: { type: String, default: 'paystack' },
    transactionId: { type: String, index: true },
  },
  {
    timestamps: true,
    collection: 'billing_history',
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

BillingHistorySchema.index({ userId: 1, date: -1 });
BillingHistorySchema.index({ status: 1, date: -1 });

export const BillingHistoryModel =
  models.BillingHistory ||
  model<IBillingHistoryDocument>('BillingHistory', BillingHistorySchema);
