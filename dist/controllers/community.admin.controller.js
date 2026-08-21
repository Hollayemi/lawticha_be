"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkModeratePostsHandler = exports.getActivityReportHandler = exports.getCommunityStatsHandler = exports.resolveReportHandler = exports.listReportsHandler = exports.restoreCommentHandler = exports.removeCommentHandler = exports.listCommentsHandler = exports.demotePostHandler = exports.promotePostHandler = exports.pinPostHandler = exports.rejectPostHandler = exports.approvePostHandler = exports.getPostDetailsHandler = exports.listAllPostsHandler = void 0;
const error_1 = require("../middleware/error");
const Community_model_1 = require("../models/Community.model");
const mongoose_1 = require("mongoose");
// Helper to get admin context
function getAdminContext(req) {
    const admin = req.admin;
    if (!admin) {
        throw new error_1.AppError('Admin authentication required', 401, 'UNAUTHORIZED');
    }
    return { id: admin.id, name: admin.name, role: admin.role };
}
// ──────────────────────────────────────────────────────────────────
// Post Management
// ──────────────────────────────────────────────────────────────────
exports.listAllPostsHandler = (0, error_1.asyncHandler)(async (req, res) => {
    const admin = getAdminContext(req);
    const { status, type, room, search, sortBy = 'latest', page = 1, limit = 20, } = req.query;
    const filter = {};
    if (status && status !== 'all')
        filter.status = status;
    if (type && type !== 'all')
        filter.type = type;
    if (room && room !== 'all')
        filter.room = room;
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { 'author.name': { $regex: search, $options: 'i' } },
        ];
    }
    let sort = { createdAt: -1 };
    if (sortBy === 'oldest')
        sort = { createdAt: 1 };
    if (sortBy === 'most_liked')
        sort = { likes: -1 };
    if (sortBy === 'most_commented')
        sort = { commentCount: -1 };
    if (sortBy === 'most_reported')
        sort = { reportCount: -1 };
    const skip = (Number(page) - 1) * Number(limit);
    const [posts, total] = await Promise.all([
        Community_model_1.CommunityPostModel.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        Community_model_1.CommunityPostModel.countDocuments(filter),
    ]);
    return res.data({
        data: posts,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    }, 'Posts retrieved successfully');
});
exports.getPostDetailsHandler = (0, error_1.asyncHandler)(async (req, res) => {
    const admin = getAdminContext(req);
    const { postId } = req.params;
    const post = await Community_model_1.CommunityPostModel.findById(postId)
        .populate('comments')
        .lean();
    if (!post) {
        throw new error_1.AppError('Post not found', 404, 'POST_NOT_FOUND');
    }
    const reports = await Community_model_1.CommunityPostModel.aggregate([
        { $match: { _id: new mongoose_1.Types.ObjectId(postId) } },
        { $unwind: { path: '$reports', preserveNullAndEmptyArrays: true } },
        { $sort: { 'reports.createdAt': -1 } },
        { $project: { reports: 1 } },
    ]);
    return res.data({
        ...post,
        reports: reports[0]?.reports || [],
    }, 'Post details retrieved');
});
exports.approvePostHandler = (0, error_1.asyncHandler)(async (req, res) => {
    const admin = getAdminContext(req);
    const { postId } = req.params;
    const post = await Community_model_1.CommunityPostModel.findById(postId);
    if (!post) {
        throw new error_1.AppError('Post not found', 404, 'POST_NOT_FOUND');
    }
    post.status = 'active';
    post.approvedAt = new Date();
    post.approvedBy = admin.id;
    await post.save();
    return res.data(post, 'Post approved successfully');
});
exports.rejectPostHandler = (0, error_1.asyncHandler)(async (req, res) => {
    const admin = getAdminContext(req);
    const { postId } = req.params;
    const { reason } = req.body;
    const post = await Community_model_1.CommunityPostModel.findById(postId);
    if (!post) {
        throw new error_1.AppError('Post not found', 404, 'POST_NOT_FOUND');
    }
    post.status = 'rejected';
    post.rejectionReason = reason;
    post.rejectedAt = new Date();
    post.rejectedBy = admin.id;
    await post.save();
    return res.data(post, 'Post rejected successfully');
});
exports.pinPostHandler = (0, error_1.asyncHandler)(async (req, res) => {
    const admin = getAdminContext(req);
    const { postId } = req.params;
    const { pinned } = req.body;
    const post = await Community_model_1.CommunityPostModel.findById(postId);
    if (!post) {
        throw new error_1.AppError('Post not found', 404, 'POST_NOT_FOUND');
    }
    post.isPinned = pinned === undefined ? !post.isPinned : pinned;
    post.pinnedAt = post.isPinned ? new Date() : undefined;
    post.pinnedBy = post.isPinned ? admin.id : undefined;
    await post.save();
    return res.data({
        isPinned: post.isPinned,
        message: post.isPinned ? 'Post pinned successfully' : 'Post unpinned successfully',
    }, 'Pin status updated');
});
exports.promotePostHandler = (0, error_1.asyncHandler)(async (req, res) => {
    const admin = getAdminContext(req);
    const { postId } = req.params;
    const { duration = 7 } = req.body; // promotion duration in days
    const post = await Community_model_1.CommunityPostModel.findById(postId);
    if (!post) {
        throw new error_1.AppError('Post not found', 404, 'POST_NOT_FOUND');
    }
    post.isPromoted = true;
    post.promotedAt = new Date();
    post.promotedUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    post.promotedBy = admin.id;
    await post.save();
    return res.data(post, 'Post promoted successfully');
});
exports.demotePostHandler = (0, error_1.asyncHandler)(async (req, res) => {
    const admin = getAdminContext(req);
    const { postId } = req.params;
    const post = await Community_model_1.CommunityPostModel.findById(postId);
    if (!post) {
        throw new error_1.AppError('Post not found', 404, 'POST_NOT_FOUND');
    }
    post.isPromoted = false;
    post.promotedUntil = undefined;
    await post.save();
    return res.data(post, 'Promotion removed');
});
// ──────────────────────────────────────────────────────────────────
// Comment Management
// ──────────────────────────────────────────────────────────────────
exports.listCommentsHandler = (0, error_1.asyncHandler)(async (req, res) => {
    const admin = getAdminContext(req);
    const { postId, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (postId)
        filter.postId = new mongoose_1.Types.ObjectId(postId);
    if (status === 'removed')
        filter.isRemoved = true;
    if (status === 'active')
        filter.isRemoved = { $ne: true };
    if (search) {
        filter.content = { $regex: search, $options: 'i' };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [comments, total] = await Promise.all([
        Community_model_1.CommunityCommentModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        Community_model_1.CommunityCommentModel.countDocuments(filter),
    ]);
    return res.data({
        comments,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    }, 'Comments retrieved');
});
exports.removeCommentHandler = (0, error_1.asyncHandler)(async (req, res) => {
    const admin = getAdminContext(req);
    const { commentId } = req.params;
    const { reason } = req.body;
    const comment = await Community_model_1.CommunityCommentModel.findById(commentId);
    if (!comment) {
        throw new error_1.AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }
    comment.isRemoved = true;
    comment.removalReason = reason;
    comment.removedAt = new Date();
    comment.removedBy = admin.id;
    await comment.save();
    // Update post comment count
    await Community_model_1.CommunityPostModel.findByIdAndUpdate(comment.postId, {
        $inc: { commentCount: -1 },
    });
    return res.data(comment, 'Comment removed successfully');
});
exports.restoreCommentHandler = (0, error_1.asyncHandler)(async (req, res) => {
    const admin = getAdminContext(req);
    const { commentId } = req.params;
    const comment = await Community_model_1.CommunityCommentModel.findById(commentId);
    if (!comment) {
        throw new error_1.AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }
    comment.isRemoved = false;
    comment.removalReason = undefined;
    comment.removedAt = undefined;
    await comment.save();
    // Update post comment count
    await Community_model_1.CommunityPostModel.findByIdAndUpdate(comment.postId, {
        $inc: { commentCount: 1 },
    });
    return res.data(comment, 'Comment restored successfully');
});
// ──────────────────────────────────────────────────────────────────
// Reports Management
// ──────────────────────────────────────────────────────────────────
exports.listReportsHandler = (0, error_1.asyncHandler)(async (req, res) => {
    const admin = getAdminContext(req);
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const filter = {
        'reports.resolved': status === 'resolved',
    };
    const skip = (Number(page) - 1) * Number(limit);
    const postsWithReports = await Community_model_1.CommunityPostModel.aggregate([
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
    const total = await Community_model_1.CommunityPostModel.aggregate([
        { $match: { 'reports.0': { $exists: true } } },
        { $unwind: '$reports' },
        { $match: filter },
        { $count: 'total' },
    ]);
    return res.data({
        reports: postsWithReports,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: total[0]?.total || 0,
            pages: Math.ceil((total[0]?.total || 0) / Number(limit)),
        },
    }, 'Reports retrieved');
});
exports.resolveReportHandler = (0, error_1.asyncHandler)(async (req, res) => {
    const admin = getAdminContext(req);
    const { reportId } = req.params;
    const { action, note } = req.body;
    const post = await Community_model_1.CommunityPostModel.findOne({
        'reports._id': new mongoose_1.Types.ObjectId(reportId),
    });
    if (!post) {
        throw new error_1.AppError('Report not found', 404, 'REPORT_NOT_FOUND');
    }
    const report = post.reports.id(reportId);
    report.resolved = true;
    report.resolvedAt = new Date();
    report.resolvedBy = admin.id;
    report.resolutionNote = note;
    report.resolutionAction = action;
    await post.save();
    return res.data(report, 'Report resolved successfully');
});
// ──────────────────────────────────────────────────────────────────
// Analytics & Stats
// ──────────────────────────────────────────────────────────────────
exports.getCommunityStatsHandler = (0, error_1.asyncHandler)(async (req, res) => {
    const admin = getAdminContext(req);
    const [totalPosts, totalComments, totalUsers, pendingPosts, reportedPosts, promotedPosts, pinnedPosts, postsByRoom, activityLast30Days,] = await Promise.all([
        Community_model_1.CommunityPostModel.countDocuments(),
        Community_model_1.CommunityCommentModel.countDocuments(),
        Community_model_1.CommunityPostModel.distinct('author.userId').then(ids => ids.length),
        Community_model_1.CommunityPostModel.countDocuments({ status: 'pending' }),
        Community_model_1.CommunityPostModel.countDocuments({ reportCount: { $gt: 0 } }),
        Community_model_1.CommunityPostModel.countDocuments({ isPromoted: true }),
        Community_model_1.CommunityPostModel.countDocuments({ isPinned: true }),
        Community_model_1.CommunityPostModel.aggregate([
            { $group: { _id: '$room', count: { $sum: 1 } } },
        ]),
        Community_model_1.CommunityPostModel.aggregate([
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
    return res.data({
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
exports.getActivityReportHandler = (0, error_1.asyncHandler)(async (req, res) => {
    const admin = getAdminContext(req);
    const { period = 'week' } = req.query;
    let days = 7;
    if (period === 'month')
        days = 30;
    if (period === 'year')
        days = 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [postsOverTime, commentsOverTime, topContributors, topPosts] = await Promise.all([
        Community_model_1.CommunityPostModel.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    posts: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        Community_model_1.CommunityCommentModel.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    comments: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        Community_model_1.CommunityPostModel.aggregate([
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
        Community_model_1.CommunityPostModel.aggregate([
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
    return res.data({
        postsOverTime,
        commentsOverTime,
        topContributors,
        topPosts,
    }, 'Activity report retrieved');
});
// ──────────────────────────────────────────────────────────────────
// Bulk Actions
// ──────────────────────────────────────────────────────────────────
exports.bulkModeratePostsHandler = (0, error_1.asyncHandler)(async (req, res) => {
    const admin = getAdminContext(req);
    const { postIds, action, data } = req.body;
    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
        throw new error_1.AppError('Post IDs are required', 400, 'VALIDATION_ERROR');
    }
    let result;
    const objectIds = postIds.map(id => new mongoose_1.Types.ObjectId(id));
    switch (action) {
        case 'delete':
            result = await Community_model_1.CommunityPostModel.deleteMany({ _id: { $in: objectIds } });
            break;
        case 'pin':
            result = await Community_model_1.CommunityPostModel.updateMany({ _id: { $in: objectIds } }, { $set: { isPinned: data?.pinned ?? true, pinnedBy: admin.id, pinnedAt: new Date() } });
            break;
        case 'promote':
            result = await Community_model_1.CommunityPostModel.updateMany({ _id: { $in: objectIds } }, { $set: { isPromoted: true, promotedBy: admin.id, promotedAt: new Date() } });
            break;
        case 'demote':
            result = await Community_model_1.CommunityPostModel.updateMany({ _id: { $in: objectIds } }, { $set: { isPromoted: false }, $unset: { promotedUntil: '' } });
            break;
        default:
            throw new error_1.AppError('Invalid bulk action', 400, 'INVALID_ACTION');
    }
    return res.data({
        modifiedCount: result,
        action,
    }, `Bulk ${action} completed`);
});
//# sourceMappingURL=community.admin.controller.js.map