"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleLikeSubtopic = toggleLikeSubtopic;
exports.toggleCompleteSubtopic = toggleCompleteSubtopic;
exports.getSubtopicState = getSubtopicState;
exports.getSubtopicStatesBulk = getSubtopicStatesBulk;
exports.createBookmark = createBookmark;
exports.listBookmarksForSubtopic = listBookmarksForSubtopic;
exports.listMyBookmarks = listMyBookmarks;
exports.getBookmarkById = getBookmarkById;
exports.updateBookmark = updateBookmark;
exports.deleteBookmark = deleteBookmark;
const mongoose_1 = require("mongoose");
const Module_model_1 = require("../models/Module.model");
const SubtopicEngagement_model_1 = require("../models/SubtopicEngagement.model");
const User_model_1 = require("../models/User.model");
const error_1 = require("../middleware/error");
const notification_1 = __importDefault(require("../controllers/others/notification"));
async function loadSubtopicContext(subtopicId) {
    if (!mongoose_1.Types.ObjectId.isValid(subtopicId)) {
        throw new error_1.AppError('Invalid subtopic id.', 400, 'VALIDATION_ERROR');
    }
    const subtopic = await Module_model_1.SubTopicModel.findById(subtopicId);
    if (!subtopic) {
        throw new error_1.AppError('Subtopic not found.', 404, 'NOT_FOUND');
    }
    const [topic, module] = await Promise.all([
        Module_model_1.TopicModel.findById(subtopic.topicId),
        Module_model_1.ModuleModel.findById(subtopic.moduleId),
    ]);
    return { subtopic, topic, module };
}
async function recordActivity(params) {
    const user = await User_model_1.UserModel.findById(params.userId);
    if (!user)
        return;
    await Module_model_1.ActivityModel.create({
        userId: user._id,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Citizen',
        userInitials: `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`,
        action: params.action,
        targetTitle: params.targetTitle,
        targetType: 'subtopic',
        targetId: params.targetId,
        moduleId: params.moduleId,
    });
}
//  Like 
async function toggleLikeSubtopic(subtopicId, citizenId) {
    const { subtopic } = await loadSubtopicContext(subtopicId);
    let activity = await SubtopicEngagement_model_1.SubtopicActivityModel.findOne({
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
        subtopicId: subtopic._id,
    });
    const wasLiked = activity?.liked || false;
    const nowLiked = !wasLiked;
    if (activity) {
        activity.liked = nowLiked;
        activity.likedAt = nowLiked ? new Date() : undefined;
        await activity.save();
    }
    else {
        activity = await SubtopicEngagement_model_1.SubtopicActivityModel.create({
            citizenId: new mongoose_1.Types.ObjectId(citizenId),
            subtopicId: subtopic._id,
            topicId: subtopic.topicId,
            moduleId: subtopic.moduleId,
            liked: nowLiked,
            likedAt: nowLiked ? new Date() : undefined,
        });
    }
    subtopic.likesCount = Math.max(0, subtopic.likesCount + (nowLiked ? 1 : -1));
    await subtopic.save();
    // Notify when someone likes (only if liked, not unliked)
    if (nowLiked) {
        const topic = await Module_model_1.TopicModel.findById(subtopic.topicId);
        const module = await Module_model_1.ModuleModel.findById(subtopic.moduleId);
        await notification_1.default.saveAndSendNotification({
            userId: citizenId,
            title: '❤️ You Liked a Subtopic',
            body: `You liked "${subtopic.title}" from "${topic?.title || 'Topic'}" in "${module?.title || 'Module'}"`,
            type: 'subtopic_liked',
            clickUrl: `/learn/modules/${module?._id}/topics/${topic?._id}/subtopics/${subtopic._id}`,
            priority: 'low'
        }, 'user', { push_notification: true });
    }
    return {
        subtopicId: subtopic._id.toString(),
        liked: nowLiked,
        likesCount: subtopic.likesCount,
    };
}
//  Mark as complete 
async function toggleCompleteSubtopic(subtopicId, citizenId) {
    const { subtopic } = await loadSubtopicContext(subtopicId);
    let activity = await SubtopicEngagement_model_1.SubtopicActivityModel.findOne({
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
        subtopicId: subtopic._id,
    });
    const wasCompleted = activity?.completed || false;
    const nowCompleted = !wasCompleted;
    console.log({ wasCompleted, nowCompleted, activity });
    if (activity) {
        activity.completed = nowCompleted;
        activity.completedAt = nowCompleted ? new Date() : undefined;
        await activity.save();
    }
    else {
        activity = await SubtopicEngagement_model_1.SubtopicActivityModel.create({
            citizenId: new mongoose_1.Types.ObjectId(citizenId),
            subtopicId: subtopic._id,
            topicId: subtopic.topicId,
            moduleId: subtopic.moduleId,
            completed: nowCompleted,
            completedAt: nowCompleted ? new Date() : undefined,
        });
    }
    subtopic.completedBy = Math.max(0, subtopic.completedBy + (nowCompleted ? 1 : -1));
    await subtopic.save();
    // Notify on completion
    if (nowCompleted) {
        const topic = await Module_model_1.TopicModel.findById(subtopic.topicId);
        const module = await Module_model_1.ModuleModel.findById(subtopic.moduleId);
        // Get all subtopics in this topic to check if topic is complete
        const allSubtopics = await Module_model_1.SubTopicModel.find({ topicId: subtopic.topicId });
        const userActivities = await SubtopicEngagement_model_1.SubtopicActivityModel.find({
            citizenId: new mongoose_1.Types.ObjectId(citizenId),
            subtopicId: { $in: allSubtopics.map(st => st._id) },
            completed: true,
        });
        const isTopicComplete = allSubtopics.length > 0 && userActivities.length === allSubtopics.length;
        await notification_1.default.saveAndSendNotification({
            userId: citizenId,
            title: isTopicComplete ? '🎉 Topic Complete!' : '✅ Subtopic Completed',
            body: isTopicComplete
                ? `You've completed all subtopics in "${topic?.title || 'Topic'}"! Great job!`
                : `You completed "${subtopic.title}" from "${topic?.title || 'Topic'}"`,
            type: isTopicComplete ? 'topic_completed' : 'subtopic_completed',
            clickUrl: `/learn/modules/${module?._id}/topics/${topic?._id}`,
            priority: isTopicComplete ? 'high' : 'medium'
        }, 'user', { push_notification: true });
    }
    return {
        subtopicId: subtopic._id.toString(),
        completed: nowCompleted,
        completedBy: subtopic.completedBy,
    };
}
//  Per-citizen state (used to enrich subtopic listings) 
// subtopic.service.ts - Updated getSubtopicState function
async function getSubtopicState(subtopicId, citizenId) {
    const subtopic = await Module_model_1.SubTopicModel.findById(subtopicId);
    if (!subtopic) {
        throw new error_1.AppError('Subtopic not found.', 404, 'NOT_FOUND');
    }
    const topic = await Module_model_1.TopicModel.findById(subtopic.topicId);
    if (!topic) {
        throw new error_1.AppError('Topic not found.', 404, 'NOT_FOUND');
    }
    const allSubtopics = await Module_model_1.SubTopicModel.find({
        topicId: subtopic.topicId
    }).sort({ order: 1 });
    // Get user's activity for all subtopics in this topic
    let userActivities = [];
    let userActivity = null;
    if (citizenId) {
        const subtopicIds = allSubtopics.map(st => st._id);
        userActivities = await SubtopicEngagement_model_1.SubtopicActivityModel.find({
            citizenId: new mongoose_1.Types.ObjectId(citizenId),
            subtopicId: { $in: subtopicIds },
        });
        // Get the specific activity for the requested subtopic
        userActivity = userActivities.find((act) => act.subtopicId.toString() === subtopicId);
    }
    // Calculate total likes count for this subtopic
    const totalLikes = await SubtopicEngagement_model_1.SubtopicActivityModel.countDocuments({
        subtopicId: new mongoose_1.Types.ObjectId(subtopicId),
        liked: true,
    });
    // Calculate total completed count for this subtopic
    const totalCompleted = await SubtopicEngagement_model_1.SubtopicActivityModel.countDocuments({
        subtopicId: new mongoose_1.Types.ObjectId(subtopicId),
        completed: true,
    });
    // Build the completed subtopics list
    const completedSubtopicIds = userActivities
        .filter(act => act.completed === true)
        .map(act => act.subtopicId.toString());
    // Get completion status for each subtopic
    const subtopicsWithStatus = allSubtopics.map(st => {
        const userActivityForSubtopic = userActivities.find((act) => act.subtopicId.toString() === st._id.toString());
        return {
            id: st._id.toString(),
            title: st.title,
            order: st.order,
            duration: st.duration,
            completed: userActivityForSubtopic?.completed || false,
            liked: userActivityForSubtopic?.liked || false,
        };
    });
    // Calculate topic progress percentage
    const totalSubtopics = allSubtopics.length;
    const completedCount = completedSubtopicIds.length;
    const progressPercent = totalSubtopics > 0
        ? Math.round((completedCount / totalSubtopics) * 100)
        : 0;
    // Get current subtopic details with counts
    const currentSubtopic = {
        id: subtopic._id.toString(),
        title: subtopic.title,
        order: subtopic.order,
        likesCount: totalLikes,
        completedBy: totalCompleted,
        liked: userActivity?.liked || false,
        completed: userActivity?.completed || false,
    };
    // Get topic details
    const topicDetails = {
        id: topic._id.toString(),
        title: topic.title,
        totalSubtopics: totalSubtopics,
        completedSubtopics: completedCount,
        progressPercent: progressPercent,
        completedSubtopicIds: completedSubtopicIds,
        subtopics: subtopicsWithStatus,
    };
    return {
        currentSubtopic,
        topic: topicDetails,
    };
}
// Batch version — used when rendering a list of subtopics for one citizen
async function getSubtopicStatesBulk(subtopicIds, citizenId) {
    const map = new Map();
    if (!citizenId || subtopicIds.length === 0)
        return map;
    const activities = await SubtopicEngagement_model_1.SubtopicActivityModel.find({
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
        subtopicId: { $in: subtopicIds },
    });
    for (const activity of activities) {
        map.set(activity.subtopicId.toString(), {
            liked: activity.liked,
            completed: activity.completed,
        });
    }
    return map;
}
function toBookmarkDto(doc) {
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
        id: String(obj._id),
        subtopicId: String(obj.subtopicId),
        topicId: String(obj.topicId),
        moduleId: String(obj.moduleId),
        subtopicTitle: obj.subtopicTitle,
        topicTitle: obj.topicTitle,
        moduleTitle: obj.moduleTitle,
        highlightedText: obj.highlightedText,
        comment: obj.comment,
        startOffset: obj.startOffset,
        endOffset: obj.endOffset,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
    };
}
async function createBookmark(input) {
    const { subtopicId, citizenId, highlightedText, comment, url, startOffset, endOffset } = input;
    if (!highlightedText?.trim()) {
        throw new error_1.AppError('highlightedText is required.', 400, 'VALIDATION_ERROR');
    }
    const { subtopic, topic, module } = await loadSubtopicContext(subtopicId);
    const bookmark = await SubtopicEngagement_model_1.SubtopicBookmarkModel.create({
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
        subtopicId: subtopic._id,
        topicId: subtopic.topicId,
        moduleId: subtopic.moduleId,
        url,
        subtopicTitle: subtopic.title,
        topicTitle: topic?.title || '',
        moduleTitle: module?.title || '',
        highlightedText: highlightedText.trim(),
        comment: comment?.trim() || '',
        startOffset,
        endOffset,
    });
    // Notify user of bookmark creation
    await notification_1.default.saveAndSendNotification({
        userId: citizenId,
        title: '🔖 Bookmark Created',
        body: `You bookmarked "${highlightedText.substring(0, 50)}${highlightedText.length > 50 ? '...' : ''}" from "${subtopic.title}"`,
        type: 'bookmark_created',
        clickUrl: `/learn/subtopics/${subtopicId}/bookmarks`,
        priority: 'low'
    }, 'user', { push_notification: true });
    return toBookmarkDto(bookmark);
}
async function listBookmarksForSubtopic(subtopicId, citizenId) {
    let filter = { citizenId: new mongoose_1.Types.ObjectId(citizenId), };
    if (mongoose_1.Types.ObjectId.isValid(subtopicId)) {
        filter = {
            ...filter,
            subtopicId: new mongoose_1.Types.ObjectId(subtopicId),
        };
    }
    const bookmarks = await SubtopicEngagement_model_1.SubtopicBookmarkModel.find(filter).sort({ createdAt: -1 });
    return bookmarks.map(toBookmarkDto);
}
async function listMyBookmarks(params) {
    const { citizenId, moduleId, topicId, page = 1, pageSize = 20 } = params;
    const filter = { citizenId: new mongoose_1.Types.ObjectId(citizenId) };
    if (moduleId)
        filter.moduleId = new mongoose_1.Types.ObjectId(moduleId);
    if (topicId)
        filter.topicId = new mongoose_1.Types.ObjectId(topicId);
    const skip = (page - 1) * pageSize;
    const [bookmarks, total] = await Promise.all([
        SubtopicEngagement_model_1.SubtopicBookmarkModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
        SubtopicEngagement_model_1.SubtopicBookmarkModel.countDocuments(filter),
    ]);
    return {
        data: bookmarks.map(toBookmarkDto),
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
    };
}
async function getBookmarkById(bookmarkId, citizenId) {
    if (!mongoose_1.Types.ObjectId.isValid(bookmarkId)) {
        throw new error_1.AppError('Invalid bookmark id.', 400, 'VALIDATION_ERROR');
    }
    const bookmark = await SubtopicEngagement_model_1.SubtopicBookmarkModel.findOne({
        _id: bookmarkId,
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
    });
    if (!bookmark) {
        throw new error_1.AppError('Bookmark not found.', 404, 'NOT_FOUND');
    }
    return toBookmarkDto(bookmark);
}
async function updateBookmark(bookmarkId, citizenId, input) {
    if (!mongoose_1.Types.ObjectId.isValid(bookmarkId)) {
        throw new error_1.AppError('Invalid bookmark id.', 400, 'VALIDATION_ERROR');
    }
    const bookmark = await SubtopicEngagement_model_1.SubtopicBookmarkModel.findOne({
        _id: bookmarkId,
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
    });
    if (!bookmark) {
        throw new error_1.AppError('Bookmark not found.', 404, 'NOT_FOUND');
    }
    if (input.highlightedText !== undefined)
        bookmark.highlightedText = input.highlightedText.trim();
    if (input.comment !== undefined)
        bookmark.comment = input.comment.trim();
    if (input.startOffset !== undefined)
        bookmark.startOffset = input.startOffset;
    if (input.endOffset !== undefined)
        bookmark.endOffset = input.endOffset;
    await bookmark.save();
    return toBookmarkDto(bookmark);
}
async function deleteBookmark(bookmarkId, citizenId) {
    if (!mongoose_1.Types.ObjectId.isValid(bookmarkId)) {
        throw new error_1.AppError('Invalid bookmark id.', 400, 'VALIDATION_ERROR');
    }
    const result = await SubtopicEngagement_model_1.SubtopicBookmarkModel.findOneAndDelete({
        _id: bookmarkId,
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
    });
    if (!result) {
        throw new error_1.AppError('Bookmark not found.', 404, 'NOT_FOUND');
    }
    // Notify user of bookmark deletion
    await notification_1.default.saveAndSendNotification({
        userId: citizenId,
        title: '🗑️ Bookmark Removed',
        body: `Your bookmark from "${result.subtopicTitle}" has been removed.`,
        type: 'bookmark_deleted',
        clickUrl: `/learn/subtopics/${result.subtopicId}/bookmarks`,
        priority: 'low'
    }, 'user', { push_notification: true });
}
//# sourceMappingURL=subtopic.service.js.map