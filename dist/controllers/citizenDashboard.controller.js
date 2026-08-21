"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeGoalTaskHandler = exports.removeBookmarkHandler = exports.addBookmarkHandler = exports.updateReadingProgressHandler = exports.submitQuizAnswerHandler = exports.getNextGoalHandler = exports.getCommunityHighlightsHandler = exports.getBookmarksHandler = exports.getTrendingTopicsHandler = exports.getDailyChallengeHandler = exports.getContinueReadingHandler = exports.getUserStatsHandler = exports.getDashboardDataHandler = void 0;
const error_1 = require("../middleware/error");
const dashboardService = __importStar(require("../services/citizenDashboard.service"));
function uid(req) {
    return req.user._id.toString();
}
// GET /api/v1/dashboard
exports.getDashboardDataHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const data = await dashboardService.getDashboardData(uid(req));
    return res.data(data, 'Dashboard data fetched.');
});
// GET /api/v1/dashboard/stats
exports.getUserStatsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const data = await dashboardService.getUserStats(uid(req));
    return res.data(data, 'Stats fetched.');
});
// GET /api/v1/dashboard/continue-reading
exports.getContinueReadingHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const data = await dashboardService.getContinueReading(uid(req));
    return res.data(data, 'Continue reading items fetched.');
});
// GET /api/v1/dashboard/daily-challenge
exports.getDailyChallengeHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const data = await dashboardService.getDailyChallenge(uid(req));
    if (!data)
        return next(new error_1.AppError('No challenge is available today.', 404, 'NOT_FOUND'));
    return res.data(data, 'Daily challenge fetched.');
});
// GET /api/v1/dashboard/trending
exports.getTrendingTopicsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { limit } = req.query;
    const data = await dashboardService.getTrendingTopics(limit ? Number(limit) : undefined);
    return res.data(data, 'Trending topics fetched.');
});
// GET /api/v1/dashboard/bookmarks
exports.getBookmarksHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const data = await dashboardService.getBookmarks(uid(req));
    return res.data(data, 'Bookmarks fetched.');
});
// GET /api/v1/dashboard/community
exports.getCommunityHighlightsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { limit } = req.query;
    const data = await dashboardService.getCommunityHighlights(limit ? Number(limit) : undefined);
    return res.data(data, 'Community highlights fetched.');
});
// GET /api/v1/dashboard/goal
exports.getNextGoalHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const data = await dashboardService.getNextGoal(uid(req));
    if (!data)
        return next(new error_1.AppError('No active goal found.', 404, 'NOT_FOUND'));
    return res.data(data, 'Next goal fetched.');
});
// POST /api/v1/dashboard/quiz/submit
exports.submitQuizAnswerHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { questionId, answer } = req.body;
    if (!questionId)
        return next(new error_1.AppError('questionId is required.', 400, 'VALIDATION_ERROR'));
    if (answer === undefined || answer === null) {
        return next(new error_1.AppError('answer is required.', 400, 'VALIDATION_ERROR'));
    }
    const data = await dashboardService.submitQuizAnswer(uid(req), questionId, Number(answer));
    return res.data(data, 'Answer submitted.');
});
// PATCH /api/v1/dashboard/progress
exports.updateReadingProgressHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { slug, progress } = req.body;
    if (!slug?.trim())
        return next(new error_1.AppError('slug is required.', 400, 'VALIDATION_ERROR'));
    if (progress === undefined || progress === null) {
        return next(new error_1.AppError('progress is required.', 400, 'VALIDATION_ERROR'));
    }
    const data = await dashboardService.updateReadingProgress(uid(req), slug, Number(progress));
    return res.data(data, 'Progress updated.');
});
// POST /api/v1/dashboard/bookmarks
exports.addBookmarkHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { title, law } = req.body;
    if (!title?.trim())
        return next(new error_1.AppError('title is required.', 400, 'VALIDATION_ERROR'));
    const data = await dashboardService.addBookmark(uid(req), title, law || '');
    return res.data(data, 'Bookmark added.', 201);
});
// DELETE /api/v1/dashboard/bookmarks
exports.removeBookmarkHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { title } = req.body;
    if (!title?.trim())
        return next(new error_1.AppError('title is required.', 400, 'VALIDATION_ERROR'));
    await dashboardService.removeBookmark(uid(req), title);
    return res.success('Bookmark removed.');
});
// POST /api/v1/dashboard/goal/tasks/complete
exports.completeGoalTaskHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { text } = req.body;
    if (!text?.trim())
        return next(new error_1.AppError('text is required.', 400, 'VALIDATION_ERROR'));
    const data = await dashboardService.completeGoalTask(uid(req), text);
    if (!data)
        return next(new error_1.AppError('No active goal found.', 404, 'NOT_FOUND'));
    return res.data(data, 'Task completed.');
});
//# sourceMappingURL=citizenDashboard.controller.js.map