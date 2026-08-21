"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LawyerProfileModel = void 0;
const mongoose_1 = require("mongoose");
const types_1 = require("./types");
// Verification workflow order 
const VERIFICATION_STAGES = [
    types_1.VerificationStatus.PENDING,
    types_1.VerificationStatus.CREDENTIAL_CHECK,
    types_1.VerificationStatus.TRAINING,
    types_1.VerificationStatus.ASSESSMENT,
    types_1.VerificationStatus.VERIFIED,
];
// Sub-schemas 
const FeeScheduleSchema = new mongoose_1.Schema({
    message: { type: Number, required: true, min: 0, default: 5000 },
    call: { type: Number, required: true, min: 0, default: 12000 },
    video: { type: Number, required: true, min: 0, default: 18000 },
}, { _id: false });
const VerificationDocumentSchema = new mongoose_1.Schema({
    label: { type: String, required: true },
    filename: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    sizeBytes: { type: Number, required: true },
    verified: { type: Boolean, default: null }, // null = pending review
}, { _id: true });
// Schema 
const LawyerProfileSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    // Professional identity 
    scnNumber: { type: String, sparse: true, trim: true },
    yearOfCall: { type: Number, min: 0 },
    calledAt: { type: String }, // "2019"
    title: { type: String, trim: true },
    bio: { type: String, maxlength: 1000 },
    specialisms: [{ type: String, index: true, ref: 'Specialism' }], // ["Family Law", "Employment Law"]
    languages: { type: [String], default: ['English'] },
    // Location 
    location: { type: String, trim: true },
    state: { type: String, trim: true },
    stateCode: { type: String, trim: true },
    // Verification (embedded) 
    verificationStatus: {
        type: String,
        enum: Object.values(types_1.VerificationStatus),
        default: types_1.VerificationStatus.PENDING,
        index: true,
    },
    verificationRejectedReason: { type: String },
    verifiedAt: { type: Date },
    verificationDocuments: { type: [VerificationDocumentSchema], default: [] },
    verificationAdminNote: { type: String },
    verificationReviewedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AdminUser',
    },
    verificationReviewedAt: { type: Date },
    // Badges 
    badges: {
        type: [String],
        enum: Object.values(types_1.LawyerBadge),
        default: [],
    },
    // Availability & fees 
    isAvailable: { type: Boolean, default: true, index: true },
    fees: {
        type: FeeScheduleSchema,
        required: true,
        default: () => ({ message: 5000, call: 12000, video: 18000 }),
    },
    // Performance metrics (denormalised) 
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    consultationCount: { type: Number, default: 0, min: 0 },
    responseTimeLabel: { type: String, default: 'Under 24 hours' },
    // Platform 
    subscriptionTier: {
        type: String,
        enum: ['basic', 'pro'],
        default: 'basic',
    },
    // UI avatar colours 
    colorA: { type: String, default: '#1E3A5F' },
    colorB: { type: String, default: '#2D5A8E' },
}, {
    timestamps: true,
    collection: 'lawyer_profiles',
});
// Indexes 
LawyerProfileSchema.index({ specialisms: 1, state: 1 });
LawyerProfileSchema.index({ verificationStatus: 1, isAvailable: 1 });
LawyerProfileSchema.index({ ratingAvg: -1 });
// Virtual: isVerified 
LawyerProfileSchema.virtual('isVerified').get(function () {
    return this.verificationStatus === types_1.VerificationStatus.VERIFIED;
});
// Instance method: submitVerification 
LawyerProfileSchema.methods.submitVerification = async function (data) {
    this.scnNumber = data.scnNumber;
    this.yearOfCall = data.yearOfCall;
    this.calledAt = data.calledAt;
    if (data.specialisms)
        this.specialisms = data.specialisms;
    if (data.documents)
        this.verificationDocuments = data.documents;
    this.verificationStatus = types_1.VerificationStatus.PENDING;
    this.verificationRejectedReason = undefined;
    this.verifiedAt = undefined;
    this.verificationReviewedBy = undefined;
    this.verificationReviewedAt = undefined;
    return this.save();
};
// Instance method: advanceVerification 
LawyerProfileSchema.methods.advanceVerification = async function (adminId, note) {
    const currentIdx = VERIFICATION_STAGES.indexOf(this.verificationStatus);
    if (currentIdx === -1 || this.verificationStatus === types_1.VerificationStatus.REJECTED) {
        throw new Error('Cannot advance a rejected verification');
    }
    if (this.verificationStatus === types_1.VerificationStatus.VERIFIED) {
        throw new Error('Lawyer is already verified');
    }
    const next = VERIFICATION_STAGES[currentIdx + 1];
    this.verificationStatus = types_1.VerificationStatus.VERIFIED;
    this.verificationReviewedBy = adminId;
    this.verificationReviewedAt = new Date();
    if (note)
        this.verificationAdminNote = note;
    if (next === types_1.VerificationStatus.VERIFIED) {
        this.verifiedAt = new Date();
        if (!this.badges.includes(types_1.LawyerBadge.VERIFIED)) {
            this.badges.push(types_1.LawyerBadge.VERIFIED);
        }
    }
    return this.save();
};
// Instance method: rejectVerification 
LawyerProfileSchema.methods.rejectVerification = async function (adminId, reason) {
    this.verificationStatus = types_1.VerificationStatus.REJECTED;
    this.verificationRejectedReason = reason;
    this.verificationReviewedBy = adminId;
    this.verificationReviewedAt = new Date();
    this.isAvailable = false;
    return this.save();
};
LawyerProfileSchema.methods.infoNeededVerification = async function (adminId, reason) {
    this.verificationStatus = types_1.VerificationStatus.INFO_NEEDED;
    this.verificationRejectedReason = reason;
    this.verificationReviewedBy = adminId;
    this.verificationReviewedAt = new Date();
    this.isAvailable = false;
    return this.save();
};
// Instance method: verifyDocument 
LawyerProfileSchema.methods.verifyDocument = async function (documentId, verified) {
    const doc = this.verificationDocuments.id(documentId);
    if (!doc)
        throw new Error('Document not found on this profile');
    doc.verified = verified;
    return this.save();
};
// Instance method: updateMetrics 
LawyerProfileSchema.methods.updateMetrics = async function (data) {
    if (data.ratingAvg !== undefined)
        this.ratingAvg = data.ratingAvg;
    if (data.reviewCount !== undefined)
        this.reviewCount = data.reviewCount;
    if (data.consultationCount !== undefined)
        this.consultationCount = data.consultationCount;
    if (data.responseTimeLabel !== undefined)
        this.responseTimeLabel = data.responseTimeLabel;
    return this.save();
};
// Instance method: setAvailability 
LawyerProfileSchema.methods.setAvailability = async function (available) {
    // Can only go available if verified
    if (available && this.verificationStatus !== types_1.VerificationStatus.VERIFIED) {
        throw new Error('Only verified lawyers can set themselves as available');
    }
    this.isAvailable = available;
    return this.save();
};
// Export 
exports.LawyerProfileModel = mongoose_1.models.LawyerProfile ||
    (0, mongoose_1.model)('LawyerProfile', LawyerProfileSchema);
//# sourceMappingURL=LawyerProfile.model.js.map