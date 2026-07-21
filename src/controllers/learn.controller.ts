import { Request, Response, NextFunction } from 'express';
import * as learnService from '../services/learn.service';
import * as subtopicService from '../services/subtopic.service';
import { AppError, AppResponse, asyncHandler } from '../middleware/error';
import { Types } from 'mongoose';

// GET /learn/modules
export const listLearnModules = asyncHandler(async (req: Request, res: Response) => {
  const {
    tab,
    search,
    category,
    page = 1,
    pageSize = 20,
  } = req.query;

  const citizenId = (req as any).user?.id;

  const result = await learnService.listLearnModules({
    tab: tab as any,
    search: search as string,
    category: category as any,
    page: Number(page),
    pageSize: Number(pageSize),
    citizenId,
  });

  return (res as AppResponse).data({
    data: result.data,
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  }, "Modules retrieved successfully.");
});

// GET /learn/material/:slug
export const getFullMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { slug = "" } = req.params;
  const result = await learnService.getFullMaterialByModuleSlug(slug);
  return (res as AppResponse).data({
    data: result,
  }, "Material retrieved successfully.");
});

// POST /learn/material/:slug
export const generateMaterialSummary = asyncHandler(async (req: Request, res: Response) => {
  if (!req.body.slug) {
    throw new AppError('Module Slug is required', 401, 'INVALID');
  }
  const result = await learnService.generateAndSaveSummary(req.body.slug, req.body.max_words);
  return (res as AppResponse).data({
    data: result,
  }, "Material generated successfully.");
});

// GET /learn/modules/:slug
export const getLearnModuleBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const citizenId = (req as any).user?.id;

  const moduleDetail = await learnService.getLearnModuleBySlug(slug, citizenId);

  return (res as AppResponse).data(moduleDetail, "Module retrieved successfully.");
});

// GET /learn/modules/:moduleSlug/topics/:topicSlug
export const getLearnTopicBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { moduleSlug, topicSlug } = req.params;
  const citizenId = (req as any).user?.id;

  const topicDetail = await learnService.getLearnTopicBySlug(moduleSlug, topicSlug, citizenId);

  return (res as AppResponse).data(topicDetail, "Topic retrieved successfully.");
});

// GET /learn/continue-reading
export const getContinueReading = asyncHandler(async (req: Request, res: Response) => {
  const citizenId = (req as any).user?.id;

  if (!citizenId) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const continueReading = await learnService.getContinueReading(citizenId);

  return (res as AppResponse).data(continueReading, "Continue reading items retrieved successfully.");
});

// GET /learn/featured-topics
export const getFeaturedTopics = asyncHandler(async (req: Request, res: Response) => {
  const featuredTopics = await learnService.getFeaturedTopics();

  return (res as AppResponse).data(featuredTopics, "Featured topics retrieved successfully.");
});

// POST /learn/modules/:moduleId/save
export const toggleSaveModule = asyncHandler(async (req: Request, res: Response) => {
  const { moduleId } = req.params;
  const citizenId = (req as any).user?.id;

  if (!citizenId) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const result = await learnService.toggleSaveModule(moduleId, citizenId);

  return (res as AppResponse).data(result, result.saved ? 'Module saved successfully' : 'Module unsaved successfully');
});

// POST /learn/modules/:moduleId/enrol
export const enrolInModule = asyncHandler(async (req: Request, res: Response) => {
  const { moduleId } = req.params;
  const citizenId = (req as any).user?.id;

  if (!citizenId) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const result = await learnService.enrolInModule(moduleId, citizenId);

  return (res as AppResponse).data(result, 'Successfully enrolled in module');
});

// POST /learn/modules/:moduleId/topics/:topicId/complete
export const markTopicComplete = asyncHandler(async (req: Request, res: Response) => {
  const { moduleId, topicId } = req.params;
  const citizenId = (req as any).user?.id;

  if (!citizenId) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const result = await learnService.markTopicComplete(moduleId, topicId, citizenId);

  return (res as AppResponse).data(result, 'Topic marked as complete');
});

// PATCH /learn/modules/:moduleId/topics/:topicId/progress
export const saveVideoProgress = asyncHandler(async (req: Request, res: Response) => {
  const { moduleId, topicId } = req.params;
  const { currentTimeSeconds } = req.body;
  const citizenId = (req as any).user?.id;

  if (!citizenId) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  if (typeof currentTimeSeconds !== 'number') {
    throw new AppError('currentTimeSeconds is required and must be a number', 400, 'INVALID_INPUT');
  }

  const result = await learnService.saveVideoProgress(moduleId, topicId, citizenId, currentTimeSeconds);

  return (res as AppResponse).data(result, 'Video progress saved successfully');
});

// ============================================
// BOOKMARK CONTROLLERS
// ============================================

/**
 * POST /learn/subtopics/:subtopicId/bookmarks
 * Create a new bookmark for a subtopic
 */
