import { Router } from "express";
import { protectAdmin } from "../../middleware/adminAuth";
import {
  // Module handlers
  listModulesHandler,
  getModuleStatsHandler,
  getDailyStatsHandler,
  getModuleHandler,
  createModuleHandler,
  updateModuleHandler,
  deleteModuleHandler,
  // Topic handlers
  listTopicsHandler,
  getTopicHandler,
  createTopicHandler,
  updateTopicHandler,
  deleteTopicHandler,
  reorderTopicsHandler,
  // SubTopic handlers
  listSubTopicsHandler,
  createSubTopicHandler,
  updateSubTopicHandler,
  updateSubTopicNotesHandler,
  deleteSubTopicHandler,
  reorderSubTopicsHandler,
  // Activity handlers
  getModuleActivityHandler,
  // Analytics handlers
  getModuleAnalyticsHandler,
  getTopicAnalyticsHandler,
  // Learner handlers
  getModuleLearnersHandler,
  getTopLearnersHandler,
  // Comment handlers
  getCommentsHandler,
  resolveCommentHandler,
  deleteCommentHandler,
} from "../../controllers/module.controller";

const router = Router();

// All module admin routes require a valid admin token
router.use(protectAdmin);


// GET    /admin/modules           - list with filters + pagination
// POST   /admin/modules           - create new module
router.route("/").get(listModulesHandler).post(createModuleHandler);

// GET    /admin/modules/stats     - aggregate counts for stats bar
router.get("/stats", getModuleStatsHandler);

// GET    /admin/modules/daily-stats - today's activity strip numbers
router.get("/daily-stats", getDailyStatsHandler);

// GET    /admin/modules/:id       - full module by ID
// PATCH  /admin/modules/:id       - update module
// DELETE /admin/modules/:id       - delete module
router
  .route("/:id")
  .get(getModuleHandler)
  .patch(updateModuleHandler)
  .delete(deleteModuleHandler);

// GET    /admin/modules/:moduleId/topics           - list topics
// POST   /admin/modules/:moduleId/topics           - create topic
router
  .route("/:moduleId/topics")
  .get(listTopicsHandler)
  .post(createTopicHandler);

// PATCH  /admin/modules/:moduleId/topics/reorder   - reorder topics
router.patch("/:moduleId/topics/reorder", reorderTopicsHandler);

// GET    /admin/modules/:moduleId/topics/:topicId  - get topic
// PATCH  /admin/modules/:moduleId/topics/:topicId  - update topic
// DELETE /admin/modules/:moduleId/topics/:topicId  - delete topic
router
  .route("/:moduleId/topics/:topicId")
  .get(getTopicHandler)
  .patch(updateTopicHandler)
  .delete(deleteTopicHandler);

// GET    /admin/modules/:moduleId/topics/:topicId/subtopics           - list subtopics
// POST   /admin/modules/:moduleId/topics/:topicId/subtopics           - create subtopic
router
  .route("/:moduleId/topics/:topicId/subtopics")
  .get(listSubTopicsHandler)
  .post(createSubTopicHandler);

// PATCH  /admin/modules/:moduleId/topics/:topicId/subtopics/reorder   - reorder subtopics
router.patch("/:moduleId/topics/:topicId/subtopics/reorder", reorderSubTopicsHandler);

// PATCH  /admin/modules/:moduleId/topics/:topicId/subtopics/:subtopicId/notes - update notes only
router.patch(
  "/:moduleId/topics/:topicId/subtopics/:subtopicId/notes",
  updateSubTopicNotesHandler
);

// GET (not needed - subtopics come from getTopicById)
// PATCH  /admin/modules/:moduleId/topics/:topicId/subtopics/:subtopicId - update subtopic
// DELETE /admin/modules/:moduleId/topics/:topicId/subtopics/:subtopicId - delete subtopic
router
  .route("/:moduleId/topics/:topicId/subtopics/:subtopicId")
  .patch(updateSubTopicHandler)
  .delete(deleteSubTopicHandler);


// GET /admin/modules/:moduleId/activity - recent activity feed
router.get("/:moduleId/activity", getModuleActivityHandler);


// GET /admin/modules/:moduleId/analytics - module analytics
router.get("/:moduleId/analytics", getModuleAnalyticsHandler);

// GET /admin/modules/:moduleId/topics/:topicId/analytics - topic analytics
router.get("/:moduleId/topics/:topicId/analytics", getTopicAnalyticsHandler);

// ═══════════════════════════════════════════════════════════════════════════
//  LEARNER ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// GET /admin/modules/:moduleId/learners     - paginated learners list
// GET /admin/modules/:moduleId/learners/top - top learners by progress
router.get("/:moduleId/learners", getModuleLearnersHandler);
router.get("/:moduleId/learners/top", getTopLearnersHandler);

// ═══════════════════════════════════════════════════════════════════════════
//  COMMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// GET    /admin/modules/:moduleId/topics/:topicId/comments - list comments
router.get("/:moduleId/topics/:topicId/comments", getCommentsHandler);

// PATCH  /admin/modules/:moduleId/topics/:topicId/comments/:commentId/resolve - resolve/unresolve
router.patch(
  "/:moduleId/topics/:topicId/comments/:commentId/resolve",
  resolveCommentHandler
);

// DELETE /admin/modules/:moduleId/topics/:topicId/comments/:commentId - delete comment
router.delete(
  "/:moduleId/topics/:topicId/comments/:commentId",
  deleteCommentHandler
);

export default router;