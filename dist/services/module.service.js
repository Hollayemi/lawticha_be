"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listModules = listModules;
exports.getModuleStats = getModuleStats;
exports.getDailyStats = getDailyStats;
exports.getModuleById = getModuleById;
exports.createModule = createModule;
exports.updateModule = updateModule;
exports.deleteModule = deleteModule;
exports.listTopics = listTopics;
exports.getTopicById = getTopicById;
exports.createTopic = createTopic;
exports.updateTopic = updateTopic;
exports.deleteTopic = deleteTopic;
exports.reorderTopics = reorderTopics;
exports.listSubTopics = listSubTopics;
exports.createSubTopic = createSubTopic;
exports.updateSubTopic = updateSubTopic;
exports.updateSubTopicNotes = updateSubTopicNotes;
exports.deleteSubTopic = deleteSubTopic;
exports.reorderSubTopics = reorderSubTopics;
exports.getModuleActivity = getModuleActivity;
exports.getModuleAnalytics = getModuleAnalytics;
exports.getTopicAnalytics = getTopicAnalytics;
exports.getModuleLearners = getModuleLearners;
exports.getTopLearners = getTopLearners;
exports.getComments = getComments;
exports.resolveComment = resolveComment;
exports.deleteComment = deleteComment;
const mongoose_1 = require("mongoose");
const Module_model_1 = require("../models/Module.model");
const Enrollment_model_1 = require("../models/Enrollment.model");
const User_model_1 = require("../models/User.model");
const error_1 = require("../middleware/error");
const functions_1 = require("../utils/functions");
const formatReturn_1 = require("../helpers/formatReturn");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
async function listModules(filters = {}) {
    const { status, category, search, page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc', } = filters;
    const filter = {};
    if (status && status !== 'all')
        filter.status = status;
    if (category && category !== 'all')
        filter.category = category;
    if (search?.trim()) {
        filter.$text = { $search: search.trim() };
    }
    const skip = (page - 1) * pageSize;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [docs, total] = await Promise.all([
        Module_model_1.ModuleModel.find(filter).sort(sort).skip(skip).limit(pageSize),
        Module_model_1.ModuleModel.countDocuments(filter),
    ]);
    return {
        data: docs.map(formatReturn_1.toModuleDto),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
async function getModuleStats() {
    const [totalModules, topicAgg, enrollAgg] = await Promise.all([
        Module_model_1.ModuleModel.countDocuments(),
        Module_model_1.TopicModel.countDocuments(),
        Module_model_1.ModuleModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalEnrolled: { $sum: '$enrolledCount' },
                    avgCompletion: { $avg: '$completionRate' },
                },
            },
        ]),
    ]);
    return {
        totalModules,
        totalTopics: topicAgg,
        totalEnrolled: enrollAgg[0]?.totalEnrolled ?? 0,
        avgCompletion: enrollAgg[0]?.avgCompletion
            ? Math.round(enrollAgg[0].avgCompletion)
            : 0,
    };
}
async function getDailyStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
    const [todayActivity, yesterdayActivity] = await Promise.all([
        Module_model_1.ActivityModel.countDocuments({ createdAt: { $gte: startOfToday } }),
        Module_model_1.ActivityModel.countDocuments({
            createdAt: { $gte: startOfYesterday, $lt: startOfToday },
        }),
    ]);
    const todayEnrolled = await Module_model_1.ActivityModel.countDocuments({
        action: 'enrolled',
        createdAt: { $gte: startOfToday },
    });
    const yesterdayEnrolled = await Module_model_1.ActivityModel.countDocuments({
        action: 'enrolled',
        createdAt: { $gte: startOfYesterday, $lt: startOfToday },
    });
    const todayCompleted = await Module_model_1.ActivityModel.countDocuments({
        action: 'completed',
        createdAt: { $gte: startOfToday },
    });
    const yesterdayCompleted = await Module_model_1.ActivityModel.countDocuments({
        action: 'completed',
        createdAt: { $gte: startOfYesterday, $lt: startOfToday },
    });
    const pct = (a, b) => b === 0 ? (a > 0 ? 100 : 0) : Math.round(((a - b) / b) * 100);
    return {
        lessonsWatchedToday: todayActivity,
        lessonsWatchedChange: pct(todayActivity, yesterdayActivity),
        newEnrolmentsToday: todayEnrolled,
        newEnrolmentsChange: pct(todayEnrolled, yesterdayEnrolled),
        completionsToday: todayCompleted,
        completionsChange: pct(todayCompleted, yesterdayCompleted),
        avgSessionDurationMinutes: 12, // placeholder – wire real session data when available
        avgSessionDurationChange: 0,
    };
}
async function getModuleById(id) {
    const doc = await Module_model_1.ModuleModel.findById(id);
    if (!doc)
        throw new error_1.AppError('Module not found.', 404, 'NOT_FOUND');
    return (0, formatReturn_1.toModuleDto)(doc);
}
async function createModule(input) {
    let instructorName = 'Instructor';
    let instructorInitials = 'IN';
    let instructorColor = (0, functions_1.colorFromString)(input.instructorId);
    try {
        const user = await User_model_1.UserModel.findById(input.instructorId);
        if (user) {
            instructorName = `${user.firstName} ${user.lastName}`.trim();
            instructorInitials = (user.firstName[0] ?? '') + (user.lastName[0] ?? '');
            instructorColor = (0, functions_1.colorFromString)(instructorName);
        }
        77;
    }
    catch { /* silently ignore – instructor fields are denorm */ }
    console.log({ input });
    const thumbnail = input.thumbnailUrl || input.thumbnailFile && await (await cloudinary_1.default.uploadFile(input.thumbnailFile, "book/modules")).url;
    console.log({ thumbnail, file: input.thumbnailFile });
    if (!thumbnail)
        throw (new error_1.AppError('Upload at least one cover File', 400, 'VALIDATION_ERROR'));
    const doc = await Module_model_1.ModuleModel.create({
        title: input.title,
        slug: (0, functions_1.generateSlug)(input.title),
        category: input.category,
        description: input.description,
        instructorId: new mongoose_1.Types.ObjectId(input.instructorId),
        instructor: instructorName,
        instructorInitials: instructorInitials.toUpperCase(),
        instructorColor,
        thumbnail: thumbnail,
        status: input.status ?? 'pending',
    });
    return (0, formatReturn_1.toModuleDto)(doc);
}
async function updateModule(id, input) {
    const doc = await Module_model_1.ModuleModel.findById(id);
    if (!doc)
        throw new error_1.AppError('Module not found.', 404, 'NOT_FOUND');
    const updates = {};
    if (input.title !== undefined) {
        updates.title = input.title;
        updates.slug = (0, functions_1.generateSlug)(input.title);
    }
    if (input.category !== undefined)
        updates.category = input.category;
    if (input.description !== undefined)
        updates.description = input.description;
    if (input.status !== undefined)
        updates.status = input.status;
    if (input.trending !== undefined)
        updates.trending = input.trending;
    if (input.thumbnailUrl !== undefined)
        updates.thumbnail = input.thumbnailUrl;
    if (input.instructorId) {
        try {
            const user = await User_model_1.UserModel.findById(input.instructorId);
            if (user) {
                updates.instructor = `${user.firstName} ${user.lastName}`.trim();
                updates.instructorInitials = ((user.firstName[0] ?? '') + (user.lastName[0] ?? '')).toUpperCase();
                updates.instructorColor = (0, functions_1.colorFromString)(updates.instructor);
            }
        }
        catch { /* silently ignore */ }
        updates.instructorId = new mongoose_1.Types.ObjectId(input.instructorId);
    }
    const updated = await Module_model_1.ModuleModel.findByIdAndUpdate(id, updates, { new: true });
    return (0, formatReturn_1.toModuleDto)(updated);
}
async function deleteModule(id) {
    const doc = await Module_model_1.ModuleModel.findById(id);
    if (!doc)
        throw new error_1.AppError('Module not found.', 404, 'NOT_FOUND');
    // Cascade delete topics, subtopics, activity, comments
    const topics = await Module_model_1.TopicModel.find({ moduleId: id }, { _id: 1 });
    const topicIds = topics.map((t) => t._id);
    await Promise.all([
        Module_model_1.SubTopicModel.deleteMany({ moduleId: id }),
        Module_model_1.CommentModel.deleteMany({ moduleId: id }),
        Module_model_1.ActivityModel.deleteMany({ moduleId: id }),
        Module_model_1.TopicModel.deleteMany({ moduleId: id }),
        Module_model_1.ModuleModel.findByIdAndDelete(id),
    ]);
}
//  TOPIC CRUD 
async function listTopics(moduleId, status) {
    const filter = {};
    if (status)
        filter.status = status;
    const topics = await Module_model_1.TopicModel.find({ moduleId, ...filter }).sort({ order: 1 });
    const topicIds = topics.map((t) => t._id);
    const subtopics = await Module_model_1.SubTopicModel.find({
        moduleId,
        topicId: { $in: topicIds },
    }).sort({ order: 1 });
    // Group subtopics by topicId
    const subtopicsMap = new Map();
    for (const subtopic of subtopics) {
        const key = subtopic.topicId.toString();
        if (!subtopicsMap.has(key)) {
            subtopicsMap.set(key, []);
        }
        subtopicsMap.get(key).push((0, formatReturn_1.toSubTopicDto)(subtopic));
    }
    return topics.map((topic) => ({
        ...(0, formatReturn_1.toTopicDto)(topic),
        subtopics: subtopicsMap.get(topic._id.toString()) || [],
    }));
}
async function getTopicById(moduleId, topicId) {
    const topic = await Module_model_1.TopicModel.findOne({ _id: topicId, moduleId });
    if (!topic)
        throw new error_1.AppError('Topic not found.', 404, 'NOT_FOUND');
    const subtopics = await Module_model_1.SubTopicModel.find({ topicId, moduleId }).sort({ order: 1 });
    console.log(subtopics);
    return {
        ...(0, formatReturn_1.toTopicDto)(topic),
        subtopics: subtopics.map(formatReturn_1.toSubTopicDto),
    };
}
async function createTopic(input) {
    const module = await Module_model_1.ModuleModel.findById(input.moduleId);
    if (!module)
        throw new error_1.AppError('Module not found.', 404, 'NOT_FOUND');
    // Default order = last + 1
    let order = input.order;
    if (order === undefined) {
        const last = await Module_model_1.TopicModel.findOne({ moduleId: input.moduleId }).sort({ order: -1 });
        order = (last?.order ?? 0) + 1;
    }
    const doc = await Module_model_1.TopicModel.create({
        moduleId: new mongoose_1.Types.ObjectId(input.moduleId),
        title: input.title,
        slug: (0, functions_1.generateSlug)(input.title),
        classification: input.classification,
        overview: input.overview,
        status: input.status ?? 'draft',
        order,
        videoType: input.videoType ?? null,
        videoUrl: input.videoUrl ?? '',
        thumbnailUrl: input.thumbnailUrl ?? '',
        tags: input.tags ?? [],
    });
    // Increment topicCount on module
    await Module_model_1.ModuleModel.findByIdAndUpdate(input.moduleId, { $inc: { topicCount: 1 } });
    return (0, formatReturn_1.toTopicDto)(doc);
}
async function updateTopic(moduleId, topicId, input) {
    const topic = await Module_model_1.TopicModel.findOne({ _id: topicId, moduleId });
    if (!topic)
        throw new error_1.AppError('Topic not found.', 404, 'NOT_FOUND');
    const updates = {};
    if (input.title !== undefined) {
        updates.title = input.title;
        updates.slug = (0, functions_1.generateSlug)(input.title);
    }
    if (input.classification !== undefined)
        updates.classification = input.classification;
    if (input.overview !== undefined)
        updates.overview = input.overview;
    if (input.status !== undefined)
        updates.status = input.status;
    if (input.order !== undefined)
        updates.order = input.order;
    if (input.videoType !== undefined)
        updates.videoType = input.videoType;
    if (input.videoUrl !== undefined)
        updates.videoUrl = input.videoUrl;
    if (input.thumbnailUrl !== undefined)
        updates.thumbnailUrl = input.thumbnailUrl;
    if (input.tags !== undefined)
        updates.tags = input.tags;
    const updated = await Module_model_1.TopicModel.findByIdAndUpdate(topicId, updates, { new: true });
    return (0, formatReturn_1.toTopicDto)(updated);
}
async function deleteTopic(moduleId, topicId) {
    const topic = await Module_model_1.TopicModel.findOne({ _id: topicId, moduleId });
    if (!topic)
        throw new error_1.AppError('Topic not found.', 404, 'NOT_FOUND');
    await Promise.all([
        Module_model_1.SubTopicModel.deleteMany({ topicId }),
        Module_model_1.CommentModel.deleteMany({ topicId }),
        Module_model_1.TopicModel.findByIdAndDelete(topicId),
    ]);
    // Decrement topicCount and re-order remaining topics
    await Module_model_1.ModuleModel.findByIdAndUpdate(moduleId, { $inc: { topicCount: -1 } });
    const remaining = await Module_model_1.TopicModel.find({ moduleId }).sort({ order: 1 });
    await Promise.all(remaining.map((t, i) => Module_model_1.TopicModel.findByIdAndUpdate(t._id, { order: i + 1 })));
}
async function reorderTopics(moduleId, orderedIds) {
    const ops = orderedIds.map((id, i) => Module_model_1.TopicModel.findOneAndUpdate({ _id: id, moduleId }, { order: i + 1 }));
    await Promise.all(ops);
}
//  SUBTOPIC CRUD 
async function listSubTopics(moduleId, topicId) {
    const docs = await Module_model_1.SubTopicModel.find({ topicId, moduleId }).sort({ order: 1 });
    return docs.map(formatReturn_1.toSubTopicDto);
}
async function createSubTopic(input) {
    const topic = await Module_model_1.TopicModel.findOne({ _id: input.topicId, moduleId: input.moduleId });
    if (!topic)
        throw new error_1.AppError('Topic not found.', 404, 'NOT_FOUND');
    let order = input.order;
    if (order === undefined) {
        const last = await Module_model_1.SubTopicModel.findOne({ topicId: input.topicId }).sort({ order: -1 });
        order = (last?.order ?? 0) + 1;
    }
    const doc = await Module_model_1.SubTopicModel.create({
        topicId: new mongoose_1.Types.ObjectId(input.topicId),
        moduleId: new mongoose_1.Types.ObjectId(input.moduleId),
        title: input.title,
        slug: (0, functions_1.generateSlug)(input.title),
        notes: input.notes ?? '',
        duration: input.duration ?? '0:00',
        order,
    });
    // Increment subtopicCount on topic
    await Module_model_1.TopicModel.findByIdAndUpdate(input.topicId, { $inc: { subtopicCount: 1 } });
    return (0, formatReturn_1.toSubTopicDto)(doc);
}
async function updateSubTopic(moduleId, topicId, subtopicId, input) {
    const doc = await Module_model_1.SubTopicModel.findOne({ _id: subtopicId, topicId, moduleId });
    if (!doc)
        throw new error_1.AppError('SubTopic not found.', 404, 'NOT_FOUND');
    const updates = {};
    if (input.title !== undefined) {
        updates.title = input.title;
        updates.slug = (0, functions_1.generateSlug)(input.title);
    }
    if (input.notes !== undefined)
        updates.notes = input.notes;
    if (input.duration !== undefined)
        updates.duration = input.duration;
    if (input.order !== undefined)
        updates.order = input.order;
    const updated = await Module_model_1.SubTopicModel.findByIdAndUpdate(subtopicId, updates, { new: true });
    return (0, formatReturn_1.toSubTopicDto)(updated);
}
async function updateSubTopicNotes(moduleId, topicId, subtopicId, notes) {
    const doc = await Module_model_1.SubTopicModel.findOne({ _id: subtopicId, topicId, moduleId });
    if (!doc)
        throw new error_1.AppError('SubTopic not found.', 404, 'NOT_FOUND');
    const updated = await Module_model_1.SubTopicModel.findByIdAndUpdate(subtopicId, { notes }, { new: true });
    return {
        id: String(updated._id),
        notes: updated.notes,
        updatedAt: updated.updatedAt,
    };
}
async function deleteSubTopic(moduleId, topicId, subtopicId) {
    const doc = await Module_model_1.SubTopicModel.findOne({ _id: subtopicId, topicId, moduleId });
    if (!doc)
        throw new error_1.AppError('SubTopic not found.', 404, 'NOT_FOUND');
    await Module_model_1.SubTopicModel.findByIdAndDelete(subtopicId);
    await Module_model_1.TopicModel.findByIdAndUpdate(topicId, { $inc: { subtopicCount: -1 } });
    const remaining = await Module_model_1.SubTopicModel.find({ topicId }).sort({ order: 1 });
    await Promise.all(remaining.map((s, i) => Module_model_1.SubTopicModel.findByIdAndUpdate(s._id, { order: i + 1 })));
}
async function reorderSubTopics(moduleId, topicId, orderedIds) {
    const ops = orderedIds.map((id, i) => Module_model_1.SubTopicModel.findOneAndUpdate({ _id: id, topicId, moduleId }, { order: i + 1 }));
    await Promise.all(ops);
}
async function getModuleActivity(moduleId, limit = 20, before) {
    const filter = { moduleId };
    if (before)
        filter.createdAt = { $lt: new Date(before) };
    const docs = await Module_model_1.ActivityModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit);
    return docs.map((d) => {
        const obj = d.toObject();
        return {
            id: String(obj._id),
            userId: String(obj.userId),
            userName: obj.userName,
            userInitials: obj.userInitials,
            userColor: obj.userColor,
            action: obj.action,
            targetTitle: obj.targetTitle,
            targetType: obj.targetType,
            targetId: String(obj.targetId),
            moduleId: String(obj.moduleId),
            createdAt: obj.createdAt,
        };
    });
}
//  ANALYTICS 
async function getModuleAnalytics(moduleId) {
    const module = await Module_model_1.ModuleModel.findById(moduleId);
    if (!module)
        throw new error_1.AppError('Module not found.', 404, 'NOT_FOUND');
    const topics = await Module_model_1.TopicModel.find({ moduleId }).sort({ order: 1 });
    // Progress distribution buckets from real enrollment data
    let progressDistribution = [
        { label: 'Not started', count: 0, percentage: 0, color: '#E5E7EB' },
        { label: 'In progress', count: 0, percentage: 0, color: '#F59E0B' },
        { label: 'Completed', count: 0, percentage: 0, color: '#10B981' },
    ];
    try {
        const mId = new mongoose_1.Types.ObjectId(moduleId);
        const enrollments = await Enrollment_model_1.EnrollmentModel.find({ moduleId: mId });
        const total = enrollments.length;
        if (total > 0) {
            const notStarted = enrollments.filter((e) => e.progressPercent === 0).length;
            const inProgress = enrollments.filter((e) => e.progressPercent > 0 && e.progressPercent < 100).length;
            const completed = enrollments.filter((e) => e.progressPercent >= 100).length;
            progressDistribution = [
                { label: 'Not started', count: notStarted, percentage: Math.round((notStarted / total) * 100), color: '#E5E7EB' },
                { label: 'In progress', count: inProgress, percentage: Math.round((inProgress / total) * 100), color: '#F59E0B' },
                { label: 'Completed', count: completed, percentage: Math.round((completed / total) * 100), color: '#10B981' },
            ];
        }
    }
    catch { /* enrollment model may not exist yet */ }
    const topicPerformance = topics.map((t) => ({
        topicId: String(t._id),
        title: t.title,
        classification: t.classification,
        order: t.order,
        watchCount: t.watchCount,
        completionRate: t.completionRate,
        likes: t.likes,
        comments: t.comments,
        status: t.status,
        duration: t.duration,
    }));
    return {
        moduleId: moduleId,
        enrolledCount: module.enrolledCount,
        completionRate: module.completionRate,
        avgRating: module.avgRating,
        totalWatchTimeHours: module.totalWatchTimeHours,
        progressDistribution,
        topicPerformance,
        updatedAt: module.updatedAt,
    };
}
async function getTopicAnalytics(moduleId, topicId) {
    const topic = await Module_model_1.TopicModel.findOne({ _id: topicId, moduleId });
    if (!topic)
        throw new error_1.AppError('Topic not found.', 404, 'NOT_FOUND');
    const subtopics = await Module_model_1.SubTopicModel.find({ topicId, moduleId }).sort({ order: 1 });
    // Build last 7 days of daily views
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const dailyViews = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        return {
            day: days[d.getDay()],
            date: d.toISOString().split('T')[0],
            views: 0, // real: aggregate from activity
        };
    });
    // Sub-topic completion rows
    const subtopicCompletion = subtopics.map((s, i) => ({
        subtopicId: String(s._id),
        title: s.title,
        order: s.order,
        viewCount: s.viewCount,
        completedBy: s.completedBy,
        dropOffPercentage: i === 0 ? 0 : (subtopics[0].viewCount > 0
            ? Math.round((1 - s.viewCount / subtopics[0].viewCount) * 100)
            : 0),
    }));
    const likeRate = topic.watchCount > 0 ? +((topic.likes / topic.watchCount) * 100).toFixed(1) : 0;
    const commentRate = topic.watchCount > 0 ? +((topic.comments / topic.watchCount) * 100).toFixed(1) : 0;
    return {
        topicId: topicId,
        watchCount: topic.watchCount,
        completionRate: topic.completionRate,
        likes: topic.likes,
        comments: topic.comments,
        avgWatchDurationSeconds: topic.durationSeconds * (topic.completionRate / 100) || 0,
        likeRate,
        commentRate,
        dailyViews,
        subtopicCompletion,
        topStates: [], // wire to real geodata when available
        weeklyEngagement: [
            { label: 'Watch time', value: `${topic.durationSeconds}s`, trend: '0%', up: true },
            { label: 'Like rate', value: `${likeRate}%`, trend: '0%', up: true },
            { label: 'Comment rate', value: `${commentRate}%`, trend: '0%', up: true },
        ],
        updatedAt: topic.updatedAt,
    };
}
async function getModuleLearners(params) {
    const { moduleId, page = 1, pageSize = 20, search, sortBy = 'enrolledAt', sortOrder = 'desc', } = params;
    const enrollFilter = {
        moduleId: new mongoose_1.Types.ObjectId(moduleId),
    };
    const skip = (page - 1) * pageSize;
    const sortField = sortBy === 'progress' ? 'progressPercent' : sortBy === 'lastActiveAt' ? 'lastActivityAt' : 'startedAt';
    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };
    let enrollments;
    let total;
    try {
        [enrollments, total] = await Promise.all([
            Enrollment_model_1.EnrollmentModel.find(enrollFilter)
                .sort(sort)
                .skip(skip)
                .limit(pageSize)
                .populate('citizenId', 'firstName lastName email'),
            Enrollment_model_1.EnrollmentModel.countDocuments(enrollFilter),
        ]);
    }
    catch {
        return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    const module = await Module_model_1.ModuleModel.findById(moduleId);
    const totalTopics = module?.topicCount ?? 0;
    const data = enrollments.map((e) => {
        const user = e.citizenId;
        const name = user
            ? `${user.firstName} ${user.lastName}`.trim()
            : 'Unknown';
        const initials = name
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? '')
            .join('');
        return {
            id: String(e._id),
            name,
            initials,
            color: (0, functions_1.colorFromString)(name),
            email: user?.email ?? '',
            state: '',
            enrolledAt: e.startedAt,
            progressPercentage: e.progressPercent,
            topicsCompleted: e.lessonsCompleted?.length ?? 0,
            totalTopics,
            lastActiveAt: e.lastActivityAt,
        };
    });
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
async function getTopLearners(moduleId, limit = 5) {
    let enrollments = [];
    try {
        enrollments = await Enrollment_model_1.EnrollmentModel.find({
            moduleId: new mongoose_1.Types.ObjectId(moduleId),
        })
            .sort({ progressPercent: -1 })
            .limit(limit)
            .populate('citizenId', 'firstName lastName');
    }
    catch {
        return [];
    }
    return enrollments.map((e) => {
        const user = e.citizenId;
        const name = user
            ? `${user.firstName} ${user.lastName}`.trim()
            : 'Unknown';
        const initials = name
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? '')
            .join('');
        return {
            id: String(e._id),
            name,
            initials,
            color: (0, functions_1.colorFromString)(name),
            progressPercentage: e.progressPercent,
            topicsCompleted: e.lessonsCompleted?.length ?? 0,
            certificateEarned: e.status === 'complete',
        };
    });
}
//  COMMENTS 
async function getComments(moduleId, topicId, resolved) {
    const filter = {
        moduleId,
        topicId,
        parentId: null,
    };
    if (resolved !== undefined)
        filter.resolved = resolved;
    const topLevel = await Module_model_1.CommentModel.find(filter).sort({ createdAt: -1 });
    const ids = topLevel.map((c) => c._id);
    const replies = await Module_model_1.CommentModel.find({ parentId: { $in: ids } }).sort({ createdAt: 1 });
    const replyMap = new Map();
    for (const r of replies) {
        const pid = String(r.parentId);
        if (!replyMap.has(pid))
            replyMap.set(pid, []);
        replyMap.get(pid).push(r);
    }
    return topLevel.map((c) => (0, formatReturn_1.toCommentDto)(c, replyMap.get(String(c._id)) ?? []));
}
async function resolveComment(moduleId, topicId, commentId, resolved, adminName) {
    const doc = await Module_model_1.CommentModel.findOne({ _id: commentId, topicId, moduleId });
    if (!doc)
        throw new error_1.AppError('Comment not found.', 404, 'NOT_FOUND');
    const updates = { resolved };
    if (resolved) {
        updates.resolvedBy = adminName;
        updates.resolvedAt = new Date();
    }
    else {
        updates.resolvedBy = undefined;
        updates.resolvedAt = undefined;
    }
    const updated = await Module_model_1.CommentModel.findByIdAndUpdate(commentId, updates, { new: true });
    return (0, formatReturn_1.toCommentDto)(updated);
}
async function deleteComment(moduleId, topicId, commentId) {
    const doc = await Module_model_1.CommentModel.findOne({ _id: commentId, topicId, moduleId });
    if (!doc)
        throw new error_1.AppError('Comment not found.', 404, 'NOT_FOUND');
    // Delete comment + all its replies
    await Promise.all([
        Module_model_1.CommentModel.findByIdAndDelete(commentId),
        Module_model_1.CommentModel.deleteMany({ parentId: commentId }),
    ]);
    // Decrement topic comment count
    await Module_model_1.TopicModel.findByIdAndUpdate(topicId, { $inc: { comments: -1 } });
}
//# sourceMappingURL=module.service.js.map