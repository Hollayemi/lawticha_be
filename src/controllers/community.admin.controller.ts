// controllers/community.admin.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';
import { CommunityPostModel, CommunityCommentModel } from '../models/Community.model';
import { Types } from 'mongoose';

// Helper to get admin context
function getAdminContext(req: Request) {
  const admin = (req as any).admin;
  if (!admin) {
    throw new AppError('Admin authentication required', 401, 'UNAUTHORIZED');
  }
  return { id: admin.id, name: admin.name, role: admin.role };
}

// ──────────────────────────────────────────────────────────────────
// Post Management
// ──────────────────────────────────────────────────────────────────

export const listAllPostsHandler = asyncHandler(async (req: Request, res: Response) => {
  const admin = getAdminContext(req);
  
  const {
    status,
    type,
    room,
    search,
    sortBy = 'latest',
    page = 1,
    limit = 20,
  } = req.query;

  const filter: any = {};

  if (status && status !== 'all') filter.status = status;
  if (type && type !== 'all') filter.type = type;
  if (room && room !== 'all') filter.room = room;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { 'author.name': { $regex: search, $options: 'i' } },
    ];
  }

  let sort: any = { createdAt: -1 };
  if (sortBy === 'oldest') sort = { createdAt: 1 };
  if (sortBy === 'most_liked') sort = { likes: -1 };
  if (sortBy === 'most_commented') sort = { commentCount: -1 };
  if (sortBy === 'most_reported') sort = { reportCount: -1 };

  const skip = (Number(page) - 1) * Number(limit);

  const [posts, total] = await Promise.all([
    CommunityPostModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    CommunityPostModel.countDocuments(filter),
  ]);

  return (res as AppResponse).data({
    data:posts,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  }, 'Posts retrieved successfully');
});

export const getPostDetailsHandler = asyncHandler(async (req: Request, res: Response) => {
  const admin = getAdminContext(req);
  const { postId } = req.params;

  const post = await CommunityPostModel.findById(postId)
    .populate('comments')
    .lean();

  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  const reports = await CommunityPostModel.aggregate([
    { $match: { _id: new Types.ObjectId(postId) } },
    { $unwind: { path: '$reports', preserveNullAndEmptyArrays: true } },
    { $sort: { 'reports.createdAt': -1 } },
    { $project: { reports: 1 } },
  ]);

  return (res as AppResponse).data({
    ...post,
    reports: reports[0]?.reports || [],
  }, 'Post details retrieved');
});

export const approvePostHandler = asyncHandler(async (req: Request, res: Response) => {
  const admin = getAdminContext(req);
  const { postId } = req.params;

  const post = await CommunityPostModel.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  post.status = 'active';
  post.approvedAt = new Date();
  post.approvedBy = admin.id;
  await post.save();

  return (res as AppResponse).data(post, 'Post approved successfully');
});

export const rejectPostHandler = asyncHandler(async (req: Request, res: Response) => {
  const admin = getAdminContext(req);
  const { postId } = req.params;
  const { reason } = req.body;

  const post = await CommunityPostModel.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  post.status = 'rejected';
  post.rejectionReason = reason;
  post.rejectedAt = new Date();
  post.rejectedBy = admin.id;
  await post.save();

  return (res as AppResponse).data(post, 'Post rejected successfully');
});

export const pinPostHandler = asyncHandler(async (req: Request, res: Response) => {
  const admin = getAdminContext(req);
  const { postId } = req.params;
  const { pinned } = req.body;

  const post = await CommunityPostModel.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  post.isPinned = pinned === undefined ? !post.isPinned : pinned;
  post.pinnedAt = post.isPinned ? new Date() : undefined;
  post.pinnedBy = post.isPinned ? admin.id : undefined;
  await post.save();

  return (res as AppResponse).data({
    isPinned: post.isPinned,
    message: post.isPinned ? 'Post pinned successfully' : 'Post unpinned successfully',
  }, 'Pin status updated');
});

export const promotePostHandler = asyncHandler(async (req: Request, res: Response) => {
  const admin = getAdminContext(req);
  const { postId } = req.params;
  const { duration = 7 } = req.body; // promotion duration in days

  const post = await CommunityPostModel.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  post.isPromoted = true;
  post.promotedAt = new Date();
  post.promotedUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
  post.promotedBy = admin.id;
  await post.save();

  return (res as AppResponse).data(post, 'Post promoted successfully');
});

