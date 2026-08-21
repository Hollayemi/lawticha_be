"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = exports.ActivityModel = exports.ModuleModel = exports.TopicModel = exports.SubTopicModel = void 0;
const mongoose_1 = require("mongoose");
const SubTopicSchema = new mongoose_1.Schema({
    topicId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AdminTopic', required: true, index: true },
    moduleId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AdminModule', required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    duration: { type: String, default: '0:00' },
    durationSeconds: { type: Number, default: 0 },
    order: { type: Number, required: true, default: 1 },
    viewCount: { type: Number, default: 0 },
    completedBy: { type: Number, default: 0 },
}, { timestamps: true, collection: 'admin_subtopics' });
SubTopicSchema.index({ topicId: 1, order: 1 });
exports.SubTopicModel = mongoose_1.models.AdminSubTopic || (0, mongoose_1.model)('AdminSubTopic', SubTopicSchema);
const TopicSchema = new mongoose_1.Schema({
    moduleId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AdminModule', required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    classification: { type: String, default: '' },
    overview: { type: String, default: '' },
    status: { type: String, enum: ['published', 'draft', 'pending'], default: 'draft' },
    order: { type: Number, required: true, default: 1 },
    videoType: { type: String, enum: ['youtube', 'upload', null], default: null },
    videoUrl: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    duration: { type: String, default: '0:00' },
    durationSeconds: { type: Number, default: 0 },
    watchCount: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    tags: [{ type: String }],
    subtopicCount: { type: Number, default: 0 },
}, { timestamps: true, collection: 'admin_topics' });
TopicSchema.index({ moduleId: 1, order: 1 });
TopicSchema.index({ moduleId: 1, status: 1 });
exports.TopicModel = mongoose_1.models.AdminTopic || (0, mongoose_1.model)('AdminTopic', TopicSchema);
const ModuleSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    category: {
        type: String,
        required: true,
        enum: ['criminal', 'tenancy', 'employment', 'contracts', 'business', 'family', 'consumer', 'road'],
    },
    status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'pending' },
    thumbnail: { type: String, default: null },
    description: { type: String, default: '' },
    topicCount: { type: Number, default: 0 },
    materialSummary: { type: Object, default: null },
    // Denorm stats – updated by background jobs / service calls
    enrolledCount: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    totalWatchTimeHours: { type: Number, default: 0 },
    // Instructor fields (denorm from LawyerProfile/AdminUser)
    instructor: { type: String, default: '' },
    instructorId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    instructorInitials: { type: String, default: '' },
    instructorColor: { type: String, default: '#1E3A5F' },
    trending: { type: Boolean, default: false },
}, { timestamps: true, collection: 'admin_modules' });
ModuleSchema.index({ status: 1 });
ModuleSchema.index({ category: 1 });
ModuleSchema.index({ trending: 1 });
ModuleSchema.index({ title: 'text', description: 'text' });
exports.ModuleModel = mongoose_1.models.AdminModule || (0, mongoose_1.model)('AdminModule', ModuleSchema);
const ActivitySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userInitials: { type: String, default: '' },
    userColor: { type: String, default: '#1E3A5F' },
    action: {
        type: String,
        required: true,
        enum: ['completed', 'enrolled', 'liked', 'commented', 'watched', 'started'],
    },
    targetTitle: { type: String, required: true },
    targetType: { type: String, required: true, enum: ['topic', 'module', 'subtopic'] },
    targetId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    moduleId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AdminModule', required: true, index: true },
}, { timestamps: true, collection: 'admin_activity' });
ActivitySchema.index({ moduleId: 1, createdAt: -1 });
exports.ActivityModel = mongoose_1.models.AdminActivity || (0, mongoose_1.model)('AdminActivity', ActivitySchema);
const CommentSchema = new mongoose_1.Schema({
    topicId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AdminTopic', required: true, index: true },
    moduleId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AdminModule', required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userInitials: { type: String, default: '' },
    userColor: { type: String, default: '#1E3A5F' },
    text: { type: String, required: true },
    likes: { type: Number, default: 0 },
    resolved: { type: Boolean, default: false, index: true },
    resolvedBy: { type: String },
    resolvedAt: { type: Date },
    parentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AdminComment', default: null },
}, { timestamps: true, collection: 'admin_comments' });
CommentSchema.index({ topicId: 1, resolved: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1 });
exports.CommentModel = mongoose_1.models.AdminComment || (0, mongoose_1.model)('AdminComment', CommentSchema);
//# sourceMappingURL=Module.model.js.map