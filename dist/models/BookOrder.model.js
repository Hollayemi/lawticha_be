"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookOrderModel = void 0;
const mongoose_1 = require("mongoose");
const library_types_1 = require("./types/library.types");
const BookOrderSchema = new mongoose_1.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    bookId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
        enum: Object.values(library_types_1.OrderStatus),
        default: library_types_1.OrderStatus.PENDING,
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
    paidAt: {
        type: String,
    },
    transactionId: {
        type: String,
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
}, {
    timestamps: {
        createdAt: 'orderedAt',
        updatedAt: 'updatedAt',
    },
    collection: 'book_orders',
});
// Indexes
BookOrderSchema.index({ orderNumber: 1 });
BookOrderSchema.index({ userId: 1, orderedAt: -1 });
BookOrderSchema.index({ status: 1, orderedAt: -1 });
BookOrderSchema.index({ userEmail: 1, orderedAt: -1 });
// Pre-save: generate order number
BookOrderSchema.pre('save', async function (next) {
    if (this.isNew && !this.orderNumber) {
        const year = new Date().getFullYear();
        const count = await exports.BookOrderModel.countDocuments();
        this.orderNumber = `ORD-${year}-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});
// Methods
BookOrderSchema.methods.updateStatus = async function (status, trackingNumber) {
    this.status = status;
    if (trackingNumber) {
        this.trackingNumber = trackingNumber;
    }
    await this.save();
};
exports.BookOrderModel = mongoose_1.models.BookOrder || (0, mongoose_1.model)('BookOrder', BookOrderSchema);
//# sourceMappingURL=BookOrder.model.js.map