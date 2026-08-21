"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/community.admin.routes.ts
const express_1 = require("express");
const adminAuth_1 = require("../../middleware/adminAuth");
const community_admin_controller_1 = require("../../controllers/community.admin.controller");
const router = (0, express_1.Router)();
// All routes require admin authentication
router.use(adminAuth_1.protectAdmin);
// ──────────────────────────────────────────────────────────────────
// Posts
// ──────────────────────────────────────────────────────────────────
// GET /admin/community/posts - list all posts with filters
router.get('/posts', community_admin_controller_1.listAllPostsHandler);
// GET /admin/community/posts/:postId - get full post details with reports
router.get('/posts/:postId', community_admin_controller_1.getPostDetailsHandler);
// POST /admin/community/posts/:postId/approve - approve pending post
router.post('/posts/:postId/approve', community_admin_controller_1.approvePostHandler);
// POST /admin/community/posts/:postId/reject - reject post with reason
router.post('/posts/:postId/reject', community_admin_controller_1.rejectPostHandler);
// POST /admin/community/posts/:postId/pin - pin/unpin post
router.post('/posts/:postId/pin', community_admin_controller_1.pinPostHandler);
// POST /admin/community/posts/:postId/promote - promote/demote post
router.post('/posts/:postId/promote', community_admin_controller_1.promotePostHandler);
// POST /admin/community/posts/:postId/demote - remove promotion
router.post('/posts/:postId/demote', community_admin_controller_1.demotePostHandler);
// ──────────────────────────────────────────────────────────────────
// Comments
// ──────────────────────────────────────────────────────────────────
// GET /admin/community/comments - list all comments with filters
router.get('/comments', community_admin_controller_1.listCommentsHandler);
// DELETE /admin/community/comments/:commentId - remove comment
router.delete('/comments/:commentId', community_admin_controller_1.removeCommentHandler);
// POST /admin/community/comments/:commentId/restore - restore removed comment
router.post('/comments/:commentId/restore', community_admin_controller_1.restoreCommentHandler);
// ──────────────────────────────────────────────────────────────────
// Reports
// ──────────────────────────────────────────────────────────────────
// GET /admin/community/reports - list all reports
router.get('/reports', community_admin_controller_1.listReportsHandler);
// POST /admin/community/reports/:reportId/resolve - resolve a report
router.post('/reports/:reportId/resolve', community_admin_controller_1.resolveReportHandler);
// ──────────────────────────────────────────────────────────────────
// Analytics & Stats
// ──────────────────────────────────────────────────────────────────
// GET /admin/community/stats - community statistics
router.get('/stats', community_admin_controller_1.getCommunityStatsHandler);
// GET /admin/community/activity - activity report
router.get('/activity', community_admin_controller_1.getActivityReportHandler);
// ──────────────────────────────────────────────────────────────────
// Bulk Actions
// ──────────────────────────────────────────────────────────────────
// POST /admin/community/bulk/moderate - bulk moderate posts
router.post('/bulk/moderate', community_admin_controller_1.bulkModeratePostsHandler);
exports.default = router;
//# sourceMappingURL=community.admin.routes.js.map