export const demotePostHandler = asyncHandler(async (req: Request, res: Response) => {
  const admin = getAdminContext(req);
  const { postId } = req.params;

  const post = await CommunityPostModel.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  post.isPromoted = false;
  post.promotedUntil = undefined;
  await post.save();

  return (res as AppResponse).data(post, 'Promotion removed');
});

// ──────────────────────────────────────────────────────────────────
// Comment Management
// ──────────────────────────────────────────────────────────────────

export const listCommentsHandler = asyncHandler(async (req: Request, res: Response) => {
  const admin = getAdminContext(req);
  const { postId, status, search, page = 1, limit = 20 } = req.query;

  const filter: any = {};
  if (postId) filter.postId = new Types.ObjectId(postId as string);
  if (status === 'removed') filter.isRemoved = true;
  if (status === 'active') filter.isRemoved = { $ne: true };

  if (search) {
    filter.content = { $regex: search, $options: 'i' };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [comments, total] = await Promise.all([
    CommunityCommentModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    CommunityCommentModel.countDocuments(filter),
  ]);

  return (res as AppResponse).data({
    comments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  }, 'Comments retrieved');
});

export const removeCommentHandler = asyncHandler(async (req: Request, res: Response) => {
  const admin = getAdminContext(req);
  const { commentId } = req.params;
  const { reason } = req.body;

  const comment = await CommunityCommentModel.findById(commentId);
  if (!comment) {
    throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
  }

  comment.isRemoved = true;
  comment.removalReason = reason;
  comment.removedAt = new Date();
  comment.removedBy = admin.id;
  await comment.save();

  // Update post comment count
  await CommunityPostModel.findByIdAndUpdate(comment.postId, {
    $inc: { commentCount: -1 },
  });

  return (res as AppResponse).data(comment, 'Comment removed successfully');
});

export const restoreCommentHandler = asyncHandler(async (req: Request, res: Response) => {
  const admin = getAdminContext(req);
  const { commentId } = req.params;

  const comment = await CommunityCommentModel.findById(commentId);
  if (!comment) {
    throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
  }

  comment.isRemoved = false;
  comment.removalReason = undefined;
  comment.removedAt = undefined;
  await comment.save();

  // Update post comment count
  await CommunityPostModel.findByIdAndUpdate(comment.postId, {
    $inc: { commentCount: 1 },
  });

  return (res as AppResponse).data(comment, 'Comment restored successfully');
});

// ──────────────────────────────────────────────────────────────────
// Reports Management
// ──────────────────────────────────────────────────────────────────

export const listReportsHandler = asyncHandler(async (req: Request, res: Response) => {
  const admin = getAdminContext(req);
  const { status = 'pending', page = 1, limit = 20 } = req.query;

  const filter: any = {
    'reports.resolved': status === 'resolved',
  };

  const skip = (Number(page) - 1) * Number(limit);

  const postsWithReports = await CommunityPostModel.aggregate([
    { $match: { 'reports.0': { $exists: true } } },
    { $unwind: '$reports' },
    { $match: filter },
    { $sort: { 'reports.createdAt': -1 } },
    { $skip: skip },
    { $limit: Number(limit) },
    {
      $project: {
        postId: '$_id',
        title: 1,
        report: '$reports',
        reportCount: { $size: '$reports' },
      },
    },
  ]);

  const total = await CommunityPostModel.aggregate([
    { $match: { 'reports.0': { $exists: true } } },
    { $unwind: '$reports' },
    { $match: filter },
    { $count: 'total' },
  ]);

  return (res as AppResponse).data({
    reports: postsWithReports,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: total[0]?.total || 0,
      pages: Math.ceil((total[0]?.total || 0) / Number(limit)),
    },
  }, 'Reports retrieved');
});

export const resolveReportHandler = asyncHandler(async (req: Request, res: Response) => {
  const admin = getAdminContext(req);
  const { reportId } = req.params;
  const { action, note } = req.body;

  const post = await CommunityPostModel.findOne({
    'reports._id': new Types.ObjectId(reportId),
  });

  if (!post) {
    throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
  }

  const report = post.reports.id(reportId);
  report.resolved = true;
  report.resolvedAt = new Date();
  report.resolvedBy = admin.id;
  report.resolutionNote = note;
  report.resolutionAction = action;

  await post.save();

  return (res as AppResponse).data(report, 'Report resolved successfully');
});

