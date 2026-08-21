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
exports.getSubtopicState = exports.toggleCompleteSubtopic = exports.toggleLikeSubtopic = exports.deleteBookmark = exports.updateBookmark = exports.getBookmarkById = exports.listMyBookmarks = exports.listBookmarksForSubtopic = exports.createBookmark = exports.saveVideoProgress = exports.markTopicComplete = exports.enrolInModule = exports.toggleSaveModule = exports.getFeaturedTopics = exports.getContinueReading = exports.getLearnTopicBySlug = exports.getLearnModuleBySlug = exports.generateMaterialSummary = exports.getFullMaterial = exports.listLearnModules = void 0;
const learnService = __importStar(require("../services/learn.service"));
const subtopicService = __importStar(require("../services/subtopic.service"));
const error_1 = require("../middleware/error");
// GET /learn/modules
exports.listLearnModules = (0, error_1.asyncHandler)(async (req, res) => {
    const { tab, search, category, page = 1, pageSize = 20, } = req.query;
    const citizenId = req.user?.id;
    const result = await learnService.listLearnModules({
        tab: tab,
        search: search,
        category: category,
        page: Number(page),
        pageSize: Number(pageSize),
        citizenId,
    });
    return res.data({
        data: result.data,
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
    }, "Modules retrieved successfully.");
});
// GET /learn/material/:slug
exports.getFullMaterial = (0, error_1.asyncHandler)(async (req, res) => {
    const { slug = "" } = req.params;
    const result = await learnService.getFullMaterialByModuleSlug(slug);
    return res.data({
        data: result,
    }, "Material retrieved successfully.");
});
// POST /learn/material/:slug
exports.generateMaterialSummary = (0, error_1.asyncHandler)(async (req, res) => {
    if (!req.body.slug) {
        throw new error_1.AppError('Module Slug is required', 401, 'INVALID');
    }
    const result = await learnService.generateAndSaveSummary(req.body.slug, req.body.max_words);
    return res.data({
        data: result,
    }, "Material generated successfully.");
});
// GET /learn/modules/:slug
exports.getLearnModuleBySlug = (0, error_1.asyncHandler)(async (req, res) => {
    const { slug } = req.params;
    const citizenId = req.user?.id;
    const moduleDetail = await learnService.getLearnModuleBySlug(slug, citizenId);
    return res.data(moduleDetail, "Module retrieved successfully.");
});
// GET /learn/modules/:moduleSlug/topics/:topicSlug
exports.getLearnTopicBySlug = (0, error_1.asyncHandler)(async (req, res) => {
    const { moduleSlug, topicSlug } = req.params;
    const citizenId = req.user?.id;
    const topicDetail = await learnService.getLearnTopicBySlug(moduleSlug, topicSlug, citizenId);
    return res.data(topicDetail, "Topic retrieved successfully.");
});
// GET /learn/continue-reading
exports.getContinueReading = (0, error_1.asyncHandler)(async (req, res) => {
    const citizenId = req.user?.id;
    if (!citizenId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const continueReading = await learnService.getContinueReading(citizenId);
    return res.data(continueReading, "Continue reading items retrieved successfully.");
});
// GET /learn/featured-topics
exports.getFeaturedTopics = (0, error_1.asyncHandler)(async (req, res) => {
    const featuredTopics = await learnService.getFeaturedTopics();
    return res.data(featuredTopics, "Featured topics retrieved successfully.");
});
// POST /learn/modules/:moduleId/save
exports.toggleSaveModule = (0, error_1.asyncHandler)(async (req, res) => {
    const { moduleId } = req.params;
    const citizenId = req.user?.id;
    if (!citizenId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const result = await learnService.toggleSaveModule(moduleId, citizenId);
    return res.data(result, result.saved ? 'Module saved successfully' : 'Module unsaved successfully');
});
// POST /learn/modules/:moduleId/enrol
exports.enrolInModule = (0, error_1.asyncHandler)(async (req, res) => {
    const { moduleId } = req.params;
    const citizenId = req.user?.id;
    if (!citizenId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const result = await learnService.enrolInModule(moduleId, citizenId);
    return res.data(result, 'Successfully enrolled in module');
});
// POST /learn/modules/:moduleId/topics/:topicId/complete
exports.markTopicComplete = (0, error_1.asyncHandler)(async (req, res) => {
    const { moduleId, topicId } = req.params;
    const citizenId = req.user?.id;
    if (!citizenId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const result = await learnService.markTopicComplete(moduleId, topicId, citizenId);
    return res.data(result, 'Topic marked as complete');
});
// PATCH /learn/modules/:moduleId/topics/:topicId/progress
exports.saveVideoProgress = (0, error_1.asyncHandler)(async (req, res) => {
    const { moduleId, topicId } = req.params;
    const { currentTimeSeconds } = req.body;
    const citizenId = req.user?.id;
    if (!citizenId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    if (typeof currentTimeSeconds !== 'number') {
        throw new error_1.AppError('currentTimeSeconds is required and must be a number', 400, 'INVALID_INPUT');
    }
    const result = await learnService.saveVideoProgress(moduleId, topicId, citizenId, currentTimeSeconds);
    return res.data(result, 'Video progress saved successfully');
});
// ============================================
// BOOKMARK CONTROLLERS
// ============================================
/**
 * POST /learn/subtopics/:subtopicId/bookmarks
 * Create a new bookmark for a subtopic
 */
exports.createBookmark = (0, error_1.asyncHandler)(async (req, res) => {
    const { subtopicId } = req.params;
    const { highlightedText, comment, startOffset, endOffset, url } = req.body;
    const citizenId = req.user?.id;
    if (!citizenId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    if (!highlightedText) {
        throw new error_1.AppError('highlightedText is required', 400, 'VALIDATION_ERROR');
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
    return res.data(bookmark, 'Bookmark created successfully', 201);
});
/**
 * GET /learn/subtopics/:subtopicId/bookmarks
 * Get all bookmarks for a subtopic
 */
exports.listBookmarksForSubtopic = (0, error_1.asyncHandler)(async (req, res) => {
    const { subtopicId } = req.params;
    const citizenId = req.user?.id;
    if (!citizenId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const bookmarks = await subtopicService.listBookmarksForSubtopic(subtopicId, citizenId);
    return res.data(bookmarks, 'Bookmarks retrieved successfully');
});
/**
 * GET /learn/bookmarks
 * Get all bookmarks for the authenticated user with pagination
 */
exports.listMyBookmarks = (0, error_1.asyncHandler)(async (req, res) => {
    const citizenId = req.user?.id;
    const { moduleId, topicId, page = 1, pageSize = 20 } = req.query;
    if (!citizenId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const result = await subtopicService.listMyBookmarks({
        citizenId,
        moduleId: moduleId,
        topicId: topicId,
        page: Number(page),
        pageSize: Number(pageSize),
    });
    return res.data({
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
exports.getBookmarkById = (0, error_1.asyncHandler)(async (req, res) => {
    const { bookmarkId } = req.params;
    const citizenId = req.user?.id;
    if (!citizenId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const bookmark = await subtopicService.getBookmarkById(bookmarkId, citizenId);
    return res.data(bookmark, 'Bookmark retrieved successfully');
});
/**
 * PUT /learn/bookmarks/:bookmarkId
 * Update a bookmark
 */
exports.updateBookmark = (0, error_1.asyncHandler)(async (req, res) => {
    const { bookmarkId } = req.params;
    const { highlightedText, comment, startOffset, endOffset } = req.body;
    const citizenId = req.user?.id;
    if (!citizenId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const bookmark = await subtopicService.updateBookmark(bookmarkId, citizenId, {
        highlightedText,
        comment,
        startOffset,
        endOffset,
    });
    return res.data(bookmark, 'Bookmark updated successfully');
});
/**
 * DELETE /learn/bookmarks/:bookmarkId
 * Delete a bookmark
 */
exports.deleteBookmark = (0, error_1.asyncHandler)(async (req, res) => {
    const { bookmarkId } = req.params;
    const citizenId = req.user?.id;
    if (!citizenId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    await subtopicService.deleteBookmark(bookmarkId, citizenId);
    return res.data(null, 'Bookmark deleted successfully');
});
// ============================================
// SUBTOPIC INTERACTION CONTROLLERS
// ============================================
/**
 * POST /learn/subtopics/:subtopicId/like
 * Toggle like on a subtopic
 */
exports.toggleLikeSubtopic = (0, error_1.asyncHandler)(async (req, res) => {
    const { subtopicId } = req.params;
    const citizenId = req.user?.id;
    if (!citizenId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const result = await subtopicService.toggleLikeSubtopic(subtopicId, citizenId);
    return res.data(result, result.liked ? 'Subtopic liked' : 'Subtopic unliked');
});
/**
 * POST /learn/subtopics/:subtopicId/complete
 * Toggle complete status on a subtopic
 */
exports.toggleCompleteSubtopic = (0, error_1.asyncHandler)(async (req, res) => {
    const { subtopicId } = req.params;
    const citizenId = req.user?.id;
    if (!citizenId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const result = await subtopicService.toggleCompleteSubtopic(subtopicId, citizenId);
    console.log({ result });
    return res.data(result, result.completed ? 'Subtopic marked as complete' : 'Subtopic marked as incomplete');
});
/**
 * GET /learn/subtopics/:subtopicId/state
 * Get the current user's state for a subtopic (liked, completed)
 */
exports.getSubtopicState = (0, error_1.asyncHandler)(async (req, res) => {
    const { subtopicId } = req.params;
    const citizenId = req.user?.id;
    const state = await subtopicService.getSubtopicState(subtopicId, citizenId);
    return res.data({
        subtopicId,
        ...state,
    }, 'Subtopic state retrieved successfully');
});
//# sourceMappingURL=learn.controller.js.map