import { Schema, model, models, Types, Document } from 'mongoose';

/**
 * GOAL  (template)
 * A learning "campaign" surfaced on the dashboard as NEXT GOAL, e.g.
 * "Finish your Tenant Rights track". Admin/seed-authored — one is marked
 * `isActive` at a time (the current platform-wide push). A citizen's
 * progress against it is tracked separately in CitizenGoalProgress so the
 * same template can be reused/reassigned without losing history.
 *
 * From: dashboard/page.tsx → NEXT GOAL card (title, description, task checklist)
 */
export interface IGoalTask {
  _id: Types.ObjectId;
  text: string;
  xpReward: number;
  order: number;
}

const GoalTaskSchema = new Schema<IGoalTask>(
  {
    text:     { type: String, required: true, trim: true },
    xpReward: { type: Number, default: 20, min: 0 },
    order:    { type: Number, default: 0 },
  },
  { _id: true }
);

export interface IGoal extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  tasks: Types.DocumentArray<IGoalTask>;
  bonusXpOnCompletion: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    tasks:       [GoalTaskSchema],

    // Extra XP awarded once every task is done (on top of per-task xpReward)
    bonusXpOnCompletion: { type: Number, default: 50, min: 0 },

    isActive:  { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'goals',
  }
);

GoalSchema.index({ isActive: 1, sortOrder: 1 });

export const GoalModel = models.Goal || model<IGoal>('Goal', GoalSchema);

// ────────────────────────────────────────────────────────────────────────────

/**
 * CITIZEN GOAL PROGRESS
 * One record per (citizen, goal). Tracks which task ids are done and
 * whether the completion bonus has already been paid out (so re-fetching
 * or re-triggering a task doesn't double-award XP).
 */
export interface ICitizenGoalProgress extends Document {
  _id: Types.ObjectId;
  citizenId: Types.ObjectId;
  goalId: Types.ObjectId;
  completedTaskIds: Types.ObjectId[];
  bonusAwarded: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CitizenGoalProgressSchema = new Schema<ICitizenGoalProgress>(
  {
    citizenId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goalId:    { type: Schema.Types.ObjectId, ref: 'Goal', required: true, index: true },

    completedTaskIds: [{ type: Schema.Types.ObjectId }],
    bonusAwarded:      { type: Boolean, default: false },
    completedAt:        { type: Date },
  },
  {
    timestamps: true,
    collection: 'citizen_goal_progress',
  }
);

CitizenGoalProgressSchema.index({ citizenId: 1, goalId: 1 }, { unique: true });

export const CitizenGoalProgressModel =
  models.CitizenGoalProgress ||
  model<ICitizenGoalProgress>('CitizenGoalProgress', CitizenGoalProgressSchema);
