import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';
import * as communityService from '../services/community.service';
import { COMMUNITY_ROOMS } from '../models/types/community.types';
import { CommunityCommentModel } from '../models/Community.model';
import { CommunityPostModel } from '../models';
import { Types } from 'mongoose';

// Helper to get user ID from request
function getUserId(req: Request): string | undefined {
  return (req as any).user?.id;
}

// Helper to get admin context
function adminCtx(req: Request) {
  const admin = (req as any).admin;
  if (!admin) return null;
  return { adminId: admin.id, adminName: admin.name };
}

// ──────────────────────────────────────────────────────────────────
// USER ROUTES (require authentication)
// ──────────────────────────────────────────────────────────────────

// GET /community/posts
export const listPostsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { room, sort, search, tag, page, pageSize } = req.query as Record<string, string>;
    
    const result = await communityService.listPosts({
      room: room as any,
      sort: sort as any,
      search,
      tag,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    
    return (res as AppResponse).data(result, 'Posts retrieved successfully');
  }
);

// GET /community/posts/:postId
export const getPostHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = getUserId(req);
    const result = await communityService.getPostById(req.params.postId, userId);
    return (res as AppResponse).data(result, 'Post retrieved successfully');
  }
);

// POST /community/posts
export const createPostHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = getUserId(req);
    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    
    const { title, content, room, reference, tags } = req.body;
    
    if (!title?.trim()) {
      throw new AppError('Title is required', 400, 'VALIDATION_ERROR');
    }
    if (!content?.trim()) {
      throw new AppError('Content is required', 400, 'VALIDATION_ERROR');
    }
    if (!room || !COMMUNITY_ROOMS[room as keyof typeof COMMUNITY_ROOMS]) {
      throw new AppError('Valid room is required', 400, 'VALIDATION_ERROR');
    }
    
    // Parse reference if provided as string
    let parsedReference;
    if (reference) {
      parsedReference = typeof reference === 'string' ? JSON.parse(reference) : reference;
    }
    
    // Parse tags if provided as string
    let parsedTags: string[] = [];
    if (tags) {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }
    
    const files = req.body.images;
    
    const result = await communityService.createPost(
      userId,
      {
        title: title.trim(),
        content: content.trim(),
        room,
        reference: parsedReference,
        tags: parsedTags,
      },
      files
    );
    
    return (res as AppResponse).data(result, 'Post created successfully', 201);
  }
);

// POST /community/posts/:postId/comments
export const createCommentHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = getUserId(req);
    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    
    const { content, parentId } = req.body;
    
    if (!content?.trim()) {
      throw new AppError('Comment content is required', 400, 'VALIDATION_ERROR');
    }
    
    const files = req.body.images;
    
    const result = await communityService.createComment(
      req.params.postId,
      userId,
      {
        content: content.trim(),
        parentId,
      },
      files
    );
    
    return (res as AppResponse).data(result, 'Comment added successfully', 201);
  }
);

// POST /community/posts/:postId/like
export const toggleLikePostHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = getUserId(req);
    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    
    const result = await communityService.toggleLikePost(req.params.postId, userId);
    return (res as AppResponse).data(result, result.liked ? 'Post liked' : 'Post unliked');
  }
);

// POST /community/posts/:postId/comments/:commentId/like
export const toggleLikeCommentHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = getUserId(req);
    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    
    const result = await communityService.toggleLikeComment(
      req.params.postId,
      req.params.commentId,
      userId
    );
    return (res as AppResponse).data(result, result.liked ? 'Comment liked' : 'Comment unliked');
  }
);

// POST /community/posts/:postId/comments/:commentId/accept
export const acceptAnswerHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = getUserId(req);
    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    
    const result = await communityService.acceptAnswer(
      req.params.postId,
      req.params.commentId,
      userId
    );
    return (res as AppResponse).data(result, 'Answer accepted successfully');
  }
);

// POST /community/posts/:postId/resolve
export const resolvePostHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = getUserId(req);
    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    
    const result = await communityService.resolvePost(req.params.postId, userId);
    return (res as AppResponse).data(result, result.isResolved ? 'Post marked as resolved' : 'Post reopened');
  }
);

// GET /community/rooms
export const getRoomsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await communityService.getRooms();
    return (res as AppResponse).data(result, 'Rooms retrieved successfully');
  }
);

// GET /community/reference/:type/:id
export const getPostsByReferenceHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { type, id } = req.params;
    const result = await communityService.getPostsByReference(type, id);
    return (res as AppResponse).data(result, 'Posts retrieved successfully');
  }
);

// ──────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ──────────────────────────────────────────────────────────────────

// POST /admin/community/posts/:postId/pin
export const pinPostHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const admin = adminCtx(req);
    if (!admin) {
      throw new AppError('Admin authentication required', 401, 'UNAUTHORIZED');
    }
    
    const result = await communityService.pinPost(req.params.postId, admin);
    return (res as AppResponse).data(result, result.message);
  }
);

// POST /admin/community/posts/:postId/lock
export const lockPostHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const admin = adminCtx(req);
    if (!admin) {
      throw new AppError('Admin authentication required', 401, 'UNAUTHORIZED');
    }
    
    const result = await communityService.lockPost(req.params.postId, admin);
    return (res as AppResponse).data(result, result.message);
  }
);

// DELETE /admin/community/posts/:postId (Admin only)
export const deletePostHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const admin = adminCtx(req);
    if (!admin) {
      throw new AppError('Admin authentication required', 401, 'UNAUTHORIZED');
    }
    
    const post = await communityService.getPostById(req.params.postId);
    if (!post) {
      throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
    }
    
    // Delete all comments first
    await CommunityCommentModel.deleteMany({ postId: new Types.ObjectId(req.params.postId) });
    // Delete the post
    await CommunityPostModel.findByIdAndDelete(req.params.postId);
    
    return (res as AppResponse).data(null, 'Post deleted successfully');
  }
);

// DELETE /admin/community/comments/:commentId (Admin only)
export const deleteCommentHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const admin = adminCtx(req);
    if (!admin) {
      throw new AppError('Admin authentication required', 401, 'UNAUTHORIZED');
    }
    
    const comment = await CommunityCommentModel.findById(req.params.commentId);
    if (!comment) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }
    
    // Update post comment count
    await CommunityPostModel.findByIdAndUpdate(comment.postId, {
      $inc: { commentCount: -1 },
      $pull: { comments: comment._id }
    });
    
    // Delete the comment
    await CommunityCommentModel.findByIdAndDelete(req.params.commentId);
    
    return (res as AppResponse).data(null, 'Comment deleted successfully');
  }
);