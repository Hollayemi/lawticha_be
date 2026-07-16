import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';
import * as dashboardService from '../services/citizenDashboard.service';

function uid(req: Request): string {
  return req.user!._id.toString();
}

// GET /api/v1/dashboard
export const getDashboardDataHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const data = await dashboardService.getDashboardData(uid(req));
    return (res as AppResponse).data(data, 'Dashboard data fetched.');
  }
);

// GET /api/v1/dashboard/stats
export const getUserStatsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const data = await dashboardService.getUserStats(uid(req));
    return (res as AppResponse).data(data, 'Stats fetched.');
  }
);

// GET /api/v1/dashboard/continue-reading
export const getContinueReadingHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const data = await dashboardService.getContinueReading(uid(req));
    return (res as AppResponse).data(data, 'Continue reading items fetched.');
  }
);

// GET /api/v1/dashboard/daily-challenge
export const getDailyChallengeHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await dashboardService.getDailyChallenge(uid(req));
    if (!data) return next(new AppError('No challenge is available today.', 404, 'NOT_FOUND'));
    return (res as AppResponse).data(data, 'Daily challenge fetched.');
  }
);

// GET /api/v1/dashboard/trending
export const getTrendingTopicsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { limit } = req.query as Record<string, string>;
    const data = await dashboardService.getTrendingTopics(limit ? Number(limit) : undefined);
    return (res as AppResponse).data(data, 'Trending topics fetched.');
  }
);

// GET /api/v1/dashboard/bookmarks
export const getBookmarksHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const data = await dashboardService.getBookmarks(uid(req));
    return (res as AppResponse).data(data, 'Bookmarks fetched.');
  }
);

// GET /api/v1/dashboard/community
export const getCommunityHighlightsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { limit } = req.query as Record<string, string>;
    const data = await dashboardService.getCommunityHighlights(limit ? Number(limit) : undefined);
    return (res as AppResponse).data(data, 'Community highlights fetched.');
  }
);

// GET /api/v1/dashboard/goal
export const getNextGoalHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await dashboardService.getNextGoal(uid(req));
    if (!data) return next(new AppError('No active goal found.', 404, 'NOT_FOUND'));
    return (res as AppResponse).data(data, 'Next goal fetched.');
  }
);

// POST /api/v1/dashboard/quiz/submit
export const submitQuizAnswerHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { questionId, answer } = req.body as { questionId?: string; answer?: number };

    if (!questionId) return next(new AppError('questionId is required.', 400, 'VALIDATION_ERROR'));
    if (answer === undefined || answer === null) {
      return next(new AppError('answer is required.', 400, 'VALIDATION_ERROR'));
    }

    const data = await dashboardService.submitQuizAnswer(uid(req), questionId, Number(answer));
    return (res as AppResponse).data(data, 'Answer submitted.');
  }
);

// PATCH /api/v1/dashboard/progress
export const updateReadingProgressHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { slug, progress } = req.body as { slug?: string; progress?: number };

    if (!slug?.trim()) return next(new AppError('slug is required.', 400, 'VALIDATION_ERROR'));
    if (progress === undefined || progress === null) {
      return next(new AppError('progress is required.', 400, 'VALIDATION_ERROR'));
    }

    const data = await dashboardService.updateReadingProgress(uid(req), slug, Number(progress));
    return (res as AppResponse).data(data, 'Progress updated.');
  }
);

// POST /api/v1/dashboard/bookmarks
export const addBookmarkHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { title, law } = req.body as { title?: string; law?: string };

    if (!title?.trim()) return next(new AppError('title is required.', 400, 'VALIDATION_ERROR'));

    const data = await dashboardService.addBookmark(uid(req), title, law || '');
    return (res as AppResponse).data(data, 'Bookmark added.', 201);
  }
);

// DELETE /api/v1/dashboard/bookmarks
export const removeBookmarkHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { title } = req.body as { title?: string };

    if (!title?.trim()) return next(new AppError('title is required.', 400, 'VALIDATION_ERROR'));

    await dashboardService.removeBookmark(uid(req), title);
    return (res as AppResponse).success('Bookmark removed.');
  }
);

// POST /api/v1/dashboard/goal/tasks/complete
export const completeGoalTaskHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { text } = req.body as { text?: string };
    if (!text?.trim()) return next(new AppError('text is required.', 400, 'VALIDATION_ERROR'));

    const data = await dashboardService.completeGoalTask(uid(req), text);
    if (!data) return next(new AppError('No active goal found.', 404, 'NOT_FOUND'));
    return (res as AppResponse).data(data, 'Task completed.');
  }
);
