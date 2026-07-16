import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getDashboardDataHandler,
  getUserStatsHandler,
  getContinueReadingHandler,
  getDailyChallengeHandler,
  getTrendingTopicsHandler,
  getBookmarksHandler,
  getCommunityHighlightsHandler,
  getNextGoalHandler,
  submitQuizAnswerHandler,
  updateReadingProgressHandler,
  addBookmarkHandler,
  removeBookmarkHandler,
  completeGoalTaskHandler,
} from '../controllers/citizenDashboard.controller';

const router = Router();

// Personalized data — every route needs a logged-in citizen.
router.use(protect);

/**
 * @route   GET /api/v1/dashboard
 * @desc    Full aggregated dashboard payload for the logged-in citizen
 */
router.get('/', getDashboardDataHandler);

/**
 * @route   GET /api/v1/dashboard/stats
 * @desc    XP, level, streak, topics/certificates/study-minutes totals
 */
router.get('/stats', getUserStatsHandler);

/**
 * @route   GET /api/v1/dashboard/continue-reading
 * @desc    In-progress modules, most recently active first
 */
router.get('/continue-reading', getContinueReadingHandler);

/**
 * @route   GET /api/v1/dashboard/daily-challenge
 * @desc    Today's quiz question + whether the citizen has already answered
 */
router.get('/daily-challenge', getDailyChallengeHandler);

/**
 * @route   GET /api/v1/dashboard/trending
 * @desc    Trending topics by watch count
 * @query   limit?
 */
router.get('/trending', getTrendingTopicsHandler);

/**
 * @route   GET /api/v1/dashboard/bookmarks
 * @desc    Citizen's saved legal acts / modules / lessons
 */
router.get('/bookmarks', getBookmarksHandler);

/**
 * @route   GET /api/v1/dashboard/community
 * @desc    Top community post highlights
 * @query   limit?
 */
router.get('/community', getCommunityHighlightsHandler);

/**
 * @route   GET /api/v1/dashboard/goal
 * @desc    Current active goal + this citizen's task-completion progress
 */
router.get('/goal', getNextGoalHandler);

/**
 * @route   POST /api/v1/dashboard/quiz/submit
 * @desc    Submit an answer to today's daily challenge (once per day). Awards XP on a correct answer.
 * @body    { questionId: string, answer: number }
 */
router.post('/quiz/submit', submitQuizAnswerHandler);

/**
 * @route   PATCH /api/v1/dashboard/progress
 * @desc    Update reading/lesson progress for a module. Awards remaining XP on completion.
 * @body    { slug: string, progress: number }
 */
router.patch('/progress', updateReadingProgressHandler);

/**
 * @route   POST /api/v1/dashboard/bookmarks
 * @body    { title: string, law: string }
 */
router.post('/bookmarks', addBookmarkHandler);

/**
 * @route   DELETE /api/v1/dashboard/bookmarks
 * @body    { title: string }
 */
router.delete('/bookmarks', removeBookmarkHandler);

/**
 * @route   POST /api/v1/dashboard/goal/tasks/complete
 * @desc    Mark a task on the active goal done (identified by its text, matching
 *          the frontend's own markTaskComplete reducer). Awards XP, plus a
 *          completion bonus once every task is done.
 * @body    { text: string }
 */
router.post('/goal/tasks/complete', completeGoalTaskHandler);

export default router;
