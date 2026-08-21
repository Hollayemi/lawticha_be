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
const express_1 = require("express");
const adminAuth_1 = require("../../middleware/adminAuth");
const learnController = __importStar(require("../../controllers/learn.controller"));
const module_controller_1 = require("../../controllers/module.controller");
const router = (0, express_1.Router)();
// All module admin routes require a valid admin token
router.use(adminAuth_1.protectAdmin);
// GET    /admin/modules           - list with filters + pagination
// POST   /admin/modules           - create new module
router.route("/").get(module_controller_1.listModulesHandler).post(module_controller_1.createModuleHandler);
router.post('/material', learnController.generateMaterialSummary);
// GET    /admin/modules/stats     - aggregate counts for stats bar
router.get("/stats", module_controller_1.getModuleStatsHandler);
// GET    /admin/modules/daily-stats - today's activity strip numbers
router.get("/daily-stats", module_controller_1.getDailyStatsHandler);
// GET    /admin/modules/:id       - full module by ID
// PATCH  /admin/modules/:id       - update module
// DELETE /admin/modules/:id       - delete module
router
    .route("/:id")
    .get(module_controller_1.getModuleHandler)
    .patch(module_controller_1.updateModuleHandler)
    .delete(module_controller_1.deleteModuleHandler);
// GET    /admin/modules/:moduleId/topics           - list topics
// POST   /admin/modules/:moduleId/topics           - create topic
router
    .route("/:moduleId/topics")
    .get(module_controller_1.listTopicsHandler)
    .post(module_controller_1.createTopicHandler);
// PATCH  /admin/modules/:moduleId/topics/reorder   - reorder topics
router.patch("/:moduleId/topics/reorder", module_controller_1.reorderTopicsHandler);
// GET    /admin/modules/:moduleId/topics/:topicId  - get topic
// PATCH  /admin/modules/:moduleId/topics/:topicId  - update topic
// DELETE /admin/modules/:moduleId/topics/:topicId  - delete topic
router
    .route("/:moduleId/topics/:topicId")
    .get(module_controller_1.getTopicHandler)
    .patch(module_controller_1.updateTopicHandler)
    .delete(module_controller_1.deleteTopicHandler);
// GET    /admin/modules/:moduleId/topics/:topicId/subtopics           - list subtopics
// POST   /admin/modules/:moduleId/topics/:topicId/subtopics           - create subtopic
router
    .route("/:moduleId/topics/:topicId/subtopics")
    .get(module_controller_1.listSubTopicsHandler)
    .post(module_controller_1.createSubTopicHandler);
// PATCH  /admin/modules/:moduleId/topics/:topicId/subtopics/reorder   - reorder subtopics
router.patch("/:moduleId/topics/:topicId/subtopics/reorder", module_controller_1.reorderSubTopicsHandler);
// PATCH  /admin/modules/:moduleId/topics/:topicId/subtopics/:subtopicId/notes - update notes only
router.patch("/:moduleId/topics/:topicId/subtopics/:subtopicId/notes", module_controller_1.updateSubTopicNotesHandler);
// GET (not needed - subtopics come from getTopicById)
// PATCH  /admin/modules/:moduleId/topics/:topicId/subtopics/:subtopicId - update subtopic
// DELETE /admin/modules/:moduleId/topics/:topicId/subtopics/:subtopicId - delete subtopic
router
    .route("/:moduleId/topics/:topicId/subtopics/:subtopicId")
    .patch(module_controller_1.updateSubTopicHandler)
    .delete(module_controller_1.deleteSubTopicHandler);
// GET /admin/modules/:moduleId/activity - recent activity feed
router.get("/:moduleId/activity", module_controller_1.getModuleActivityHandler);
// GET /admin/modules/:moduleId/analytics - module analytics
router.get("/:moduleId/analytics", module_controller_1.getModuleAnalyticsHandler);
// GET /admin/modules/:moduleId/topics/:topicId/analytics - topic analytics
router.get("/:moduleId/topics/:topicId/analytics", module_controller_1.getTopicAnalyticsHandler);
// ═══════════════════════════════════════════════════════════════════════════
//  LEARNER ROUTES
// ═══════════════════════════════════════════════════════════════════════════
// GET /admin/modules/:moduleId/learners     - paginated learners list
// GET /admin/modules/:moduleId/learners/top - top learners by progress
router.get("/:moduleId/learners", module_controller_1.getModuleLearnersHandler);
router.get("/:moduleId/learners/top", module_controller_1.getTopLearnersHandler);
// ═══════════════════════════════════════════════════════════════════════════
//  COMMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════
// GET    /admin/modules/:moduleId/topics/:topicId/comments - list comments
router.get("/:moduleId/topics/:topicId/comments", module_controller_1.getCommentsHandler);
// PATCH  /admin/modules/:moduleId/topics/:topicId/comments/:commentId/resolve - resolve/unresolve
router.patch("/:moduleId/topics/:topicId/comments/:commentId/resolve", module_controller_1.resolveCommentHandler);
// DELETE /admin/modules/:moduleId/topics/:topicId/comments/:commentId - delete comment
router.delete("/:moduleId/topics/:topicId/comments/:commentId", module_controller_1.deleteCommentHandler);
exports.default = router;
//# sourceMappingURL=module.admin.routes.js.map