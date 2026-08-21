"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubtopicBookmarkModel = exports.SubtopicActivityModel = void 0;
const mongoose_1 = require("mongoose");
const SubtopicActivitySchema = new mongoose_1.Schema({
    citizenId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subtopicId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AdminSubTopic', required: true, index: true },
    topicId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AdminTopic', required: true, index: true },
    moduleId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AdminModule', required: true, index: true },
    liked: { type: Boolean, default: false },
    likedAt: { type: Date },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
}, { timestamps: true, collection: 'subtopic_activity' });
SubtopicActivitySchema.index({ citizenId: 1, subtopicId: 1 }, { unique: true });
SubtopicActivitySchema.index({ citizenId: 1, topicId: 1 });
exports.SubtopicActivityModel = mongoose_1.models.SubtopicActivity || (0, mongoose_1.model)('SubtopicActivity', SubtopicActivitySchema);
const SubtopicBookmarkSchema = new mongoose_1.Schema({
    citizenId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subtopicId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AdminSubTopic', required: true, index: true },
    topicId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AdminTopic', required: true, index: true },
    moduleId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AdminModule', required: true, index: true },
    url: { type: String, required: true, default: "/" },
    subtopicTitle: { type: String, default: '' },
    topicTitle: { type: String, default: '' },
    moduleTitle: { type: String, default: '' },
    highlightedText: { type: String, required: true, trim: true },
    comment: { type: String, default: '', trim: true },
    startOffset: { type: Number },
    endOffset: { type: Number },
}, { timestamps: true, collection: 'subtopic_bookmarks' });
SubtopicBookmarkSchema.index({ citizenId: 1, subtopicId: 1, createdAt: -1 });
SubtopicBookmarkSchema.index({ citizenId: 1, createdAt: -1 });
exports.SubtopicBookmarkModel = mongoose_1.models.SubtopicBookmark || (0, mongoose_1.model)('SubtopicBookmark', SubtopicBookmarkSchema);
//# sourceMappingURL=SubtopicEngagement.model.js.map