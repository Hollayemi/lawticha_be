import { Schema, model, models, Types, Document } from 'mongoose';
import { IBook, BookFormat, BookStatus, BookCategory } from './types/library.types';

export interface IBookDocument extends Omit<IBook, '_id'>, Document {
  _id: Types.ObjectId;
  incrementDownloadCount(): Promise<void>;
  incrementOrderCount(quantity: number): Promise<void>;
  updateRating(newRating: number): Promise<void>;
}

const BookSchema = new Schema<IBookDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      enum: Object.values(BookCategory),
      required: true,
      index: true,
    },
    coverUrl: {
      type: String,
      default: null,
    },
    pdfUrl: {
      type: String,
      default: null,
    },
    format: {
      type: String,
      enum: Object.values(BookFormat),
      required: true,
    },
    pricePhysical: {
      type: Number,
      min: 0,
      default: null,
    },
    totalPages: {
      type: Number,
      required: true,
      min: 1,
    },
    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    publishedYear: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 5,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    downloadCount: {
      type: Number,
      default: 0,
    },
    orderCount: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    stockCount: {
      type: Number,
      min: 0,
      default: null,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(BookStatus),
      default: BookStatus.ACTIVE,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
    },
  },
  {
    timestamps: true,
    collection: 'books',
  }
);

// Indexes
BookSchema.index({ title: 'text', author: 'text', description: 'text', tags: 'text' });
BookSchema.index({ category: 1, format: 1, status: 1 });
BookSchema.index({ featured: 1, createdAt: -1 });

// Methods
BookSchema.methods.incrementDownloadCount = async function(): Promise<void> {
  this.downloadCount += 1;
  await this.save();
};

BookSchema.methods.incrementOrderCount = async function(quantity: number): Promise<void> {
  this.orderCount += quantity;
  if (this.stockCount !== null) {
    this.stockCount = Math.max(0, this.stockCount - quantity);
  }
  await this.save();
};

BookSchema.methods.updateRating = async function(newRating: number): Promise<void> {
  const totalRating = this.rating * this.reviewCount + newRating;
  this.reviewCount += 1;
  this.rating = totalRating / this.reviewCount;
  await this.save();
};

export const BookModel = models.Book || model<IBookDocument>('Book', BookSchema);