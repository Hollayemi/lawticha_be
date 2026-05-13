import { Request, Response, NextFunction } from "express";
import { asyncHandler, AppError, AppResponse } from "../middleware/error";
import {
  listModules,
  getModuleStats,
  getDailyStats,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  listTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  reorderTopics,
  listSubTopics,
  createSubTopic,
  updateSubTopic,
  updateSubTopicNotes,
  deleteSubTopic,
  reorderSubTopics,
  getModuleActivity,
  getModuleAnalytics,
  getTopicAnalytics,
  getModuleLearners,
  getTopLearners,
  getComments,
  resolveComment,
  deleteComment,
  type ModuleFilters,
  type CreateModuleInput,
  type UpdateModuleInput,
  type CreateTopicInput,
  type UpdateTopicInput,
  type CreateSubTopicInput,
  type UpdateSubTopicInput,
  type LearnersParams,
  type CommentsParams,
} from "../services/module.service";


function adminCtx(req: Request) {
  return { adminId: req.admin!.id, adminName: req.admin!.name };
}


/**
 * GET /admin/modules
 * List all modules with optional filtering, search, and pagination.
 */
export const listModulesHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const {
      status,
      category,
      search,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = req.query as Record<string, string>;

    const filters: ModuleFilters = {
      status: status as ModuleFilters["status"],
      category: category as ModuleFilters["category"],
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
    };

    const result = await listModules(filters);
    return (res as AppResponse).data(result, "Modules fetched successfully.");
  }
);

/**
 * GET /admin/modules/stats
 * Aggregate counts for the stats bar.
 */
export const getModuleStatsHandler = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await getModuleStats();
    return (res as AppResponse).data(stats, "Stats fetched successfully.");
  }
);

/**
 * GET /admin/modules/daily-stats
 * Today's activity strip numbers.
 */
export const getDailyStatsHandler = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await getDailyStats();
    return (res as AppResponse).data(stats, "Daily stats fetched successfully.");
  }
);

/**
 * GET /admin/modules/:id
 * Fetch a single module by ID.
 */
export const getModuleHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const module = await getModuleById(req.params.id);
    return (res as AppResponse).data(module, "Module fetched successfully.");
  }
);

/**
 * POST /admin/modules
 * Create a new module.
 */
export const createModuleHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { title, category, description, instructorId, thumbnailUrl, status } =
      req.body;

    if (!title?.trim()) {
      return next(new AppError("Title is required.", 400, "VALIDATION_ERROR"));
    }
    if (!category?.trim()) {
      return next(new AppError("Category is required.", 400, "VALIDATION_ERROR"));
    }
    if (!description?.trim()) {
      return next(new AppError("Description is required.", 400, "VALIDATION_ERROR"));
    }
    if (!instructorId?.trim()) {
      return next(new AppError("Instructor ID is required.", 400, "VALIDATION_ERROR"));
    }

    const input: CreateModuleInput = {
      title,
      category,
      description,
      instructorId,
      thumbnailUrl,
      status,
    };

    const module = await createModule(input);
    return (res as AppResponse).data({ module }, "Module created successfully.", 201);
  }
);

/**
 * PATCH /admin/modules/:id
 * Partially update a module.
 */
export const updateModuleHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { title, category, description, instructorId, thumbnailUrl, status, trending } =
      req.body;

    const input: UpdateModuleInput = {
      title,
      category,
      description,
      instructorId,
      thumbnailUrl,
      status,
      trending,
    };

    const module = await updateModule(req.params.id, input);
    return (res as AppResponse).data({ module }, "Module updated successfully.");
  }
);

/**
 * DELETE /admin/modules/:id
 * Permanently delete a module.
 */
export const deleteModuleHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    await deleteModule(req.params.id);
    return (res as AppResponse).success("Module deleted successfully.");
  }
);

/**
 * GET /admin/modules/:moduleId/topics
 * List all topics for a module.
 */
export const listTopicsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const topics = await listTopics(req.params.moduleId);
    return (res as AppResponse).data(topics, "Topics fetched successfully.");
  }
);

/**
 * GET /admin/modules/:moduleId/topics/:topicId
 * Fetch a single topic including its subtopics.
 */
export const getTopicHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { moduleId, topicId } = req.params;
    const topic = await getTopicById(moduleId, topicId);
    return (res as AppResponse).data(topic, "Topic fetched successfully.");
  }
);

/**
 * POST /admin/modules/:moduleId/topics
 * Create a new topic within a module.
 */
