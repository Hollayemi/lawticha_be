"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPosts = listPosts;
exports.getPostById = getPostById;
exports.createPost = createPost;
exports.createComment = createComment;
exports.toggleLikePost = toggleLikePost;
exports.toggleLikeComment = toggleLikeComment;
exports.acceptAnswer = acceptAnswer;
exports.pinPost = pinPost;
exports.lockPost = lockPost;
exports.resolvePost = resolvePost;
exports.getRooms = getRooms;
exports.getPostsByReference = getPostsByReference;
const mongoose_1 = require("mongoose");
const Community_model_1 = require("../models/Community.model");
const Module_model_1 = require("../models/Module.model");
const Module_model_2 = require("../models/Module.model");
const Module_model_3 = require("../models/Module.model");
const User_model_1 = require("../models/User.model");
const LawyerProfile_model_1 = require("../models/LawyerProfile.model");
const error_1 = require("../middleware/error");
const community_types_1 = require("../models/types/community.types");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const notification_1 = __importDefault(require("../controllers/others/notification"));
// Helper: Build community user object
async function buildCommunityUser(userId) {
    const user = await User_model_1.UserModel.findById(userId);
    if (!user) {
        throw new error_1.AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    let role = 'citizen';
    let isVerified = false;
    let badge;
    let specialisms = [];
    let yearsOfExperience;
    // Check if user is a lawyer
    const lawyerProfile = await LawyerProfile_model_1.LawyerProfileModel.findOne({ userId });
    if (lawyerProfile) {
        role = 'lawyer';
        isVerified = lawyerProfile.verificationStatus === 'verified';
        if (isVerified) {
            badge = 'Verified Lawyer';
            specialisms = lawyerProfile.specialisms;
            yearsOfExperience = new Date().getFullYear() - (lawyerProfile.yearOfCall || 0);
        }
    }
    // Check for admin role
    if (user.role === 'admin') {
        role = 'admin';
    }
    return {
        userId: user._id,
        name: user.firstName || user.email,
        email: user.email,
        avatar: user.avatarUrl,
        role,
        isVerified,
        badge,
        specialisms,
        yearsOfExperience,
    };
}
// Helper: Build reference object
async function buildReference(referenceInput) {
    if (!referenceInput)
        return undefined;
    const { type, id, title, moduleId, moduleTitle, topicId, topicTitle } = referenceInput;
    let referenceModel = '';
    let slug = '';
    let excerpt = '';
    let thumbnail = '';
    // Fetch additional details based on type
    if (type === 'module') {
        const module = await Module_model_1.ModuleModel.findById(id);
        if (module) {
            slug = module.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            excerpt = module.description?.substring(0, 200);
            thumbnail = module.thumbnail || undefined;
            referenceModel = 'AdminModule';
        }
    }
    else if (type === 'topic') {
        const topic = await Module_model_2.TopicModel.findById(id);
        if (topic) {
            slug = topic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            excerpt = topic.overview?.substring(0, 200);
            thumbnail = topic.thumbnailUrl || undefined;
            referenceModel = 'AdminTopic';
        }
    }
    else if (type === 'subtopic') {
        const subtopic = await Module_model_3.SubTopicModel.findById(id);
        if (subtopic) {
            slug = subtopic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            excerpt = subtopic.notes?.substring(0, 200);
            referenceModel = 'AdminSubTopic';
        }
    }
    return {
        type,
        id: new mongoose_1.Types.ObjectId(id),
        referenceModel,
        title,
        slug,
        moduleId: moduleId ? new mongoose_1.Types.ObjectId(moduleId) : undefined,
        moduleTitle,
        topicId: topicId ? new mongoose_1.Types.ObjectId(topicId) : undefined,
        topicTitle,
        excerpt,
        thumbnail,
    };
}
// Helper: Sort posts
function sortPosts(posts, sort) {
    switch (sort) {
        case 'popular':
            return posts.sort((a, b) => b.likes - a.likes);
        case 'trending':
            return posts.sort((a, b) => {
                const aScore = (a.likes * 0.3) + (a.commentCount * 0.7);
                const bScore = (b.likes * 0.3) + (b.commentCount * 0.7);
                return bScore - aScore;
            });
        case 'unanswered':
            return posts.filter(p => p.commentCount === 0);
        default:
            return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
}
// ──────────────────────────────────────────────────────────────────
// MAIN SERVICE FUNCTIONS
// ──────────────────────────────────────────────────────────────────
// GET /community/posts
async function listPosts(query) {
    const { room = "general", sort = 'latest', search, tag, page = 1, pageSize = 20 } = query;
    const filter = {};
    if (room && community_types_1.COMMUNITY_ROOMS[room]) {
        filter.room = room;
    }
    if (search) {
        filter.$text = { $search: search };
    }
    if (tag) {
        filter.tags = tag;
    }
    const skip = (page - 1) * pageSize;
    // Build query with sorting
    let dbQuery = Community_model_1.CommunityPostModel.find(filter);
    if (sort === 'latest') {
        dbQuery = dbQuery.sort({ isPinned: -1, createdAt: -1 });
    }
    else {
        dbQuery = dbQuery.sort({ isPinned: -1, lastActivityAt: -1 });
    }
    const [posts, total] = await Promise.all([
        dbQuery.skip(skip).limit(pageSize).lean(),
        Community_model_1.CommunityPostModel.countDocuments(filter),
    ]);
    // Fetch comment counts for each post
    const postsWithComments = await Promise.all(posts.map(async (post) => {
        const commentCount = await Community_model_1.CommunityCommentModel.countDocuments({ postId: post._id });
        return { ...post, commentCount };
    }));
    let sortedPosts = sortPosts(postsWithComments, sort);
    // Apply unanswered filter after counting
    if (sort === 'unanswered') {
        sortedPosts = sortedPosts.filter(p => p.commentCount === 0);
    }
    return {
        data: sortedPosts,
        total: sort === 'unanswered' ? sortedPosts.length : total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
// GET /community/posts/:postId
async function getPostById(postId, userId) {
    const post = await Community_model_1.CommunityPostModel.findById(postId).lean();
    if (!post) {
        throw new error_1.AppError('Post not found', 404, 'POST_NOT_FOUND');
    }
    // Increment view count
    await Community_model_1.CommunityPostModel.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } });
    // Get comments with nested replies
    const comments = await Community_model_1.CommunityCommentModel.find({
        postId: new mongoose_1.Types.ObjectId(postId),
        parentId: null
    })
        .sort({ isAcceptedAnswer: -1, createdAt: 1 })
        .lean();
    // Get replies for each comment
    const commentsWithReplies = await Promise.all(comments.map(async (comment) => {
        const replies = await Community_model_1.CommunityCommentModel.find({
            parentId: comment._id
        }).sort({ createdAt: 1 }).lean();
        return { ...comment, replies };
    }));
    // Check if user has liked the post
    let likedByUser = false;
    if (userId) {
        likedByUser = post.likedBy?.some((id) => id.toString() === userId) || false;
    }
    return {
        ...post,
        likedByUser,
        comments: commentsWithReplies,
        commentCount: commentsWithReplies.length,
    };
}
// POST /community/posts
async function createPost(userId, input, files) {
    // Get user details
    const author = await buildCommunityUser(new mongoose_1.Types.ObjectId(userId));
    // Check room permissions
    const roomConfig = community_types_1.COMMUNITY_ROOMS[input.room];
    if (!roomConfig.allowedRoles.includes(author.role)) {
        throw new error_1.AppError(`You don't have permission to post in ${roomConfig.name}`, 403, 'PERMISSION_DENIED');
    }
    // Build reference if provided
    const reference = await buildReference(input.reference);
    // Upload images
    const imageUrls = files ? await cloudinary_1.default.uploadMultipleFiles(files, 'community') : [];
    const post = await Community_model_1.CommunityPostModel.create({
        title: input.title,
        content: input.content,
        author,
        room: input.room,
        reference: reference || null,
        tags: input.tags,
        images: imageUrls,
        likes: 0,
        likedBy: [],
        comments: [],
        commentCount: 0,
        viewCount: 0,
        isPinned: false,
        isLocked: false,
        isResolved: false,
        lastActivityAt: new Date(),
    });
    // Notify user of successful post creation
    await notification_1.default.saveAndSendNotification({
        userId: userId,
        title: '📝 Post Created Successfully',
        body: `Your post "${input.title.substring(0, 60)}${input.title.length > 60 ? '...' : ''}" has been published in ${roomConfig.name}.`,
        type: 'post_created',
        clickUrl: `/community/posts/${post._id}`,
        priority: 'medium'
    }, 'user', { push_notification: true });
    return post;
}
// POST /community/posts/:postId/comments
async function createComment(postId, userId, input, files) {
    const post = await Community_model_1.CommunityPostModel.findById(postId);
    if (!post) {
        throw new error_1.AppError('Post not found', 404, 'POST_NOT_FOUND');
    }
    if (post.isLocked) {
        throw new error_1.AppError('This post is locked. No new comments allowed.', 403, 'POST_LOCKED');
    }
    // Get user details
    const author = await buildCommunityUser(new mongoose_1.Types.ObjectId(userId));
    // Check if this is a lawyer answering
    let isLawyerAnswer = false;
    if (author.role === 'lawyer' && post.room === 'legal-advice') {
        isLawyerAnswer = true;
    }
    // Upload images
    const imageUrls = files ? await cloudinary_1.default.uploadMultipleFiles(files, 'community') : [];
    console.log(imageUrls);
    const comment = await Community_model_1.CommunityCommentModel.create({
        postId: new mongoose_1.Types.ObjectId(postId),
        content: input.content,
        author,
        images: imageUrls,
        likes: 0,
        likedBy: [],
        parentId: input.parentId ? new mongoose_1.Types.ObjectId(input.parentId) : null,
        replies: [],
        isLawyerAnswer,
        isAcceptedAnswer: false,
    });
    // Update post comment count and last activity
    await Community_model_1.CommunityPostModel.findByIdAndUpdate(postId, {
        $push: { comments: comment._id },
        $inc: { commentCount: 1 },
        $set: { lastActivityAt: new Date() }
    });
    // If this is a reply, update parent comment's replies array
    if (input.parentId) {
        await Community_model_1.CommunityCommentModel.findByIdAndUpdate(input.parentId, {
            $push: { replies: comment._id }
        });
    }
    // Notify post author about new comment (if not the commenter themselves)
    if (post.author.userId.toString() !== userId) {
        await notification_1.default.saveAndSendNotification({
            userId: post.author.userId.toString(),
            title: '💬 New Comment on Your Post',
            body: `${author.name} commented on "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}"`,
            type: 'comment_received',
            clickUrl: `/community/posts/${postId}`,
            priority: 'medium'
        }, 'user', { push_notification: true });
    }
    // If this is a legal advice post and a lawyer answered, notify the OP
    if (post.room === 'legal-advice' && isLawyerAnswer && post.author.userId.toString() !== userId) {
        await notification_1.default.saveAndSendNotification({
            userId: post.author.userId.toString(),
            title: '⚖️ Lawyer Responded to Your Legal Question',
            body: `A lawyer has responded to your legal question in "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}"`,
            type: 'lawyer_responded',
            clickUrl: `/community/posts/${postId}`,
            priority: 'high'
        }, 'user', { push_notification: true, email_notification: true });
    }
    // If this is a reply to a parent comment, notify the parent comment author
    if (input.parentId) {
        const parentComment = await Community_model_1.CommunityCommentModel.findById(input.parentId);
        if (parentComment && parentComment.author.userId.toString() !== userId) {
            await notification_1.default.saveAndSendNotification({
                userId: parentComment.author.userId.toString(),
                title: '💬 Reply to Your Comment',
                body: `${author.name} replied to your comment in "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}"`,
                type: 'reply_received',
                clickUrl: `/community/posts/${postId}`,
                priority: 'medium'
            }, 'user', { push_notification: true });
        }
    }
    return comment;
}
// POST /community/posts/:postId/like
async function toggleLikePost(postId, userId) {
    const post = await Community_model_1.CommunityPostModel.findById(postId);
    if (!post) {
        throw new error_1.AppError('Post not found', 404, 'POST_NOT_FOUND');
    }
    const userIdObj = new mongoose_1.Types.ObjectId(userId);
    const hasLiked = post.likedBy?.some((id) => id.equals(userIdObj));
    if (hasLiked) {
        // Unlike
        await Community_model_1.CommunityPostModel.findByIdAndUpdate(postId, {
            $pull: { likedBy: userIdObj },
            $inc: { likes: -1 }
        });
        return { liked: false, likes: post.likes - 1 };
    }
    else {
        // Like
        await Community_model_1.CommunityPostModel.findByIdAndUpdate(postId, {
            $push: { likedBy: userIdObj },
            $inc: { likes: 1 }
        });
        return { liked: true, likes: post.likes + 1 };
    }
}
// POST /community/posts/:postId/comments/:commentId/like
async function toggleLikeComment(postId, commentId, userId) {
    const comment = await Community_model_1.CommunityCommentModel.findById(commentId);
    if (!comment) {
        throw new error_1.AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }
    const userIdObj = new mongoose_1.Types.ObjectId(userId);
    const hasLiked = comment.likedBy?.some((id) => id.equals(userIdObj));
    if (hasLiked) {
        await Community_model_1.CommunityCommentModel.findByIdAndUpdate(commentId, {
            $pull: { likedBy: userIdObj },
            $inc: { likes: -1 }
        });
        return { liked: false, likes: comment.likes - 1 };
    }
    else {
        await Community_model_1.CommunityCommentModel.findByIdAndUpdate(commentId, {
            $push: { likedBy: userIdObj },
            $inc: { likes: 1 }
        });
        return { liked: true, likes: comment.likes + 1 };
    }
}
// POST /community/posts/:postId/comments/:commentId/accept (Admin/Lawyer)
async function acceptAnswer(postId, commentId, userId, adminCtx) {
    const post = await Community_model_1.CommunityPostModel.findById(postId);
    if (!post) {
        throw new error_1.AppError('Post not found', 404, 'POST_NOT_FOUND');
    }
    const user = await User_model_1.UserModel.findById(userId);
    const isAdmin = user?.role === 'admin' || adminCtx;
    const isOriginalPoster = post.author.userId.toString() === userId;
    if (!isAdmin && !isOriginalPoster) {
        throw new error_1.AppError('Only the post author or admin can accept answers', 403, 'PERMISSION_DENIED');
    }
    // Remove previously accepted answer
    await Community_model_1.CommunityCommentModel.updateMany({ postId: new mongoose_1.Types.ObjectId(postId), isAcceptedAnswer: true }, { $set: { isAcceptedAnswer: false } });
    // Accept new answer
    await Community_model_1.CommunityCommentModel.findByIdAndUpdate(commentId, { $set: { isAcceptedAnswer: true } });
    // Mark post as resolved
    await Community_model_1.CommunityPostModel.findByIdAndUpdate(postId, {
        $set: { isResolved: true, resolvedBy: new mongoose_1.Types.ObjectId(userId), resolvedAt: new Date() }
    });
    // Get the comment author to notify them
    const acceptedComment = await Community_model_1.CommunityCommentModel.findById(commentId);
    if (acceptedComment && acceptedComment.author.userId.toString() !== userId) {
        await notification_1.default.saveAndSendNotification({
            userId: acceptedComment.author.userId.toString(),
            title: '✅ Your Answer Was Accepted!',
            body: `Your answer to "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}" has been accepted as the solution.`,
            type: 'answer_accepted',
            clickUrl: `/community/posts/${postId}`,
            priority: 'high'
        }, 'user', { push_notification: true, email_notification: true });
    }
    // Notify OP that their post is resolved
    if (post.author.userId.toString() !== userId) {
        await notification_1.default.saveAndSendNotification({
            userId: post.author.userId.toString(),
            title: '✅ Your Question Has Been Resolved',
            body: `You have marked your question "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}" as resolved.`,
            type: 'post_resolved',
            clickUrl: `/community/posts/${postId}`,
            priority: 'medium'
        }, 'user', { push_notification: true });
    }
    return { message: 'Answer accepted successfully' };
}
// POST /community/posts/:postId/pin (Admin only)
async function pinPost(postId, adminCtx) {
    const post = await Community_model_1.CommunityPostModel.findById(postId);
    if (!post) {
        throw new error_1.AppError('Post not found', 404, 'POST_NOT_FOUND');
    }
    const newPinnedState = !post.isPinned;
    await Community_model_1.CommunityPostModel.findByIdAndUpdate(postId, { $set: { isPinned: newPinnedState } });
    // Notify post author about pinning
    if (newPinnedState) {
        await notification_1.default.saveAndSendNotification({
            userId: post.author.userId.toString(),
            title: '📌 Your Post Has Been Pinned',
            body: `Your post "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}" has been pinned by an admin.`,
            type: 'post_pinned',
            clickUrl: `/community/posts/${postId}`,
            priority: 'high'
        }, 'user', { push_notification: true });
    }
    return {
        message: newPinnedState ? 'Post pinned successfully' : 'Post unpinned successfully',
        isPinned: newPinnedState
    };
}
// POST /community/posts/:postId/lock (Admin/Moderator only)
async function lockPost(postId, adminCtx) {
    const post = await Community_model_1.CommunityPostModel.findById(postId);
    if (!post) {
        throw new error_1.AppError('Post not found', 404, 'POST_NOT_FOUND');
    }
    const newLockState = !post.isLocked;
    await Community_model_1.CommunityPostModel.findByIdAndUpdate(postId, { $set: { isLocked: newLockState } });
    // Notify post author about locking
    await notification_1.default.saveAndSendNotification({
        userId: post.author.userId.toString(),
        title: newLockState ? '🔒 Your Post Has Been Locked' : '🔓 Your Post Has Been Unlocked',
        body: newLockState
            ? `Your post "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}" has been locked. No new comments can be added.`
            : `Your post "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}" has been unlocked. Comments are now allowed.`,
        type: newLockState ? 'post_locked' : 'post_unlocked',
        clickUrl: `/community/posts/${postId}`,
        priority: 'medium'
    }, 'user', { push_notification: true });
    return {
        message: newLockState ? 'Post locked successfully' : 'Post unlocked successfully',
        isLocked: newLockState
    };
}
// POST /community/posts/:postId/resolve
async function resolvePost(postId, userId) {
    const post = await Community_model_1.CommunityPostModel.findById(postId);
    if (!post) {
        throw new error_1.AppError('Post not found', 404, 'POST_NOT_FOUND');
    }
    const isAuthor = post.author.userId.toString() === userId;
    if (!isAuthor) {
        throw new error_1.AppError('Only the post author can mark it as resolved', 403, 'PERMISSION_DENIED');
    }
    const newResolvedState = !post.isResolved;
    await Community_model_1.CommunityPostModel.findByIdAndUpdate(postId, {
        $set: {
            isResolved: newResolvedState,
            resolvedAt: newResolvedState ? new Date() : null,
            resolvedBy: newResolvedState ? new mongoose_1.Types.ObjectId(userId) : null
        }
    });
    return {
        message: newResolvedState ? 'Post marked as resolved' : 'Post reopened',
        isResolved: newResolvedState
    };
}
// GET /community/rooms
async function getRooms() {
    return Object.entries(community_types_1.COMMUNITY_ROOMS).map(([id, config]) => ({
        id,
        ...config,
    }));
}
// GET /community/reference/:type/:id
async function getPostsByReference(type, id) {
    const posts = await Community_model_1.CommunityPostModel.find({
        'reference.type': type,
        'reference.id': new mongoose_1.Types.ObjectId(id)
    })
        .sort({ createdAt: -1 })
        .lean();
    return posts;
}
//# sourceMappingURL=community.service.js.map