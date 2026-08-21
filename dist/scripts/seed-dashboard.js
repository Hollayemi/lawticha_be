"use strict";
/**
 * Seed script — creates a few sample DailyChallenge quizzes (one per day,
 * starting today) and one active Goal for the citizen dashboard.
 *
 * Usage:
 *   npx tsx src/scripts/seed-dashboard.ts
 *
 * Required env vars:
 *   MONGODB_URI
 *
 * Safe to re-run: it upserts by activeDate (challenges) and by title (goal),
 * so running it twice won't create duplicates.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const Certificate_model_1 = require("../models/Certificate.model");
const Goal_model_1 = require("../models/Goal.model");
function dayOffset(days) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d;
}
const SAMPLE_CHALLENGES = [
    {
        activeDate: dayOffset(0),
        question: 'Under Nigerian law, how long can the police detain a suspect before they must be charged in court or released?',
        options: ['24 hours', '48 hours', '7 days', '14 days'],
        correctIndex: 1,
        explanation: 'Section 35 of the 1999 Constitution requires a suspect to be brought before a court within 48 hours (or a reasonable time for remote areas), unless a court order extends this.',
        xpReward: 100,
    },
    {
        activeDate: dayOffset(1),
        question: 'A landlord wants to evict a tenant in Lagos State. What is generally required before the tenant can be forced out?',
        options: [
            'A verbal warning is enough',
            'A valid court order following due notice',
            'The landlord can change the locks immediately',
            'Nothing — landlords can evict at will',
        ],
        correctIndex: 1,
        explanation: 'Self-help eviction is illegal. A landlord must issue proper notice and obtain a court order (recovery of premises) before repossessing the property.',
        xpReward: 100,
    },
    {
        activeDate: dayOffset(2),
        question: 'Which government agency is responsible for registering a business name or company in Nigeria?',
        options: ['FIRS', 'CAC', 'NAFDAC', 'SON'],
        correctIndex: 1,
        explanation: 'The Corporate Affairs Commission (CAC) handles business name and company registration in Nigeria.',
        xpReward: 100,
    },
];
const SAMPLE_GOAL = {
    title: 'Know Your Rights: Foundations Track',
    description: 'Finish these steps to build a solid baseline understanding of your legal rights.',
    bonusXpOnCompletion: 100,
    isActive: true,
    sortOrder: 0,
    tasks: [
        { text: 'Complete your first learning module', xpReward: 30, order: 1 },
        { text: 'Answer 3 daily challenges correctly', xpReward: 30, order: 2 },
        { text: 'Bookmark a legal act or module for later', xpReward: 20, order: 3 },
        { text: 'Post or reply in the community', xpReward: 20, order: 4 },
    ],
};
async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('\u274c  MONGODB_URI not set');
        process.exit(1);
    }
    await mongoose_1.default.connect(uri);
    console.log('\u2705  Connected to MongoDB');
    // ── Daily challenges ──
    for (const challenge of SAMPLE_CHALLENGES) {
        await Certificate_model_1.DailyChallengeModel.findOneAndUpdate({ activeDate: challenge.activeDate }, { $set: { ...challenge, isActive: true } }, { upsert: true, new: true });
        console.log(`\u2705  Seeded challenge for ${challenge.activeDate.toDateString()}`);
    }
    // ── Goal ──
    const existingGoal = await Goal_model_1.GoalModel.findOne({ title: SAMPLE_GOAL.title });
    if (existingGoal) {
        console.log(`\u26a0\ufe0f   Goal "${SAMPLE_GOAL.title}" already exists — skipping`);
    }
    else {
        // Deactivate any other active goal so only one is "current" at a time.
        await Goal_model_1.GoalModel.updateMany({ isActive: true }, { $set: { isActive: false } });
        await Goal_model_1.GoalModel.create(SAMPLE_GOAL);
        console.log(`\u2705  Created active goal "${SAMPLE_GOAL.title}"`);
    }
    await mongoose_1.default.disconnect();
    console.log('\u2705  Done');
}
seed().catch((err) => {
    console.error('\u274c  Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed-dashboard.js.map