export const createTopicHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { moduleId } = req.params;
    const {
      title,
      classification,
      overview,
      status,
      order,
      videoType,
      videoUrl,
      thumbnailUrl,
      tags,
    } = req.body;

    if (!title?.trim()) {
      return next(new AppError("Title is required.", 400, "VALIDATION_ERROR"));
    }
    if (!classification?.trim()) {
      return next(new AppError("Classification is required.", 400, "VALIDATION_ERROR"));
    }
    if (!overview?.trim()) {
      return next(new AppError("Overview is required.", 400, "VALIDATION_ERROR"));
    }

    const input: CreateTopicInput = {
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

    const topic = await createTopic(input);
    return (res as AppResponse).data({ topic }, "Topic created successfully.", 201);
  }
);

/**
 * PATCH /admin/modules/:moduleId/topics/:topicId
 * Update a topic.
 */
export const updateTopicHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { moduleId, topicId } = req.params;
    const {
      title,
      classification,
      overview,
      status,
      order,
      videoType,
      videoUrl,
      thumbnailUrl,
      tags,
    } = req.body;

    const input: UpdateTopicInput = {
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

    const topic = await updateTopic(moduleId, topicId, input);
    return (res as AppResponse).data({ topic }, "Topic updated successfully.");
  }
);

/**
 * DELETE /admin/modules/:moduleId/topics/:topicId
 * Delete a topic and all its subtopics.
 */
export const deleteTopicHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { moduleId, topicId } = req.params;
    await deleteTopic(moduleId, topicId);
    return (res as AppResponse).success("Topic deleted successfully.");
  }
);

/**
 * PATCH /admin/modules/:moduleId/topics/reorder
 * Reorder topics by providing the full ordered array of topic IDs.
 */
export const reorderTopicsHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { moduleId } = req.params;
    const { orderedIds } = req.body;

    if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
      return next(
        new AppError(
          "orderedIds array is required and must not be empty.",
          400,
          "VALIDATION_ERROR"
        )
      );
    }

    await reorderTopics(moduleId, orderedIds);
    return (res as AppResponse).success("Topics reordered successfully.");
  }
);

// ═══════════════════════════════════════════════════════════════════════════
//  SUBTOPIC HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/modules/:moduleId/topics/:topicId/subtopics
 * List all subtopics for a topic.
 */
export const listSubTopicsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { moduleId, topicId } = req.params;
    const subtopics = await listSubTopics(moduleId, topicId);
    return (res as AppResponse).data(subtopics, "Subtopics fetched successfully.");
  }
);

/**
 * POST /admin/modules/:moduleId/topics/:topicId/subtopics
 * Create a new subtopic.
 */
export const createSubTopicHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { moduleId, topicId } = req.params;
    const { title, notes, duration, order } = req.body;

    if (!title?.trim()) {
      return next(new AppError("Title is required.", 400, "VALIDATION_ERROR"));
    }

    const input: CreateSubTopicInput = {
      moduleId,
      topicId,
      title,
      notes,
      duration,
      order,
    };

    const subtopic = await createSubTopic(input);
    return (res as AppResponse).data({ subtopic }, "SubTopic created successfully.", 201);
  }
);

/**
 * PATCH /admin/modules/:moduleId/topics/:topicId/subtopics/:subtopicId
 * Update a subtopic.
 */
export const updateSubTopicHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { moduleId, topicId, subtopicId } = req.params;
    const { title, notes, duration, order } = req.body;

    const input: UpdateSubTopicInput = {
      title,
      notes,
      duration,
      order,
    };

    const subtopic = await updateSubTopic(moduleId, topicId, subtopicId, input);
    return (res as AppResponse).data({ subtopic }, "SubTopic updated successfully.");
  }
);

/**
 * PATCH /admin/modules/:moduleId/topics/:topicId/subtopics/:subtopicId/notes
 * Dedicated notes-only update endpoint.
 */
export const updateSubTopicNotesHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { moduleId, topicId, subtopicId } = req.params;
    const { notes } = req.body;

    if (notes === undefined) {
      return next(new AppError("notes field is required.", 400, "VALIDATION_ERROR"));
    }

    const result = await updateSubTopicNotes(moduleId, topicId, subtopicId, notes);
    return (res as AppResponse).data(result, "Notes updated successfully.");
  }
);

/**
 * DELETE /admin/modules/:moduleId/topics/:topicId/subtopics/:subtopicId
 * Delete a subtopic.
 */
