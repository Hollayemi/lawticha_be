"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCommentHandler = exports.resolveCommentHandler = exports.getCommentsHandler = exports.getTopLearnersHandler = exports.getModuleLearnersHandler = exports.getTopicAnalyticsHandler = exports.getModuleAnalyticsHandler = exports.getModuleActivityHandler = exports.reorderSubTopicsHandler = exports.deleteSubTopicHandler = exports.updateSubTopicNotesHandler = exports.updateSubTopicHandler = exports.createSubTopicHandler = exports.listSubTopicsHandler = exports.reorderTopicsHandler = exports.deleteTopicHandler = exports.updateTopicHandler = exports.createTopicHandler = exports.getTopicHandler = exports.listTopicsHandler = exports.deleteModuleHandler = exports.updateModuleHandler = exports.createModuleHandler = exports.getModuleHandler = exports.getDailyStatsHandler = exports.getModuleStatsHandler = exports.listModulesHandler = void 0;
const error_1 = require("../middleware/error");
const module_service_1 = require("../services/module.service");
function adminCtx(req) {
    return { adminId: req.admin.id, adminName: req.admin.name };
}
/**
 * GET /admin/modules
 * List all modules with optional filtering, search, and pagination.
 */
exports.listModulesHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { status, category, search, page, pageSize, sortBy, sortOrder, } = req.query;
    const filters = {
        status: status,
        category: category,
        search,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        sortBy,
        sortOrder: sortOrder,
    };
    const result = await (0, module_service_1.listModules)(filters);
    return res.data(result, "Modules fetched successfully.");
});
/**
 * GET /admin/modules/stats
 * Aggregate counts for the stats bar.
 */
exports.getModuleStatsHandler = (0, error_1.asyncHandler)(async (_req, res, _next) => {
    const stats = await (0, module_service_1.getModuleStats)();
    return res.data(stats, "Stats fetched successfully.");
});
/**
 * GET /admin/modules/daily-stats
 * Today's activity strip numbers.
 */
exports.getDailyStatsHandler = (0, error_1.asyncHandler)(async (_req, res, _next) => {
    const stats = await (0, module_service_1.getDailyStats)();
    return res.data(stats, "Daily stats fetched successfully.");
});
/**
 * GET /admin/modules/:id
 * Fetch a single module by ID.
 */
exports.getModuleHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const module = await (0, module_service_1.getModuleById)(req.params.id);
    return res.data(module, "Module fetched successfully.");
});
/**
 * POST /admin/modules
 * Create a new module.
 */
exports.createModuleHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { title, category, description, instructorId, thumbnailUrl, thumbnailFile, status } = req.body;
    if (!title?.trim()) {
        return next(new error_1.AppError("Title is required.", 400, "VALIDATION_ERROR"));
    }
    if (!category?.trim()) {
        return next(new error_1.AppError("Category is required.", 400, "VALIDATION_ERROR"));
    }
    if (!description?.trim()) {
        return next(new error_1.AppError("Description is required.", 400, "VALIDATION_ERROR"));
    }
    if (!instructorId?.trim()) {
        return next(new error_1.AppError("Instructor ID is required.", 400, "VALIDATION_ERROR"));
    }
    const input = {
        title,
        category,
        description,
        instructorId,
        thumbnailUrl,
        thumbnailFile,
        status,
    };
    const module = await (0, module_service_1.createModule)(input);
    return res.data({ module }, "Module created successfully.", 201);
});
/**
 * PATCH /admin/modules/:id
 * Partially update a module.
 */
exports.updateModuleHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { title, category, description, instructorId, thumbnailUrl, status, trending } = req.body;
    const input = {
        title,
        category,
        description,
        instructorId,
        thumbnailUrl,
        status,
        trending,
    };
    const module = await (0, module_service_1.updateModule)(req.params.id, input);
    return res.data({ module }, "Module updated successfully.");
});
/**
 * DELETE /admin/modules/:id
 * Permanently delete a module.
 */
exports.deleteModuleHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    await (0, module_service_1.deleteModule)(req.params.id);
    return res.success("Module deleted successfully.");
});
/**
 * GET /admin/modules/:moduleId/topics
 * List all topics for a module.
 */
exports.listTopicsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const topics = await (0, module_service_1.listTopics)(req.params.moduleId, req.query?.status || "");
    return res.data(topics, "Topics fetched successfully.");
});
/**
 * GET /admin/modules/:moduleId/topics/:topicId
 * Fetch a single topic including its subtopics.
 */
exports.getTopicHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { moduleId, topicId } = req.params;
    const topic = await (0, module_service_1.getTopicById)(moduleId, topicId);
    return res.data(topic, "Topic fetched successfully.");
});
/**
 * POST /admin/modules/:moduleId/topics
 * Create a new topic within a module.
 */
