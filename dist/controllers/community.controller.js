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
exports.deleteCommentHandler = exports.deletePostHandler = exports.lockPostHandler = exports.pinPostHandler = exports.getPostsByReferenceHandler = exports.getRoomsHandler = exports.resolvePostHandler = exports.acceptAnswerHandler = exports.toggleLikeCommentHandler = exports.toggleLikePostHandler = exports.createCommentHandler = exports.createPostHandler = exports.getPostHandler = exports.listPostsHandler = void 0;
const error_1 = require("../middleware/error");
const communityService = __importStar(require("../services/community.service"));
const community_types_1 = require("../models/types/community.types");
const Community_model_1 = require("../models/Community.model");
// import { CommunityPostModel } from '../models';
const mongoose_1 = require("mongoose");
// Helper to get user ID from request
function getUserId(req) {
    return req.user?.id;
}
// Helper to get admin context
function adminCtx(req) {
    const admin = req.admin;
    if (!admin)
        return null;
    return { adminId: admin.id, adminName: admin.name };
}
// ──────────────────────────────────────────────────────────────────
// USER ROUTES (require authentication)
// ──────────────────────────────────────────────────────────────────
// GET /community/posts
exports.listPostsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { room, sort, search, tag, page, pageSize } = req.query;
    const result = await communityService.listPosts({
        room: room,
        sort: sort,
        search,
        tag,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return res.data(result, 'Posts retrieved successfully');
});
// GET /community/posts/:postId
exports.getPostHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const userId = getUserId(req);
    const result = await communityService.getPostById(req.params.postId, userId);
    return res.data(result, 'Post retrieved successfully');
});
// POST /community/posts
exports.createPostHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const userId = getUserId(req);
    if (!userId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const { title, content, room, reference, tags } = req.body;
    if (!title?.trim()) {
        throw new error_1.AppError('Title is required', 400, 'VALIDATION_ERROR');
    }
    if (!content?.trim()) {
        throw new error_1.AppError('Content is required', 400, 'VALIDATION_ERROR');
    }
    if (!room || !community_types_1.COMMUNITY_ROOMS[room]) {
        throw new error_1.AppError('Valid room is required', 400, 'VALIDATION_ERROR');
    }
    // Parse reference if provided as string
    let parsedReference;
    if (reference) {
        parsedReference = typeof reference === 'string' ? JSON.parse(reference) : reference;
    }
    // Parse tags if provided as string
    let parsedTags = [];
    if (tags) {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }
    const files = req.body.images;
    const result = await communityService.createPost(userId, {
        title: title.trim(),
        content: content.trim(),
        room,
        reference: parsedReference,
        tags: parsedTags,
    }, files);
    return res.data(result, 'Post created successfully', 201);
});
// POST /community/posts/:postId/comments
exports.createCommentHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const userId = getUserId(req);
    if (!userId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const { content, parentId } = req.body;
    if (!content?.trim()) {
        throw new error_1.AppError('Comment content is required', 400, 'VALIDATION_ERROR');
    }
    const files = req.body.images;
    const result = await communityService.createComment(req.params.postId, userId, {
        content: content.trim(),
        parentId,
    }, files);
    return res.data(result, 'Comment added successfully', 201);
});
// POST /community/posts/:postId/like
exports.toggleLikePostHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const userId = getUserId(req);
    if (!userId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const result = await communityService.toggleLikePost(req.params.postId, userId);
    return res.data(result, result.liked ? 'Post liked' : 'Post unliked');
});
// POST /community/posts/:postId/comments/:commentId/like
exports.toggleLikeCommentHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const userId = getUserId(req);
    if (!userId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const result = await communityService.toggleLikeComment(req.params.postId, req.params.commentId, userId);
    return res.data(result, result.liked ? 'Comment liked' : 'Comment unliked');
});
// POST /community/posts/:postId/comments/:commentId/accept
exports.acceptAnswerHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const userId = getUserId(req);
    if (!userId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const result = await communityService.acceptAnswer(req.params.postId, req.params.commentId, userId);
    return res.data(result, 'Answer accepted successfully');
});
// POST /community/posts/:postId/resolve
exports.resolvePostHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const userId = getUserId(req);
    if (!userId) {
        throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const result = await communityService.resolvePost(req.params.postId, userId);
    return res.data(result, result.isResolved ? 'Post marked as resolved' : 'Post reopened');
});
// GET /community/rooms
exports.getRoomsHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await communityService.getRooms();
    return res.data(result, 'Rooms retrieved successfully');
});
// GET /community/reference/:type/:id
exports.getPostsByReferenceHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { type, id } = req.params;
    const result = await communityService.getPostsByReference(type, id);
    return res.data(result, 'Posts retrieved successfully');
});
// ──────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ──────────────────────────────────────────────────────────────────
// POST /admin/community/posts/:postId/pin
exports.pinPostHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const admin = adminCtx(req);
    if (!admin) {
        throw new error_1.AppError('Admin authentication required', 401, 'UNAUTHORIZED');
    }
    const result = await communityService.pinPost(req.params.postId, admin);
    return res.data(result, result.message);
});
// POST /admin/community/posts/:postId/lock
exports.lockPostHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const admin = adminCtx(req);
    if (!admin) {
        throw new error_1.AppError('Admin authentication required', 401, 'UNAUTHORIZED');
    }
    const result = await communityService.lockPost(req.params.postId, admin);
    return res.data(result, result.message);
});
// DELETE /admin/community/posts/:postId (Admin only)
exports.deletePostHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const admin = adminCtx(req);
    if (!admin) {
        throw new error_1.AppError('Admin authentication required', 401, 'UNAUTHORIZED');
    }
    const post = await communityService.getPostById(req.params.postId);
    if (!post) {
        throw new error_1.AppError('Post not found', 404, 'POST_NOT_FOUND');
    }
    // Delete all comments first
    await Community_model_1.CommunityCommentModel.deleteMany({ postId: new mongoose_1.Types.ObjectId(req.params.postId) });
    // Delete the post
    // await CommunityPostModel.findByIdAndDelete(req.params.postId);
    return res.data(null, 'Post deleted successfully');
});
// DELETE /admin/community/comments/:commentId (Admin only)
exports.deleteCommentHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const admin = adminCtx(req);
    if (!admin) {
        throw new error_1.AppError('Admin authentication required', 401, 'UNAUTHORIZED');
    }
    const comment = await Community_model_1.CommunityCommentModel.findById(req.params.commentId);
    if (!comment) {
        throw new error_1.AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }
    // Update post comment count
    // await CommunityPostModel.findByIdAndUpdate(comment.postId, {
    //   $inc: { commentCount: -1 },
    //   $pull: { comments: comment._id }
    // });
    // Delete the comment
    await Community_model_1.CommunityCommentModel.findByIdAndDelete(req.params.commentId);
    return res.data(null, 'Comment deleted successfully');
});
//# sourceMappingURL=community.controller.js.map