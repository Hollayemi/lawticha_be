"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyChallengeAttemptModel = exports.DailyChallengeModel = exports.CertificateModel = void 0;
const mongoose_1 = require("mongoose");
/**
 * CERTIFICATE
 * Issued when a citizen completes all lessons in a module.
 *
 * From: dashboard/page.tsx     → STATS (certificates count)
 *       dashboard/layer/page.tsx → STATS (Certificates: 3)
 *       dashboard/learn/[slug] → "Complete all topics to earn your Certificate"
 *       dashboard/certificates/page.tsx (implied)
 */
const CertificateSchema = new mongoose_1.Schema({
    citizenId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    moduleId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'LegalModule',
        required: true,
    },
    enrollmentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Enrollment',
        required: true,
    },
    certificateNumber: { type: String, unique: true, required: true },
    issuedAt: { type: Date, default: Date.now },
    pdfUrl: { type: String }, // generated PDF certificate file
    // Denormalised for fast display
    moduleTitle: { type: String },
    citizenName: { type: String },
    instructorName: { type: String },
}, {
    timestamps: true,
    collection: 'certificates',
});
CertificateSchema.index({ citizenId: 1, moduleId: 1 }, { unique: true });
exports.CertificateModel = mongoose_1.models.Certificate || (0, mongoose_1.model)('Certificate', CertificateSchema);
// 
/**
 * DAILY CHALLENGE
 * One quiz question surfaced each day on the dashboard.
 *
 * From: dashboard/page.tsx → DailyQuiz component
 * A citizen can answer once per day,  their response stored in DailyChallengeAttempt.
 */
const DailyChallengeSchema = new mongoose_1.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }], // array of 4 option strings
    correctIndex: { type: Number, required: true }, // 0-based index of correct option
    explanation: { type: String }, // shown after answering
    topicId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'LegalTopic' },
    xpReward: { type: Number, default: 100 },
    activeDate: { type: Date, required: true, unique: true, index: true }, // one per day
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
    collection: 'daily_challenges',
});
exports.DailyChallengeModel = mongoose_1.models.DailyChallenge || (0, mongoose_1.model)('DailyChallenge', DailyChallengeSchema);
// 
/**
 * DAILY CHALLENGE ATTEMPT
 * Records a citizen's answer to a DailyChallenge.
 *
 * One attempt per (citizen, challenge) pair.
 */
const DailyChallengeAttemptSchema = new mongoose_1.Schema({
    citizenId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    challengeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'DailyChallenge', required: true },
    selectedIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    xpAwarded: { type: Number, default: 0 },
    answeredAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
    collection: 'daily_challenge_attempts',
});
DailyChallengeAttemptSchema.index({ citizenId: 1, challengeId: 1 }, { unique: true });
exports.DailyChallengeAttemptModel = mongoose_1.models.DailyChallengeAttempt ||
    (0, mongoose_1.model)('DailyChallengeAttempt', DailyChallengeAttemptSchema);
//# sourceMappingURL=Certificate.model.js.map