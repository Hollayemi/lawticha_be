"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudySessionModel = void 0;
const mongoose_1 = require("mongoose");
/**
 * STUDY SESSION
 * Records each time a citizen actively studies (watches video / reads content).
 * Aggregated monthly for the Hours Spent chart in dashboard/layer/page.tsx.
 *
 * From: dashboard/layer/page.tsx → CHART_DATA (study vs assessment hours per month)
 *       dashboard/page.tsx       → STATS "14h Time Invested"
 *       CitizenProfile           → totalStudyMinutes (updated from sessions)
 *
 * sessionType:
 *   'study'      → watching a lesson video or reading content
 *   'assessment' → completing a quiz / daily challenge
 */
const StudySessionSchema = new mongoose_1.Schema({
    citizenId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    moduleId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'LegalModule',
    },
    lessonId: {
        type: mongoose_1.Schema.Types.ObjectId,
    },
    enrollmentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Enrollment',
    },
    sessionType: {
        type: String,
        enum: ['study', 'assessment'],
        default: 'study',
    },
    durationMinutes: { type: Number, required: true, min: 0 },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    // Used for monthly chart grouping
    year: { type: Number, required: true, index: true },
    month: { type: Number, required: true, index: true }, // 1-12
}, {
    timestamps: true,
    collection: 'study_sessions',
});
StudySessionSchema.index({ citizenId: 1, year: 1, month: 1 });
StudySessionSchema.index({ citizenId: 1, sessionType: 1, year: 1, month: 1 });
exports.StudySessionModel = mongoose_1.models.StudySession || (0, mongoose_1.model)('StudySession', StudySessionSchema);
//# sourceMappingURL=StudySession.model.js.map