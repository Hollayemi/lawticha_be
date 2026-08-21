import { Request, Response, NextFunction } from "express";
/**
 * GET /admin/modules
 * List all modules with optional filtering, search, and pagination.
 */
export declare const listModulesHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /admin/modules/stats
 * Aggregate counts for the stats bar.
 */
export declare const getModuleStatsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /admin/modules/daily-stats
 * Today's activity strip numbers.
 */
export declare const getDailyStatsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /admin/modules/:id
 * Fetch a single module by ID.
 */
export declare const getModuleHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * POST /admin/modules
 * Create a new module.
 */
export declare const createModuleHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * PATCH /admin/modules/:id
 * Partially update a module.
 */
export declare const updateModuleHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * DELETE /admin/modules/:id
 * Permanently delete a module.
 */
export declare const deleteModuleHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /admin/modules/:moduleId/topics
 * List all topics for a module.
 */
export declare const listTopicsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /admin/modules/:moduleId/topics/:topicId
 * Fetch a single topic including its subtopics.
 */
export declare const getTopicHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * POST /admin/modules/:moduleId/topics
 * Create a new topic within a module.
 */
export declare const createTopicHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * PATCH /admin/modules/:moduleId/topics/:topicId
 * Update a topic.
 */
export declare const updateTopicHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * DELETE /admin/modules/:moduleId/topics/:topicId
 * Delete a topic and all its subtopics.
 */
export declare const deleteTopicHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * PATCH /admin/modules/:moduleId/topics/reorder
 * Reorder topics by providing the full ordered array of topic IDs.
 */
export declare const reorderTopicsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /admin/modules/:moduleId/topics/:topicId/subtopics
 * List all subtopics for a topic.
 */
export declare const listSubTopicsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * POST /admin/modules/:moduleId/topics/:topicId/subtopics
 * Create a new subtopic.
 */
export declare const createSubTopicHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * PATCH /admin/modules/:moduleId/topics/:topicId/subtopics/:subtopicId
 * Update a subtopic.
 */
export declare const updateSubTopicHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * PATCH /admin/modules/:moduleId/topics/:topicId/subtopics/:subtopicId/notes
 * Dedicated notes-only update endpoint.
 */
export declare const updateSubTopicNotesHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * DELETE /admin/modules/:moduleId/topics/:topicId/subtopics/:subtopicId
 * Delete a subtopic.
 */
export declare const deleteSubTopicHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * PATCH /admin/modules/:moduleId/topics/:topicId/subtopics/reorder
 * Reorder subtopics by providing the full ordered ID array.
 */
export declare const reorderSubTopicsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /admin/modules/:moduleId/activity
 * Recent activity feed for a module.
 */
export declare const getModuleActivityHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /admin/modules/:moduleId/analytics
 * Full module analytics.
 */
export declare const getModuleAnalyticsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /admin/modules/:moduleId/topics/:topicId/analytics
 * Full topic analytics.
 */
export declare const getTopicAnalyticsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /admin/modules/:moduleId/learners
 * Paginated list of enrolled learners.
 */
export declare const getModuleLearnersHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /admin/modules/:moduleId/learners/top
 * Top N learners by progress percentage.
 */
export declare const getTopLearnersHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /admin/modules/:moduleId/topics/:topicId/comments
 * Fetch all comments for a topic.
 */
export declare const getCommentsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * PATCH /admin/modules/:moduleId/topics/:topicId/comments/:commentId/resolve
 * Toggle a comment's resolved status.
 */
export declare const resolveCommentHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * DELETE /admin/modules/:moduleId/topics/:topicId/comments/:commentId
 * Permanently delete a comment.
 */
export declare const deleteCommentHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
//# sourceMappingURL=module.controller.d.ts.map