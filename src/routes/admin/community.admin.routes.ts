// routes/community.admin.routes.ts
import { Router } from 'express';
import { protectAdmin } from '../../middleware/adminAuth';
import {
  // Post moderation
  listAllPostsHandler,
  getPostDetailsHandler,
  approvePostHandler,
  rejectPostHandler,
  pinPostHandler,
  promotePostHandler,
  demotePostHandler,
  
  // Comment moderation
  listCommentsHandler,
  removeCommentHandler,
  restoreCommentHandler,
  
  // Reports management
  listReportsHandler,
  resolveReportHandler,
  
  // Analytics
  getCommunityStatsHandler,
  getActivityReportHandler,
  
  // Bulk actions
  bulkModeratePostsHandler,
} from '../../controllers/community.admin.controller';

const router = Router();

// All routes require admin authentication
router.use(protectAdmin);

// ──────────────────────────────────────────────────────────────────
// Posts
// ──────────────────────────────────────────────────────────────────

// GET /admin/community/posts - list all posts with filters
router.get('/posts', listAllPostsHandler);

// GET /admin/community/posts/:postId - get full post details with reports
router.get('/posts/:postId', getPostDetailsHandler);

// POST /admin/community/posts/:postId/approve - approve pending post
router.post('/posts/:postId/approve', approvePostHandler);

// POST /admin/community/posts/:postId/reject - reject post with reason
router.post('/posts/:postId/reject', rejectPostHandler);

// POST /admin/community/posts/:postId/pin - pin/unpin post
router.post('/posts/:postId/pin', pinPostHandler);

// POST /admin/community/posts/:postId/promote - promote/demote post
router.post('/posts/:postId/promote', promotePostHandler);

// POST /admin/community/posts/:postId/demote - remove promotion
router.post('/posts/:postId/demote', demotePostHandler);

// ──────────────────────────────────────────────────────────────────
// Comments
// ──────────────────────────────────────────────────────────────────

// GET /admin/community/comments - list all comments with filters
router.get('/comments', listCommentsHandler);

// DELETE /admin/community/comments/:commentId - remove comment
router.delete('/comments/:commentId', removeCommentHandler);

// POST /admin/community/comments/:commentId/restore - restore removed comment
router.post('/comments/:commentId/restore', restoreCommentHandler);

// ──────────────────────────────────────────────────────────────────
// Reports
// ──────────────────────────────────────────────────────────────────

// GET /admin/community/reports - list all reports
router.get('/reports', listReportsHandler);

// POST /admin/community/reports/:reportId/resolve - resolve a report
router.post('/reports/:reportId/resolve', resolveReportHandler);

// ──────────────────────────────────────────────────────────────────
// Analytics & Stats
// ──────────────────────────────────────────────────────────────────

// GET /admin/community/stats - community statistics
router.get('/stats', getCommunityStatsHandler);

// GET /admin/community/activity - activity report
router.get('/activity', getActivityReportHandler);

// ──────────────────────────────────────────────────────────────────
// Bulk Actions
// ──────────────────────────────────────────────────────────────────

// POST /admin/community/bulk/moderate - bulk moderate posts
router.post('/bulk/moderate', bulkModeratePostsHandler);

export default router;