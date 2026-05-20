import { Schema, model, models, Types, Document } from 'mongoose';
import { IBookOrder, OrderStatus } from './types/library.types';

export interface IBookOrderDocument extends Omit<IBookOrder, '_id'>, Document {
  _id: Types.ObjectId;
  updateStatus(status: OrderStatus, trackingNumber?: string): Promise<void>;
}

const BookOrderSchema = new Schema<IBookOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    bookTitle: {
      type: String,
      required: true,
    },
    coverUrl: {
      type: String,
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    userPhone: {
      type: String,
      required: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      index: true,
    },
    trackingNumber: {
      type: String,
      default: null,
    },
    paymentRef: {
      type: String,
      required: true,
      unique: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: {
      createdAt: 'orderedAt',
      updatedAt: 'updatedAt',
    },
    collection: 'book_orders',
  }
);

// Indexes
BookOrderSchema.index({ orderNumber: 1 });
BookOrderSchema.index({ userId: 1, orderedAt: -1 });
BookOrderSchema.index({ status: 1, orderedAt: -1 });
BookOrderSchema.index({ userEmail: 1, orderedAt: -1 });

// Pre-save: generate order number
BookOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const year = new Date().getFullYear();
    const count = await BookOrderModel.countDocuments();
    this.orderNumber = `ORD-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Methods
BookOrderSchema.methods.updateStatus = async function(
  status: OrderStatus,
  trackingNumber?: string
): Promise<void> {
  this.status = status;
  if (trackingNumber) {
    this.trackingNumber = trackingNumber;
  }
  await this.save();
};

export const BookOrderModel = models.BookOrder || model<IBookOrderDocument>('BookOrder', BookOrderSchema);