export const deleteSubTopicHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { moduleId, topicId, subtopicId } = req.params;
    await deleteSubTopic(moduleId, topicId, subtopicId);
    return (res as AppResponse).success("SubTopic deleted successfully.");
  }
);

/**
 * PATCH /admin/modules/:moduleId/topics/:topicId/subtopics/reorder
 * Reorder subtopics by providing the full ordered ID array.
 */
export const reorderSubTopicsHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { moduleId, topicId } = req.params;
    const { orderedIds } = req.body;

    if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
      return next(
        new AppError(
          "orderedIds array is required and must not be empty.",
          400,
          "VALIDATION_ERROR"
        )
      );
    }

    await reorderSubTopics(moduleId, topicId, orderedIds);
    return (res as AppResponse).success("SubTopics reordered successfully.");
  }
);


/**
 * GET /admin/modules/:moduleId/activity
 * Recent activity feed for a module.
 */
export const getModuleActivityHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { moduleId } = req.params;
    const { limit, before } = req.query;

    const activities = await getModuleActivity(
      moduleId,
      limit ? Number(limit) : 20,
      before as string | undefined
    );
    return (res as AppResponse).data(activities, "Activity fetched successfully.");
  }
);


/**
 * GET /admin/modules/:moduleId/analytics
 * Full module analytics.
 */
export const getModuleAnalyticsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { moduleId } = req.params;
    const analytics = await getModuleAnalytics(moduleId);
    return (res as AppResponse).data(analytics, "Analytics fetched successfully.");
  }
);

/**
 * GET /admin/modules/:moduleId/topics/:topicId/analytics
 * Full topic analytics.
 */
export const getTopicAnalyticsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { moduleId, topicId } = req.params;
    const analytics = await getTopicAnalytics(moduleId, topicId);
    return (res as AppResponse).data(analytics, "Analytics fetched successfully.");
  }
);

// ═══════════════════════════════════════════════════════════════════════════
//  LEARNER HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/modules/:moduleId/learners
 * Paginated list of enrolled learners.
 */
export const getModuleLearnersHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { moduleId } = req.params;
    const { page, pageSize, search, sortBy, sortOrder } = req.query;

    const params: LearnersParams = {
      moduleId,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search: search as string | undefined,
      sortBy: sortBy as LearnersParams["sortBy"],
      sortOrder: sortOrder as "asc" | "desc",
    };

    const result = await getModuleLearners(params);
    return (res as AppResponse).data(result, "Learners fetched successfully.");
  }
);

/**
 * GET /admin/modules/:moduleId/learners/top
 * Top N learners by progress percentage.
 */
export const getTopLearnersHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { moduleId } = req.params;
    const { limit } = req.query;

    const learners = await getTopLearners(moduleId, limit ? Number(limit) : 5);
    return (res as AppResponse).data(learners, "Top learners fetched successfully.");
  }
);

// ═══════════════════════════════════════════════════════════════════════════
//  COMMENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/modules/:moduleId/topics/:topicId/comments
 * Fetch all comments for a topic.
 */
export const getCommentsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { moduleId, topicId } = req.params;
    const { resolved } = req.query;

    const params: CommentsParams = {
      moduleId,
      topicId,
      resolved: resolved !== undefined ? resolved === "true" : undefined,
    };

    const comments = await getComments(params.moduleId, params.topicId, params.resolved);
    return (res as AppResponse).data(comments, "Comments fetched successfully.");
  }
);

/**
 * PATCH /admin/modules/:moduleId/topics/:topicId/comments/:commentId/resolve
 * Toggle a comment's resolved status.
 */
export const resolveCommentHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { moduleId, topicId, commentId } = req.params;
    const { resolved } = req.body;

    if (typeof resolved !== "boolean") {
      return next(new AppError("resolved must be a boolean.", 400, "VALIDATION_ERROR"));
    }

    const comment = await resolveComment(
      moduleId,
      topicId,
      commentId,
      resolved,
      adminCtx(req).adminName
    );
    return (res as AppResponse).data(
      { comment },
      `Comment ${resolved ? "resolved" : "reopened"} successfully.`
    );
  }
);

/**
 * DELETE /admin/modules/:moduleId/topics/:topicId/comments/:commentId
 * Permanently delete a comment.
 */
export const deleteCommentHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { moduleId, topicId, commentId } = req.params;
    await deleteComment(moduleId, topicId, commentId);
    return (res as AppResponse).success("Comment deleted successfully.");
  }
);