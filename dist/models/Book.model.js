"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookModel = void 0;
const mongoose_1 = require("mongoose");
const library_types_1 = require("./types/library.types");
const BookSchema = new mongoose_1.Schema({
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
        enum: Object.values(library_types_1.BookCategory),
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
        enum: Object.values(library_types_1.BookFormat),
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
        enum: Object.values(library_types_1.BookStatus),
        default: library_types_1.BookStatus.ACTIVE,
        index: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AdminUser',
    },
}, {
    timestamps: true,
    collection: 'books',
});
// Indexes
BookSchema.index({ title: 'text', author: 'text', description: 'text', tags: 'text' });
BookSchema.index({ category: 1, format: 1, status: 1 });
BookSchema.index({ featured: 1, createdAt: -1 });
// Methods
BookSchema.methods.incrementDownloadCount = async function () {
    this.downloadCount += 1;
    await this.save();
};
BookSchema.methods.incrementOrderCount = async function (quantity) {
    this.orderCount += quantity;
    if (this.stockCount !== null) {
        this.stockCount = Math.max(0, this.stockCount - quantity);
    }
    await this.save();
};
BookSchema.methods.updateRating = async function (newRating) {
    const totalRating = this.rating * this.reviewCount + newRating;
    this.reviewCount += 1;
    this.rating = totalRating / this.reviewCount;
    await this.save();
};
exports.BookModel = mongoose_1.models.Book || (0, mongoose_1.model)('Book', BookSchema);
//# sourceMappingURL=Book.model.js.map