export const createBookmark = asyncHandler(async (req: Request, res: Response) => {
  const { subtopicId } = req.params;
  const { highlightedText, comment, startOffset, endOffset, url } = req.body;
  const citizenId = (req as any).user?.id;

  if (!citizenId) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  if (!highlightedText) {
    throw new AppError('highlightedText is required', 400, 'VALIDATION_ERROR');
  }

  const bookmark = await subtopicService.createBookmark({
    subtopicId,
    citizenId,
    highlightedText,
    comment,
    url,
    startOffset,
    endOffset,
  });

  return (res as AppResponse).data(bookmark, 'Bookmark created successfully', 201);
});

/**
 * GET /learn/subtopics/:subtopicId/bookmarks
 * Get all bookmarks for a subtopic
 */
export const listBookmarksForSubtopic = asyncHandler(async (req: Request, res: Response) => {
  const { subtopicId } = req.params;
  const citizenId = (req as any).user?.id;

  if (!citizenId) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const bookmarks = await subtopicService.listBookmarksForSubtopic(subtopicId, citizenId);

  return (res as AppResponse).data(bookmarks, 'Bookmarks retrieved successfully');
});

/**
 * GET /learn/bookmarks
 * Get all bookmarks for the authenticated user with pagination
 */
export const listMyBookmarks = asyncHandler(async (req: Request, res: Response) => {
  const citizenId = (req as any).user?.id;
  const { moduleId, topicId, page = 1, pageSize = 20 } = req.query;

  if (!citizenId) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const result = await subtopicService.listMyBookmarks({
    citizenId,
    moduleId: moduleId as string,
    topicId: topicId as string,
    page: Number(page),
    pageSize: Number(pageSize),
  });

  return (res as AppResponse).data({
    data: result.data,
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Bookmarks retrieved successfully');
});

/**
 * GET /learn/bookmarks/:bookmarkId
 * Get a single bookmark by ID
 */
export const getBookmarkById = asyncHandler(async (req: Request, res: Response) => {
  const { bookmarkId } = req.params;
  const citizenId = (req as any).user?.id;

  if (!citizenId) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const bookmark = await subtopicService.getBookmarkById(bookmarkId, citizenId);

  return (res as AppResponse).data(bookmark, 'Bookmark retrieved successfully');
});

/**
 * PUT /learn/bookmarks/:bookmarkId
 * Update a bookmark
 */
export const updateBookmark = asyncHandler(async (req: Request, res: Response) => {
  const { bookmarkId } = req.params;
  const { highlightedText, comment, startOffset, endOffset } = req.body;
  const citizenId = (req as any).user?.id;

  if (!citizenId) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const bookmark = await subtopicService.updateBookmark(bookmarkId, citizenId, {
    highlightedText,
    comment,
    startOffset,
    endOffset,
  });

  return (res as AppResponse).data(bookmark, 'Bookmark updated successfully');
});

/**
 * DELETE /learn/bookmarks/:bookmarkId
 * Delete a bookmark
 */
export const deleteBookmark = asyncHandler(async (req: Request, res: Response) => {
  const { bookmarkId } = req.params;
  const citizenId = (req as any).user?.id;

  if (!citizenId) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  await subtopicService.deleteBookmark(bookmarkId, citizenId);

  return (res as AppResponse).data(null, 'Bookmark deleted successfully');
});

// ============================================
// SUBTOPIC INTERACTION CONTROLLERS
// ============================================

/**
 * POST /learn/subtopics/:subtopicId/like
 * Toggle like on a subtopic
 */
export const toggleLikeSubtopic = asyncHandler(async (req: Request, res: Response) => {
  const { subtopicId } = req.params;
  const citizenId = (req as any).user?.id;

  if (!citizenId) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const result = await subtopicService.toggleLikeSubtopic(subtopicId, citizenId);

  return (res as AppResponse).data(result, result.liked ? 'Subtopic liked' : 'Subtopic unliked');
});

/**
 * POST /learn/subtopics/:subtopicId/complete
 * Toggle complete status on a subtopic
 */
export const toggleCompleteSubtopic = asyncHandler(async (req: Request, res: Response) => {
  const { subtopicId } = req.params;
  const citizenId = (req as any).user?.id;

  if (!citizenId) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const result = await subtopicService.toggleCompleteSubtopic(subtopicId, citizenId);

  console.log({ result })

  return (res as AppResponse).data(result, result.completed ? 'Subtopic marked as complete' : 'Subtopic marked as incomplete');
});

/**
 * GET /learn/subtopics/:subtopicId/state
 * Get the current user's state for a subtopic (liked, completed)
 */
export const getSubtopicState = asyncHandler(async (req: Request, res: Response) => {
  const { subtopicId } = req.params;
  const citizenId = (req as any).user?.id;

  const state = await subtopicService.getSubtopicState(subtopicId, citizenId);

  return (res as AppResponse).data({
    subtopicId,
    ...state,
  }, 'Subtopic state retrieved successfully');
});