"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listLearnModules = listLearnModules;
exports.getFullMaterialByModuleSlug = getFullMaterialByModuleSlug;
exports.generateAndSaveSummary = generateAndSaveSummary;
exports.getLearnModuleBySlug = getLearnModuleBySlug;
exports.getLearnTopicBySlug = getLearnTopicBySlug;
exports.getContinueReading = getContinueReading;
exports.getFeaturedTopics = getFeaturedTopics;
exports.toggleSaveModule = toggleSaveModule;
exports.enrolInModule = enrolInModule;
exports.markTopicComplete = markTopicComplete;
exports.saveVideoProgress = saveVideoProgress;
const mongoose_1 = require("mongoose");
const Module_model_1 = require("../models/Module.model");
const Enrollment_model_1 = require("../models/Enrollment.model");
const StudySession_model_1 = require("../models/StudySession.model");
const LawyerProfile_model_1 = require("../models/LawyerProfile.model");
const error_1 = require("../middleware/error");
const functions_1 = require("../utils/functions");
const notification_1 = __importDefault(require("../controllers/others/notification"));
// Helper: Get category metadata
function getCategoryMetadata(category) {
    const metadata = {
        criminal: { label: 'Criminal Law', color: '#DC2626', bg: '#FEE2E2' },
        tenancy: { label: 'Tenancy Law', color: '#D97706', bg: '#FEF3C7' },
        employment: { label: 'Employment Law', color: '#059669', bg: '#D1FAE5' },
        contracts: { label: 'Contract Law', color: '#2563EB', bg: '#DBEAFE' },
        business: { label: 'Business Law', color: '#7C3AED', bg: '#EDE9FE' },
        family: { label: 'Family Law', color: '#DB2777', bg: '#FCE7F3' },
        consumer: { label: 'Consumer Law', color: '#EA580C', bg: '#FFEDD5' },
        road: { label: 'Road Traffic Law', color: '#0891B2', bg: '#CFFAFE' },
    };
    return metadata[category];
}
// Helper: Get gradient from thumbnail or generate from category
function getGradient(thumbnailUrl, category) {
    if (thumbnailUrl)
        return `url(${thumbnailUrl})`;
    const gradients = {
        criminal: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
        tenancy: 'linear-gradient(135deg, #D97706 0%, #92400E 100%)',
        employment: 'linear-gradient(135deg, #059669 0%, #065F46 100%)',
        contracts: 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)',
        business: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
        family: 'linear-gradient(135deg, #DB2777 0%, #BE185D 100%)',
        consumer: 'linear-gradient(135deg, #EA580C 0%, #9A3412 100%)',
        road: 'linear-gradient(135deg, #0891B2 0%, #155E75 100%)',
    };
    return gradients[category];
}
// Helper: Get instructor data
async function getInstructorData(instructorId) {
    const lawyer = await LawyerProfile_model_1.LawyerProfileModel.findOne({ userId: instructorId }).populate('userId', 'firstName lastName email');
    if (lawyer && lawyer.userId) {
        const user = lawyer.userId;
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const name = `${firstName} ${lastName}`.trim();
        return {
            _id: instructorId.toString(),
            name: name || 'Legal Expert',
            email: user.email || '',
            initials: firstName.charAt(0) + lastName.charAt(0) || 'LE',
            color: '#1E3A5F',
        };
    }
    return {
        _id: instructorId.toString(),
        name: 'Legal Expert',
        email: '',
        initials: 'LE',
        color: '#1E3A5F',
    };
}
// Helper: Calculate weeks duration from topics
async function calculateWeeksDuration(moduleId) {
    const topics = await Module_model_1.TopicModel.find({ moduleId, status: 'published' });
    const totalMinutes = topics.reduce((sum, t) => sum + (t.durationSeconds / 60), 0);
    return Math.ceil(totalMinutes / 60); // Assume 1 hour per week
}
// Main service functions
async function listLearnModules(params) {
    const { tab, search, category, page = 1, pageSize = 20, citizenId, } = params;
    const currentPage = Math.max(1, Number(page) || 1);
    const limit = Math.max(1, Number(pageSize) || 20);
    const skip = (currentPage - 1) * limit;
    const searchTerm = search?.trim();
    // ----------------------------------------
    // 1. Build the base module filter
    // ----------------------------------------
    const filter = {
        status: "active",
    };
    if (category && category !== "all") {
        filter.category = category;
    }
    // Use text search if a search term exists.
    if (searchTerm) {
        filter.$text = {
            $search: searchTerm,
        };
    }
    // ----------------------------------------
    // 2. Get citizen enrollment information
    // ----------------------------------------
    let enrollmentMap = new Map();
    let savedModuleIds = new Set();
    if (citizenId) {
        const citizenObjectId = new mongoose_1.Types.ObjectId(citizenId);
        const enrollments = await Enrollment_model_1.EnrollmentModel.find({
            citizenId: citizenObjectId,
        }).lean();
        for (const enrollment of enrollments) {
            const moduleId = enrollment.moduleId.toString();
            enrollmentMap.set(moduleId, enrollment);
            if (enrollment.isSaved === true) {
                savedModuleIds.add(moduleId);
            }
        }
    }
    // ----------------------------------------
    // 3. Get modules matching the database filters
    // ----------------------------------------
    let modulesQuery = Module_model_1.ModuleModel.find(filter);
    // Search results should be ordered by relevance.
    if (searchTerm) {
        modulesQuery = modulesQuery
            .select({
            score: {
                $meta: "textScore",
            },
        })
            .sort({
            score: {
                $meta: "textScore",
            },
            trending: -1,
            createdAt: -1,
        });
    }
    else {
        modulesQuery = modulesQuery.sort({
            trending: -1,
            createdAt: -1,
        });
    }
    const allMatchingModules = await modulesQuery.lean();
    // ----------------------------------------
    // 4. Apply user-specific tab filtering
    // ----------------------------------------
    let filteredModules = allMatchingModules;
    if (tab && tab !== "all") {
        filteredModules = allMatchingModules.filter((module) => {
            const moduleId = String(module._id);
            const enrollment = enrollmentMap.get(moduleId);
            if (tab === "active") {
                return enrollment?.status === "active";
            }
            if (tab === "complete") {
                return enrollment?.status === "complete";
            }
            if (tab === "saved") {
                return savedModuleIds.has(moduleId);
            }
            return true;
        });
    }
    // ----------------------------------------
    // 5. Calculate total BEFORE pagination
    // ----------------------------------------
    const total = filteredModules.length;
    const totalPages = Math.ceil(total / limit);
    // ----------------------------------------
    // 6. Apply pagination AFTER all filters
    // ----------------------------------------
    const paginatedModules = filteredModules.slice(skip, skip + limit);
    // ----------------------------------------
    // 7. Transform modules
    // ----------------------------------------
    const transformedModules = await Promise.all(paginatedModules.map(async (module) => {
        const moduleId = module._id.toString();
        const enrollment = enrollmentMap.get(moduleId);
        const isSaved = savedModuleIds.has(moduleId);
        const categoryMeta = getCategoryMetadata(module.category);
        const instructor = await getInstructorData(module.instructorId);
        const weeksDuration = await calculateWeeksDuration(module._id);
        let userTab;
        if (enrollment) {
            if (enrollment.status === "complete") {
                userTab = "complete";
            }
            else if (enrollment.status === "active") {
                userTab = "active";
            }
            else if (enrollment.isSaved) {
                userTab = "saved";
            }
        }
        else if (isSaved) {
            userTab = "saved";
        }
        return {
            _id: moduleId,
            slug: (0, functions_1.generateSlug)(module.title),
            title: module.title,
            description: module.description,
            category: module.category,
            categoryLabel: categoryMeta.label,
            categoryColor: categoryMeta.color,
            categoryBg: categoryMeta.bg,
            status: module.status,
            thumbnailUrl: module.thumbnail,
            gradient: getGradient(module.thumbnail, module.category),
            tag: categoryMeta.label.split(" ")[0],
            tagColor: categoryMeta.color,
            price: "Free",
            instructor,
            rating: module.avgRating,
            reviewCount: module.reviewCount,
            weeksDuration,
            lessonCount: module.topicCount,
            trending: module.trending,
            createdAt: module.createdAt.toISOString(),
            updatedAt: module.updatedAt.toISOString(),
            enrolledAt: enrollment?.startedAt?.toISOString(),
            progressPercent: enrollment?.progressPercent || 0,
            userTab,
            isSaved,
        };
    }));
    // ----------------------------------------
    // 8. Return result
    // ----------------------------------------
    return {
        data: transformedModules,
        total,
        page: currentPage,
        pageSize: limit,
        totalPages,
    };
}
async function getFullMaterialByModuleSlug(slug) {
    if (!slug) {
        throw new error_1.AppError('Module Slug is required', 404, 'SLUG_NOT_FOUND');
    }
    const module = await Module_model_1.ModuleModel.findOne({ slug });
    console.log(slug, { module });
    if (!module) {
        throw new error_1.AppError('Module not found', 404, 'MODULE_NOT_FOUND');
    }
    // Find all topics for this module
    const topics = await Module_model_1.TopicModel.find({ moduleId: module._id })
        .sort({ order: 1 });
    // Get all subtopics for all topics in this module
    const topicIds = topics.map(topic => topic._id);
    const subtopics = await Module_model_1.SubTopicModel.find({
        topicId: { $in: topicIds },
        moduleId: module._id
    })
        .sort({ order: 1 })
        .lean();
    // Group subtopics by topicId
    const subtopicsByTopic = subtopics.reduce((acc, subtopic) => {
        const topicId = subtopic.topicId.toString();
        if (!acc[topicId]) {
            acc[topicId] = [];
        }
        acc[topicId].push(subtopic);
        return acc;
    }, {});
    // Build the hierarchical response
    const material = {
        module: {
            _id: module._id,
            title: module.title,
            slug: module.slug,
            category: module.category,
            status: module.status,
            description: module.description,
            instructor: module.instructor,
            thumbnail: module.thumbnail,
            topicCount: module.topicCount,
            enrolledCount: module.enrolledCount,
            completionRate: module.completionRate,
            avgRating: module.avgRating,
            createdAt: module.createdAt,
            updatedAt: module.updatedAt
        },
        topics: topics.map(topic => ({
            _id: topic._id,
            title: topic.title,
            slug: topic.slug,
            classification: topic.classification,
            overview: topic.overview,
            status: topic.status,
            order: topic.order,
            videoType: topic.videoType,
            videoUrl: topic.videoUrl,
            thumbnailUrl: topic.thumbnailUrl,
            duration: topic.duration,
            durationSeconds: topic.durationSeconds,
            watchCount: topic.watchCount,
            completionRate: topic.completionRate,
            likes: topic.likes,
            comments: topic.comments,
            tags: topic.tags,
            subtopicCount: topic.subtopicCount,
            subtopics: (subtopicsByTopic[topic._id.toString()] || []).map(subtopic => ({
                _id: subtopic._id,
                title: subtopic.title,
                slug: subtopic.slug,
                notes: subtopic.notes,
                duration: subtopic.duration,
                durationSeconds: subtopic.durationSeconds,
                order: subtopic.order,
                viewCount: subtopic.viewCount,
                completedBy: subtopic.completedBy,
                createdAt: subtopic.createdAt,
                updatedAt: subtopic.updatedAt
            }))
        }))
    };
    return material;
}
;
async function generateAndSaveSummary(slug, max_words = 500) {
    console.log({ slug, max_words });
    const response = await fetch('https://material-summary.onrender.com/api/v1/summary/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            slug,
            max_words: max_words
        })
    });
    if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData.detail);
        throw new error_1.AppError(`HTTP error! status: ${response.status}`, 500, 'FAILED TO GENERATE');
    }
    const data = await response.json();
    await Module_model_1.ModuleModel.findOneAndUpdate({ slug }, { $set: { materialSummary: data } });
    // Log the summary for debugging
    console.log('Summary generated for:', data.module_title);
    console.log('Total words:', data.total_word_count);
    console.log('Topics:', data.topics.map((t) => t.title).join(', '));
    return data;
}
async function getLearnModuleBySlug(slug, citizenId) {
    // Find module by title (slug is generated from title)
    const modules = await Module_model_1.ModuleModel.find({ status: 'active' });
    const module = modules.find(m => (0, functions_1.generateSlug)(m.title) === slug);
    if (!module) {
        throw new error_1.AppError('Module not found', 404, 'MODULE_NOT_FOUND');
    }
    // Get topics
    const topics = await Module_model_1.TopicModel.find({ moduleId: module._id, status: 'published' })
        .sort({ order: 1 });
    // Get enrollment data if citizen is authenticated
    let enrollment = null;
    let completedTopics = new Set();
    let activeTopicId = null;
    if (citizenId) {
        enrollment = await Enrollment_model_1.EnrollmentModel.findOne({
            citizenId: new mongoose_1.Types.ObjectId(citizenId),
            moduleId: module._id,
        });
        const userProgress = await Enrollment_model_1.UserProgressModel.find({
            citizenId: new mongoose_1.Types.ObjectId(citizenId),
            moduleId: module._id,
            status: 'done',
        });
        for (const progress of userProgress) {
            completedTopics.add(progress.lessonId.toString());
        }
        // Find active topic (first incomplete or current lesson)
        if (enrollment?.currentLessonId) {
            activeTopicId = enrollment.currentLessonId.toString();
        }
        else {
            for (const topic of topics) {
                if (!completedTopics.has(topic._id.toString())) {
                    activeTopicId = topic._id.toString();
                    break;
                }
            }
        }
    }
    const categoryMeta = getCategoryMetadata(module.category);
    const instructor = await getInstructorData(module.instructorId);
    const weeksDuration = await calculateWeeksDuration(module._id);
    // Calculate total watch time
    const totalWatchTimeMinutes = topics.reduce((sum, t) => sum + (t.durationSeconds / 60), 0);
    const topicSummaries = topics.map((topic, index) => ({
        _id: topic._id.toString(),
        slug: (0, functions_1.generateSlug)(topic.title),
        title: topic.title,
        order: topic.order,
        duration: topic.duration,
        status: topic.status,
        completed: completedTopics.has(topic._id.toString()),
        active: activeTopicId === topic._id.toString(),
    }));
    return {
        _id: module._id.toString(),
        slug: (0, functions_1.generateSlug)(module.title),
        title: module.title,
        materialSummary: module.materialSummary,
        description: module.description,
        fullDescription: module.description,
        category: module.category,
        categoryLabel: categoryMeta.label,
        categoryColor: categoryMeta.color,
        categoryBg: categoryMeta.bg,
        status: module.status,
        thumbnailUrl: module.thumbnail,
        gradient: getGradient(module.thumbnail, module.category),
        tag: categoryMeta.label.split(' ')[0],
        tagColor: categoryMeta.color,
        price: 'Free',
        instructor,
        rating: module.avgRating,
        reviewCount: module.reviewCount,
        weeksDuration,
        lessonCount: module.topicCount,
        trending: module.trending,
        createdAt: module.createdAt.toISOString(),
        updatedAt: module.updatedAt.toISOString(),
        enrolledAt: enrollment?.startedAt?.toISOString(),
        progressPercent: enrollment?.progressPercent || 0,
        userTab: enrollment?.status === 'complete' ? 'complete' : enrollment?.status === 'active' ? 'active' : undefined,
        isSaved: enrollment?.isSaved || false,
        topics: topicSummaries,
        totalWatchTimeMinutes,
        enrolledCount: module.enrolledCount,
        completionRate: module.completionRate,
    };
}
async function getLearnTopicBySlug(moduleSlug, topicSlug, citizenId) {
    // Find module by slug
    const modules = await Module_model_1.ModuleModel.find({ status: 'active' });
    const module = modules.find(m => (0, functions_1.generateSlug)(m.title) === moduleSlug);
    if (!module) {
        throw new error_1.AppError('Module not found', 404, 'MODULE_NOT_FOUND');
    }
    // Find topic by slug
    const topics = await Module_model_1.TopicModel.find({ moduleId: module._id });
    const topic = topics.find(t => (0, functions_1.generateSlug)(t.title) === topicSlug);
    if (!topic) {
        throw new error_1.AppError('Topic not found', 404, 'TOPIC_NOT_FOUND');
    }
    // Get subtopics
    const subtopics = await Module_model_1.SubTopicModel.find({ topicId: topic._id, moduleId: module._id })
        .sort({ order: 1 });
    // Get enrollment and progress data
    let enrollment = null;
    let isCompleted = false;
    let progressPercent = 0;
    let currentTime = '0:00';
    let currentTimeSeconds = 0;
    if (citizenId) {
        enrollment = await Enrollment_model_1.EnrollmentModel.findOne({
            citizenId: new mongoose_1.Types.ObjectId(citizenId),
            moduleId: module._id,
        });
        const userProgress = await Enrollment_model_1.UserProgressModel.findOne({
            citizenId: new mongoose_1.Types.ObjectId(citizenId),
            lessonId: topic._id,
        });
        if (userProgress) {
            isCompleted = userProgress.status === 'done';
            currentTimeSeconds = userProgress.videoPositionSeconds || 0;
            const minutes = Math.floor(currentTimeSeconds / 60);
            const seconds = currentTimeSeconds % 60;
            currentTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            progressPercent = (currentTimeSeconds / topic.durationSeconds) * 100;
        }
    }
    const instructor = await getInstructorData(module.instructorId);
    const subtopicSummaries = subtopics.map((subtopic, index) => ({
        _id: subtopic._id.toString(),
        title: subtopic.title,
        order: subtopic.order,
        duration: subtopic.duration,
        // completed: subtopic.completedBy.includes(citizenId || ''),
        notes: subtopic.notes,
        completedBy: subtopic.completedBy,
    }));
    return {
        _id: topic._id.toString(),
        slug: (0, functions_1.generateSlug)(topic.title),
        moduleId: module._id.toString(),
        moduleTitle: module.title,
        moduleSlug: (0, functions_1.generateSlug)(module.title),
        title: topic.title,
        tag: module.category,
        tagColor: getCategoryMetadata(module.category).color,
        classification: topic.classification,
        overview: topic.overview,
        status: topic.status,
        order: topic.order,
        videoType: topic.videoType,
        videoUrl: topic.videoUrl,
        thumbnailUrl: topic.thumbnailUrl,
        duration: topic.duration,
        durationSeconds: topic.durationSeconds,
        currentTime,
        progressPercent,
        watchCount: topic.watchCount,
        completionRate: topic.completionRate,
        likes: topic.likes,
        comments: topic.comments,
        rating: 0,
        instructor,
        weeksDuration: Math.ceil(topic.durationSeconds / 3600),
        lessonCount: 1,
        subtopics: subtopicSummaries,
        createdAt: topic.createdAt.toISOString(),
        updatedAt: topic.updatedAt.toISOString(),
        completed: isCompleted,
    };
}
async function getContinueReading(citizenId) {
    const enrollments = await Enrollment_model_1.EnrollmentModel.find({
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
        status: 'active',
    })
        .sort({ lastActivityAt: -1 })
        .limit(2)
        .populate('moduleId');
    const result = [];
    for (const enrollment of enrollments) {
        const module = enrollment.moduleId;
        if (!module)
            continue;
        // Get current topic
        let currentSectionTitle = 'Getting Started';
        if (enrollment.currentLessonTitle) {
            currentSectionTitle = enrollment.currentLessonTitle;
        }
        else {
            const firstTopic = await Module_model_1.TopicModel.findOne({ moduleId: module._id }).sort({ order: 1 });
            if (firstTopic) {
                currentSectionTitle = firstTopic.title;
            }
        }
        const lastReadLabel = getRelativeTimeLabel(enrollment.lastActivityAt);
        result.push({
            slug: (0, functions_1.generateSlug)(module.title),
            moduleSlug: (0, functions_1.generateSlug)(module.title),
            title: module.title,
            tag: module.category,
            tagColor: getCategoryMetadata(module.category).color,
            gradient: getGradient(module.thumbnail, module.category),
            progressPercent: enrollment.progressPercent,
            lastReadAt: enrollment.lastActivityAt.toISOString(),
            lastReadLabel,
            currentSectionTitle,
            xpRewardOnCompletion: 100,
        });
    }
    return result;
}
async function getFeaturedTopics() {
    const topics = await Module_model_1.TopicModel.find({ status: 'published' }).populate("moduleId", "title")
        .sort({ watchCount: -1 })
        .limit(4)
        .populate('moduleId');
    const result = [];
    for (const topic of topics) {
        console.log(topic.moduleId);
        const module = topic.moduleId._id;
        const instructor = await getInstructorData(module);
        result.push({
            _id: topic._id.toString(),
            module: (0, functions_1.generateSlug)(topic.moduleId.title),
            slug: (0, functions_1.generateSlug)(topic.title),
            title: topic.title,
            instructor: {
                name: instructor.name,
                email: instructor.email,
                initials: instructor.initials,
                color: instructor.color,
            },
        });
    }
    return result;
}
async function toggleSaveModule(moduleId, citizenId) {
    const enrollment = await Enrollment_model_1.EnrollmentModel.findOne({
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
        moduleId: new mongoose_1.Types.ObjectId(moduleId),
    });
    if (enrollment) {
        enrollment.isSaved = !enrollment.isSaved;
        if (enrollment.isSaved && enrollment.status === 'active') {
            enrollment.status = 'saved';
        }
        else if (!enrollment.isSaved && enrollment.status === 'saved') {
            enrollment.status = 'active';
        }
        await enrollment.save();
        return { moduleId, saved: enrollment.isSaved };
    }
    // Create new enrollment as saved
    const newEnrollment = new Enrollment_model_1.EnrollmentModel({
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
        moduleId: new mongoose_1.Types.ObjectId(moduleId),
        status: 'saved',
        isSaved: true,
        startedAt: new Date(),
        lastActivityAt: new Date(),
    });
    await newEnrollment.save();
    return { moduleId, saved: true };
}
async function enrolInModule(moduleId, citizenId) {
    const existingEnrollment = await Enrollment_model_1.EnrollmentModel.findOne({
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
        moduleId: new mongoose_1.Types.ObjectId(moduleId),
    });
    if (existingEnrollment) {
        if (existingEnrollment.status === 'saved') {
            existingEnrollment.status = 'active';
            existingEnrollment.isSaved = false;
            await existingEnrollment.save();
        }
        // Notify user of enrollment continuation
        await notification_1.default.saveAndSendNotification({
            userId: citizenId,
            title: '📚 Continuing Your Module',
            body: 'You\'re already enrolled in this module. Keep learning!',
            type: 'enrollment_continued',
            clickUrl: `/learn/modules/${moduleId}`,
            priority: 'low'
        }, 'user', { push_notification: true });
        return {
            _id: moduleId,
            enrolledAt: existingEnrollment.startedAt.toISOString(),
            progressPercent: existingEnrollment.progressPercent,
            userTab: existingEnrollment.status,
        };
    }
    const enrollment = new Enrollment_model_1.EnrollmentModel({
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
        moduleId: new mongoose_1.Types.ObjectId(moduleId),
        status: 'active',
        startedAt: new Date(),
        lastActivityAt: new Date(),
    });
    await enrollment.save();
    // Update module enrolled count
    await Module_model_1.ModuleModel.findByIdAndUpdate(moduleId, {
        $inc: { enrolledCount: 1 },
    });
    // Get module title for notification
    const module = await Module_model_1.ModuleModel.findById(moduleId);
    // Notify user of enrollment
    await notification_1.default.saveAndSendNotification({
        userId: citizenId,
        title: '🎓 New Module Enrolled',
        body: `You have successfully enrolled in "${module?.title || 'Module'}". Start learning now!`,
        type: 'module_enrolled',
        clickUrl: `/learn/modules/${moduleId}`,
        priority: 'medium'
    }, 'user', { push_notification: true });
    return {
        _id: moduleId,
        enrolledAt: enrollment.startedAt.toISOString(),
        progressPercent: 0,
        userTab: 'active',
    };
}
async function markTopicComplete(moduleId, topicId, citizenId) {
    const enrollment = await Enrollment_model_1.EnrollmentModel.findOne({
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
        moduleId: new mongoose_1.Types.ObjectId(moduleId),
    });
    if (!enrollment) {
        throw new error_1.AppError('Enrollment not found', 404, 'ENROLLMENT_NOT_FOUND');
    }
    // Check if already completed
    const existingProgress = await Enrollment_model_1.UserProgressModel.findOne({
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
        lessonId: new mongoose_1.Types.ObjectId(topicId),
    });
    let xpAwarded = 0;
    let certificateUnlocked = false;
    if (!existingProgress || existingProgress.status !== 'done') {
        xpAwarded = 50; // XP for completing a topic
        // Create or update progress
        await Enrollment_model_1.UserProgressModel.findOneAndUpdate({
            citizenId: new mongoose_1.Types.ObjectId(citizenId),
            lessonId: new mongoose_1.Types.ObjectId(topicId),
        }, {
            citizenId: new mongoose_1.Types.ObjectId(citizenId),
            moduleId: new mongoose_1.Types.ObjectId(moduleId),
            lessonId: new mongoose_1.Types.ObjectId(topicId),
            enrollmentId: enrollment._id,
            status: 'done',
            completedAt: new Date(),
            xpAwarded,
        }, { upsert: true });
        // Update enrollment progress
        const totalTopics = await Module_model_1.TopicModel.countDocuments({
            moduleId: new mongoose_1.Types.ObjectId(moduleId),
            status: 'published',
        });
        const completedTopics = await Enrollment_model_1.UserProgressModel.countDocuments({
            citizenId: new mongoose_1.Types.ObjectId(citizenId),
            moduleId: new mongoose_1.Types.ObjectId(moduleId),
            status: 'done',
        });
        const newProgressPercent = (completedTopics / totalTopics) * 100;
        enrollment.progressPercent = newProgressPercent;
        enrollment.lessonsCompleted.push(new mongoose_1.Types.ObjectId(topicId));
        if (newProgressPercent >= 100) {
            enrollment.status = 'complete';
            enrollment.completedAt = new Date();
            certificateUnlocked = true;
        }
        await enrollment.save();
        // Record study session
        const topic = await Module_model_1.TopicModel.findById(topicId);
        if (topic) {
            await StudySession_model_1.StudySessionModel.create({
                citizenId: new mongoose_1.Types.ObjectId(citizenId),
                moduleId: new mongoose_1.Types.ObjectId(moduleId),
                lessonId: new mongoose_1.Types.ObjectId(topicId),
                enrollmentId: enrollment._id,
                sessionType: 'study',
                durationMinutes: Math.ceil(topic.durationSeconds / 60),
                startedAt: new Date(),
                endedAt: new Date(),
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1,
            });
        }
        // Notify user of topic completion
        await notification_1.default.saveAndSendNotification({
            userId: citizenId,
            title: `✅ Topic Complete: ${topic?.title || 'Lesson'}`,
            body: `You completed a topic! +50 XP. Keep up the great work!`,
            type: 'topic_completed',
            clickUrl: `/learn/modules/${moduleId}`,
            priority: 'medium'
        }, 'user', { push_notification: true });
    }
    // If certificate unlocked, send celebration notification
    if (certificateUnlocked) {
        const module = await Module_model_1.ModuleModel.findById(moduleId);
        await notification_1.default.saveAndSendNotification({
            userId: citizenId,
            title: '🎉 Module Complete!',
            body: `Congratulations! You've completed "${module?.title || 'the module'}" and earned your certificate!`,
            type: 'module_completed',
            clickUrl: `/learn/modules/${moduleId}/certificate`,
            priority: 'high'
        }, 'user', { push_notification: true, email_notification: true });
    }
    // Get total XP for citizen
    const totalProgress = await Enrollment_model_1.UserProgressModel.aggregate([
        { $match: { citizenId: new mongoose_1.Types.ObjectId(citizenId) } },
        { $group: { _id: null, total: { $sum: '$xpAwarded' } } },
    ]);
    const xpTotal = totalProgress[0]?.total || 0;
    // Get streak (simplified)
    const streakDays = 1;
    return {
        topicId,
        completed: true,
        xpTotal,
        xpAwarded,
        streakDays,
        moduleProgressPercent: enrollment.progressPercent,
        certificateUnlocked,
    };
}
async function saveVideoProgress(moduleId, topicId, citizenId, currentTimeSeconds) {
    const enrollment = await Enrollment_model_1.EnrollmentModel.findOne({
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
        moduleId: new mongoose_1.Types.ObjectId(moduleId),
    });
    if (!enrollment) {
        throw new error_1.AppError('Enrollment not found', 404, 'ENROLLMENT_NOT_FOUND');
    }
    await Enrollment_model_1.UserProgressModel.findOneAndUpdate({
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
        lessonId: new mongoose_1.Types.ObjectId(topicId),
    }, {
        citizenId: new mongoose_1.Types.ObjectId(citizenId),
        moduleId: new mongoose_1.Types.ObjectId(moduleId),
        lessonId: new mongoose_1.Types.ObjectId(topicId),
        enrollmentId: enrollment._id,
        videoPositionSeconds: currentTimeSeconds,
        status: 'active',
    }, { upsert: true });
    // Update enrollment last activity
    enrollment.lastActivityAt = new Date();
    await enrollment.save();
    return { topicId, currentTimeSeconds };
}
function getRelativeTimeLabel(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1)
        return 'Just now';
    if (diffMins < 60)
        return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24)
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}
//# sourceMappingURL=learn.service.js.map