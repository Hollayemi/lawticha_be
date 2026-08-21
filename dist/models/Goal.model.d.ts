import { Types, Document } from 'mongoose';
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
export declare const GoalModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
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
export declare const CitizenGoalProgressModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=Goal.model.d.ts.map