exports.createTopicHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { moduleId } = req.params;
    const { title, classification, overview, status, order, videoType, videoUrl, thumbnailUrl, tags, } = req.body;
    if (!title?.trim()) {
        return next(new error_1.AppError("Title is required.", 400, "VALIDATION_ERROR"));
    }
    if (!classification?.trim()) {
        return next(new error_1.AppError("Classification is required.", 400, "VALIDATION_ERROR"));
    }
    if (!overview?.trim()) {
        return next(new error_1.AppError("Overview is required.", 400, "VALIDATION_ERROR"));
    }
    const input = {
        moduleId,
        title,
        classification,
        overview,
        status,
        order,
        videoType,
        videoUrl,
        thumbnailUrl,
        tags,
    };
    const topic = await (0, module_service_1.createTopic)(input);
    return res.data({ topic }, "Topic created successfully.", 201);
});
/**
 * PATCH /admin/modules/:moduleId/topics/:topicId
 * Update a topic.
 */
exports.updateTopicHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { moduleId, topicId } = req.params;
    const { title, classification, overview, status, order, videoType, videoUrl, thumbnailUrl, tags, } = req.body;
    const input = {
        title,
        classification,
        overview,
        status,
        order,
        videoType,
        videoUrl,
        thumbnailUrl,
        tags,
    };
    const topic = await (0, module_service_1.updateTopic)(moduleId, topicId, input);
    return res.data({ topic }, "Topic updated successfully.");
});
/**
 * DELETE /admin/modules/:moduleId/topics/:topicId
 * Delete a topic and all its subtopics.
 */
exports.deleteTopicHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { moduleId, topicId } = req.params;
    await (0, module_service_1.deleteTopic)(moduleId, topicId);
    return res.success("Topic deleted successfully.");
});
/**
 * PATCH /admin/modules/:moduleId/topics/reorder
 * Reorder topics by providing the full ordered array of topic IDs.
 */
exports.reorderTopicsHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { moduleId } = req.params;
    const { orderedIds } = req.body;
    if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
        return next(new error_1.AppError("orderedIds array is required and must not be empty.", 400, "VALIDATION_ERROR"));
    }
    await (0, module_service_1.reorderTopics)(moduleId, orderedIds);
    return res.success("Topics reordered successfully.");
});
// ═══════════════════════════════════════════════════════════════════════════
//  SUBTOPIC HANDLERS
// ═══════════════════════════════════════════════════════════════════════════
/**
 * GET /admin/modules/:moduleId/topics/:topicId/subtopics
 * List all subtopics for a topic.
 */
exports.listSubTopicsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { moduleId, topicId } = req.params;
    const subtopics = await (0, module_service_1.listSubTopics)(moduleId, topicId);
    return res.data(subtopics, "Subtopics fetched successfully.");
});
/**
 * POST /admin/modules/:moduleId/topics/:topicId/subtopics
 * Create a new subtopic.
 */
exports.createSubTopicHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { moduleId, topicId } = req.params;
    const { title, notes, duration, order } = req.body;
    if (!title?.trim()) {
        return next(new error_1.AppError("Title is required.", 400, "VALIDATION_ERROR"));
    }
    const input = {
        moduleId,
        topicId,
        title,
        notes,
        duration,
        order,
    };
    const subtopic = await (0, module_service_1.createSubTopic)(input);
    return res.data({ subtopic }, "SubTopic created successfully.", 201);
});
/**
 * PATCH /admin/modules/:moduleId/topics/:topicId/subtopics/:subtopicId
 * Update a subtopic.
 */
exports.updateSubTopicHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { moduleId, topicId, subtopicId } = req.params;
    const { title, notes, duration, order } = req.body;
    const input = {
        title,
        notes,
        duration,
        order,
    };
    const subtopic = await (0, module_service_1.updateSubTopic)(moduleId, topicId, subtopicId, input);
    return res.data({ subtopic }, "SubTopic updated successfully.");
});
/**
 * PATCH /admin/modules/:moduleId/topics/:topicId/subtopics/:subtopicId/notes
 * Dedicated notes-only update endpoint.
 */
exports.updateSubTopicNotesHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { moduleId, topicId, subtopicId } = req.params;
    const { notes } = req.body;
    if (notes === undefined) {
        return next(new error_1.AppError("notes field is required.", 400, "VALIDATION_ERROR"));
    }
    const result = await (0, module_service_1.updateSubTopicNotes)(moduleId, topicId, subtopicId, notes);
    return res.data(result, "Notes updated successfully.");
});
/**
 * DELETE /admin/modules/:moduleId/topics/:topicId/subtopics/:subtopicId
 * Delete a subtopic.
 */
