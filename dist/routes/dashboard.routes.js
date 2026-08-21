"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const citizenDashboard_controller_1 = require("../controllers/citizenDashboard.controller");
const router = (0, express_1.Router)();
// Personalized data — every route needs a logged-in citizen.
router.use(auth_middleware_1.protect);
/**
 * @route   GET /api/v1/dashboard
 * @desc    Full aggregated dashboard payload for the logged-in citizen
 */
router.get('/', citizenDashboard_controller_1.getDashboardDataHandler);
/**
 * @route   GET /api/v1/dashboard/stats
 * @desc    XP, level, streak, topics/certificates/study-minutes totals
 */
router.get('/stats', citizenDashboard_controller_1.getUserStatsHandler);
/**
 * @route   GET /api/v1/dashboard/continue-reading
 * @desc    In-progress modules, most recently active first
 */
router.get('/continue-reading', citizenDashboard_controller_1.getContinueReadingHandler);
/**
 * @route   GET /api/v1/dashboard/daily-challenge
 * @desc    Today's quiz question + whether the citizen has already answered
 */
router.get('/daily-challenge', citizenDashboard_controller_1.getDailyChallengeHandler);
/**
 * @route   GET /api/v1/dashboard/trending
 * @desc    Trending topics by watch count
 * @query   limit?
 */
router.get('/trending', citizenDashboard_controller_1.getTrendingTopicsHandler);
/**
 * @route   GET /api/v1/dashboard/bookmarks
 * @desc    Citizen's saved legal acts / modules / lessons
 */
router.get('/bookmarks', citizenDashboard_controller_1.getBookmarksHandler);
/**
 * @route   GET /api/v1/dashboard/community
 * @desc    Top community post highlights
 * @query   limit?
 */
router.get('/community', citizenDashboard_controller_1.getCommunityHighlightsHandler);
/**
 * @route   GET /api/v1/dashboard/goal
 * @desc    Current active goal + this citizen's task-completion progress
 */
router.get('/goal', citizenDashboard_controller_1.getNextGoalHandler);
/**
 * @route   POST /api/v1/dashboard/quiz/submit
 * @desc    Submit an answer to today's daily challenge (once per day). Awards XP on a correct answer.
 * @body    { questionId: string, answer: number }
 */
router.post('/quiz/submit', citizenDashboard_controller_1.submitQuizAnswerHandler);
/**
 * @route   PATCH /api/v1/dashboard/progress
 * @desc    Update reading/lesson progress for a module. Awards remaining XP on completion.
 * @body    { slug: string, progress: number }
 */
router.patch('/progress', citizenDashboard_controller_1.updateReadingProgressHandler);
/**
 * @route   POST /api/v1/dashboard/bookmarks
 * @body    { title: string, law: string }
 */
router.post('/bookmarks', citizenDashboard_controller_1.addBookmarkHandler);
/**
 * @route   DELETE /api/v1/dashboard/bookmarks
 * @body    { title: string }
 */
router.delete('/bookmarks', citizenDashboard_controller_1.removeBookmarkHandler);
/**
 * @route   POST /api/v1/dashboard/goal/tasks/complete
 * @desc    Mark a task on the active goal done (identified by its text, matching
 *          the frontend's own markTaskComplete reducer). Awards XP, plus a
 *          completion bonus once every task is done.
 * @body    { text: string }
 */
router.post('/goal/tasks/complete', citizenDashboard_controller_1.completeGoalTaskHandler);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map