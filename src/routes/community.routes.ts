import { Router } from 'express';
import { optionalAuth, protect } from '../middleware/auth.middleware';
import multer from 'multer';
import * as communityController from '../controllers/community.controller';

const router = Router();
const upload = multer({ dest: 'uploads/community/' });

// ──────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (with optional auth)
// ──────────────────────────────────────────────────────────────────

// Get community rooms
router.get('/rooms', communityController.getRoomsHandler);

// List posts with filters
router.get('/posts', optionalAuth, communityController.listPostsHandler);

// Get posts by reference (module/topic/subtopic)
router.get('/reference/:type/:id', communityController.getPostsByReferenceHandler);

// Get single post
router.get('/posts/:postId', optionalAuth, communityController.getPostHandler);

// ──────────────────────────────────────────────────────────────────
// PROTECTED ROUTES (require authentication)
// ──────────────────────────────────────────────────────────────────

router.use(protect)

// Create a new post
router.post('/posts',  upload.array('images', 5), communityController.createPostHandler);

// Add a comment to a post
router.post('/posts/:postId/comments',  upload.array('images', 3), communityController.createCommentHandler);

// Like/unlike a post
router.post('/posts/:postId/like',  communityController.toggleLikePostHandler);

// Like/unlike a comment
router.post('/posts/:postId/comments/:commentId/like',  communityController.toggleLikeCommentHandler);

// Accept an answer (post owner or admin)
router.post('/posts/:postId/comments/:commentId/accept',  communityController.acceptAnswerHandler);

// Mark post as resolved/unresolved
router.post('/posts/:postId/resolve',  communityController.resolvePostHandler);

// ──────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ──────────────────────────────────────────────────────────────────

// Pin/unpin a post
router.post('/admin/community/posts/:postId/pin',  communityController.pinPostHandler);

// Lock/unlock a post
router.post('/admin/community/posts/:postId/lock',  communityController.lockPostHandler);

// Delete a post
router.delete('/admin/community/posts/:postId',  communityController.deletePostHandler);

// Delete a comment
router.delete('/admin/community/comments/:commentId',  communityController.deleteCommentHandler);

export default router;