exports.deleteSubTopicHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { moduleId, topicId, subtopicId } = req.params;
    await (0, module_service_1.deleteSubTopic)(moduleId, topicId, subtopicId);
    return res.success("SubTopic deleted successfully.");
});
/**
 * PATCH /admin/modules/:moduleId/topics/:topicId/subtopics/reorder
 * Reorder subtopics by providing the full ordered ID array.
 */
exports.reorderSubTopicsHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { moduleId, topicId } = req.params;
    const { orderedIds } = req.body;
    if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
        return next(new error_1.AppError("orderedIds array is required and must not be empty.", 400, "VALIDATION_ERROR"));
    }
    await (0, module_service_1.reorderSubTopics)(moduleId, topicId, orderedIds);
    return res.success("SubTopics reordered successfully.");
});
/**
 * GET /admin/modules/:moduleId/activity
 * Recent activity feed for a module.
 */
exports.getModuleActivityHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { moduleId } = req.params;
    const { limit, before } = req.query;
    const activities = await (0, module_service_1.getModuleActivity)(moduleId, limit ? Number(limit) : 20, before);
    return res.data(activities, "Activity fetched successfully.");
});
/**
 * GET /admin/modules/:moduleId/analytics
 * Full module analytics.
 */
exports.getModuleAnalyticsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { moduleId } = req.params;
    const analytics = await (0, module_service_1.getModuleAnalytics)(moduleId);
    return res.data(analytics, "Analytics fetched successfully.");
});
/**
 * GET /admin/modules/:moduleId/topics/:topicId/analytics
 * Full topic analytics.
 */
exports.getTopicAnalyticsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { moduleId, topicId } = req.params;
    const analytics = await (0, module_service_1.getTopicAnalytics)(moduleId, topicId);
    return res.data(analytics, "Analytics fetched successfully.");
});
// ═══════════════════════════════════════════════════════════════════════════
//  LEARNER HANDLERS
// ═══════════════════════════════════════════════════════════════════════════
/**
 * GET /admin/modules/:moduleId/learners
 * Paginated list of enrolled learners.
 */
exports.getModuleLearnersHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { moduleId } = req.params;
    const { page, pageSize, search, sortBy, sortOrder } = req.query;
    const params = {
        moduleId,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        search: search,
        sortBy: sortBy,
        sortOrder: sortOrder,
    };
    const result = await (0, module_service_1.getModuleLearners)(params);
    return res.data(result, "Learners fetched successfully.");
});
/**
 * GET /admin/modules/:moduleId/learners/top
 * Top N learners by progress percentage.
 */
exports.getTopLearnersHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { moduleId } = req.params;
    const { limit } = req.query;
    const learners = await (0, module_service_1.getTopLearners)(moduleId, limit ? Number(limit) : 5);
    return res.data(learners, "Top learners fetched successfully.");
});
// ═══════════════════════════════════════════════════════════════════════════
//  COMMENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════
/**
 * GET /admin/modules/:moduleId/topics/:topicId/comments
 * Fetch all comments for a topic.
 */
exports.getCommentsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { moduleId, topicId } = req.params;
    const { resolved } = req.query;
    const params = {
        moduleId,
        topicId,
        resolved: resolved !== undefined ? resolved === "true" : undefined,
    };
    const comments = await (0, module_service_1.getComments)(params.moduleId, params.topicId, params.resolved);
    return res.data(comments, "Comments fetched successfully.");
});
/**
 * PATCH /admin/modules/:moduleId/topics/:topicId/comments/:commentId/resolve
 * Toggle a comment's resolved status.
 */
exports.resolveCommentHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { moduleId, topicId, commentId } = req.params;
    const { resolved } = req.body;
    if (typeof resolved !== "boolean") {
        return next(new error_1.AppError("resolved must be a boolean.", 400, "VALIDATION_ERROR"));
    }
    const comment = await (0, module_service_1.resolveComment)(moduleId, topicId, commentId, resolved, adminCtx(req).adminName);
    return res.data({ comment }, `Comment ${resolved ? "resolved" : "reopened"} successfully.`);
});
/**
 * DELETE /admin/modules/:moduleId/topics/:topicId/comments/:commentId
 * Permanently delete a comment.
 */
exports.deleteCommentHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { moduleId, topicId, commentId } = req.params;
    await (0, module_service_1.deleteComment)(moduleId, topicId, commentId);
    return res.success("Comment deleted successfully.");
});
//# sourceMappingURL=module.controller.js.map