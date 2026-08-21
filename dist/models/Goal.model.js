"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CitizenGoalProgressModel = exports.GoalModel = void 0;
const mongoose_1 = require("mongoose");
const GoalTaskSchema = new mongoose_1.Schema({
    text: { type: String, required: true, trim: true },
    xpReward: { type: Number, default: 20, min: 0 },
    order: { type: Number, default: 0 },
}, { _id: true });
const GoalSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    tasks: [GoalTaskSchema],
    // Extra XP awarded once every task is done (on top of per-task xpReward)
    bonusXpOnCompletion: { type: Number, default: 50, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
}, {
    timestamps: true,
    collection: 'goals',
});
GoalSchema.index({ isActive: 1, sortOrder: 1 });
exports.GoalModel = mongoose_1.models.Goal || (0, mongoose_1.model)('Goal', GoalSchema);
const CitizenGoalProgressSchema = new mongoose_1.Schema({
    citizenId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goalId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Goal', required: true, index: true },
    completedTaskIds: [{ type: mongoose_1.Schema.Types.ObjectId }],
    bonusAwarded: { type: Boolean, default: false },
    completedAt: { type: Date },
}, {
    timestamps: true,
    collection: 'citizen_goal_progress',
});
CitizenGoalProgressSchema.index({ citizenId: 1, goalId: 1 }, { unique: true });
exports.CitizenGoalProgressModel = mongoose_1.models.CitizenGoalProgress ||
    (0, mongoose_1.model)('CitizenGoalProgress', CitizenGoalProgressSchema);
//# sourceMappingURL=Goal.model.js.map