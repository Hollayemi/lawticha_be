"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationModel = void 0;
const mongoose_1 = require("mongoose");
const lawticha_types_1 = require("./types/lawticha.types");
const DocumentSchema = new mongoose_1.Schema({
    label: { type: String, required: true },
    filename: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    sizeBytes: { type: Number, required: true },
    verified: { type: Boolean, default: null },
}, { _id: true });
const VerificationSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        index: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    state: {
        type: String,
        trim: true,
    },
    color: {
        type: String,
        default: '#1E3A5F',
    },
    scnNumber: {
        type: String,
        required: [true, 'SCN number is required'],
        trim: true,
        index: true,
    },
    yearsCall: {
        type: Number,
        required: true,
        min: 0,
    },
    calledAt: {
        type: String, // year as string, e.g. "2019"
        required: true,
    },
    specialisms: {
        type: [String],
        default: [],
        ref: 'Specialism',
    },
    status: {
        type: String,
        enum: Object.values(lawticha_types_1.VerificationStatus),
        default: lawticha_types_1.VerificationStatus.PENDING,
        index: true,
    },
    adminNote: {
        type: String,
        default: null,
    },
    rejectionReason: {
        type: String,
        default: null,
    },
    reviewedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AdminUser',
        default: null,
    },
    reviewedAt: {
        type: Date,
        default: null,
    },
    documents: {
        type: [DocumentSchema],
        default: [],
    },
    lawyerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Lawyer',
        default: null,
    },
    removedAt: {
        type: Date,
        default: null,
    },
    removedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AdminUser',
        default: null,
    },
}, {
    timestamps: true,
    collection: 'verifications',
});
VerificationSchema.index({ status: 1, removedAt: 1 });
VerificationSchema.index({ name: 'text', scnNumber: 'text', email: 'text' });
VerificationSchema.index({ createdAt: -1 });
VerificationSchema.virtual('initials').get(function () {
    return this.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
});
VerificationSchema.set('toObject', { virtuals: true });
VerificationSchema.set('toJSON', { virtuals: true });
exports.VerificationModel = mongoose_1.models.Verification || (0, mongoose_1.model)('Verification', VerificationSchema);
//# sourceMappingURL=Verification.model.js.map