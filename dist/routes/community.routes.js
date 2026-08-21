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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const communityController = __importStar(require("../controllers/community.controller"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: 'uploads/community/' });
// ──────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (with optional auth)
// ──────────────────────────────────────────────────────────────────
// Get community rooms
router.get('/rooms', communityController.getRoomsHandler);
// List posts with filters
router.get('/posts', auth_middleware_1.optionalAuth, communityController.listPostsHandler);
// Get posts by reference (module/topic/subtopic)
router.get('/reference/:type/:id', communityController.getPostsByReferenceHandler);
// Get single post
router.get('/posts/:postId', auth_middleware_1.optionalAuth, communityController.getPostHandler);
// ──────────────────────────────────────────────────────────────────
// PROTECTED ROUTES (require authentication)
// ──────────────────────────────────────────────────────────────────
router.use(auth_middleware_1.protect);
// Create a new post
router.post('/posts', upload.array('images', 5), communityController.createPostHandler);
// Add a comment to a post
router.post('/posts/:postId/comments', upload.array('images', 3), communityController.createCommentHandler);
// Like/unlike a post
router.post('/posts/:postId/like', communityController.toggleLikePostHandler);
// Like/unlike a comment
router.post('/posts/:postId/comments/:commentId/like', communityController.toggleLikeCommentHandler);
// Accept an answer (post owner or admin)
router.post('/posts/:postId/comments/:commentId/accept', communityController.acceptAnswerHandler);
// Mark post as resolved/unresolved
router.post('/posts/:postId/resolve', communityController.resolvePostHandler);
// ──────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ──────────────────────────────────────────────────────────────────
// Pin/unpin a post
router.post('/admin/community/posts/:postId/pin', communityController.pinPostHandler);
// Lock/unlock a post
router.post('/admin/community/posts/:postId/lock', communityController.lockPostHandler);
// Delete a post
router.delete('/admin/community/posts/:postId', communityController.deletePostHandler);
// Delete a comment
router.delete('/admin/community/comments/:commentId', communityController.deleteCommentHandler);
exports.default = router;
//# sourceMappingURL=community.routes.js.map