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
export {};
//# sourceMappingURL=seed-dashboard.d.ts.map