// ──────────────────────────────────────────────────────────────────
// Analytics & Stats
// ──────────────────────────────────────────────────────────────────

export const getCommunityStatsHandler = asyncHandler(async (req: Request, res: Response) => {
  const admin = getAdminContext(req);

  const [
    totalPosts,
    totalComments,
    totalUsers,
    pendingPosts,
    reportedPosts,
    promotedPosts,
    pinnedPosts,
    postsByRoom,
    activityLast30Days,
  ] = await Promise.all([
    CommunityPostModel.countDocuments(),
    CommunityCommentModel.countDocuments(),
    CommunityPostModel.distinct('author.userId').then(ids => ids.length),
    CommunityPostModel.countDocuments({ status: 'pending' }),
    CommunityPostModel.countDocuments({ reportCount: { $gt: 0 } }),
    CommunityPostModel.countDocuments({ isPromoted: true }),
    CommunityPostModel.countDocuments({ isPinned: true }),
    CommunityPostModel.aggregate([
      { $group: { _id: '$room', count: { $sum: 1 } } },
    ]),
    CommunityPostModel.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return (res as AppResponse).data({
    overview: {
      totalPosts,
      totalComments,
      totalUsers,
      pendingPosts,
      reportedPosts,
      promotedPosts,
      pinnedPosts,
    },
    postsByRoom: postsByRoom.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
    activityLast30Days,
  }, 'Community stats retrieved');
});

export const getActivityReportHandler = asyncHandler(async (req: Request, res: Response) => {
  const admin = getAdminContext(req);
  const { period = 'week' } = req.query;

  let days = 7;
  if (period === 'month') days = 30;
  if (period === 'year') days = 365;

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [postsOverTime, commentsOverTime, topContributors, topPosts] = await Promise.all([
    CommunityPostModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          posts: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    CommunityCommentModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          comments: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    CommunityPostModel.aggregate([
      {
        $group: {
          _id: '$author.userId',
          name: { $first: '$author.name' },
          postCount: { $sum: 1 },
          totalLikes: { $sum: '$likes' },
        },
      },
      { $sort: { postCount: -1 } },
      { $limit: 10 },
    ]),
    CommunityPostModel.aggregate([
      { $addFields: { engagement: { $add: ['$likes', { $multiply: ['$commentCount', 2] }] } } },
      { $sort: { engagement: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          title: 1,
          likes: 1,
          commentCount: 1,
          engagement: 1,
        },
      },
    ]),
  ]);

  return (res as AppResponse).data({
    postsOverTime,
    commentsOverTime,
    topContributors,
    topPosts,
  }, 'Activity report retrieved');
});

// ──────────────────────────────────────────────────────────────────
// Bulk Actions
// ──────────────────────────────────────────────────────────────────

export const bulkModeratePostsHandler = asyncHandler(async (req: Request, res: Response) => {
  const admin = getAdminContext(req);
  const { postIds, action, data } = req.body;

  if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
    throw new AppError('Post IDs are required', 400, 'VALIDATION_ERROR');
  }

  let result;
  const objectIds = postIds.map(id => new Types.ObjectId(id));

  switch (action) {
    case 'delete':
      result = await CommunityPostModel.deleteMany({ _id: { $in: objectIds } });
      break;
    case 'pin':
      result = await CommunityPostModel.updateMany(
        { _id: { $in: objectIds } },
        { $set: { isPinned: data?.pinned ?? true, pinnedBy: admin.id, pinnedAt: new Date() } }
      );
      break;
    case 'promote':
      result = await CommunityPostModel.updateMany(
        { _id: { $in: objectIds } },
        { $set: { isPromoted: true, promotedBy: admin.id, promotedAt: new Date() } }
      );
      break;
    case 'demote':
      result = await CommunityPostModel.updateMany(
        { _id: { $in: objectIds } },
        { $set: { isPromoted: false }, $unset: { promotedUntil: '' } }
      );
      break;
    default:
      throw new AppError('Invalid bulk action', 400, 'INVALID_ACTION');
  }

  return (res as AppResponse).data({
    modifiedCount: result,
    action,
  }, `Bulk ${action} completed`);
});