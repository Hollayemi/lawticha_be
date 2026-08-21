"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatConversationModel = exports.ChatMessageModel = void 0;
const mongoose_1 = require("mongoose");
// ─── Attachment Sub-Schema ────────────────────────────────────────────────────
const AttachmentSchema = new mongoose_1.Schema({
    url: { type: String, required: true },
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
}, { _id: false });
const MessageSchema = new mongoose_1.Schema({
    conversationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ChatConversation',
        required: true,
        index: true,
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    senderRole: {
        type: String,
        enum: ['citizen', 'lawyer', 'admin'],
        required: true,
    },
    senderName: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file', 'system'],
        default: 'text',
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    attachments: {
        type: [AttachmentSchema],
        default: [],
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent',
    },
    readBy: [
        {
            userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
            readAt: { type: Date, default: Date.now },
            _id: false,
        },
    ],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    replyTo: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChatMessage', default: null },
}, {
    timestamps: true,
    collection: 'chat_messages',
});
// Indexes for efficient querying
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, isDeleted: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
exports.ChatMessageModel = mongoose_1.models.ChatMessage || (0, mongoose_1.model)('ChatMessage', MessageSchema);
const ParticipantSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "User" },
    role: { type: String, enum: ['citizen', 'lawyer', 'admin'], required: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },
    joinedAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date },
    unreadCount: { type: Number, default: 0, min: 0 },
}, { _id: false });
const ConversationSchema = new mongoose_1.Schema({
    contextType: { type: String, index: true },
    contextId: { type: mongoose_1.Schema.Types.ObjectId, index: true, sparse: true },
    participants: {
        type: [ParticipantSchema],
        required: true,
        validate: {
            validator: (v) => v.length >= 2,
            message: 'A conversation requires at least 2 participants.',
        },
    },
    status: {
        type: String,
        enum: ['active', 'closed', 'archived'],
        default: 'active',
        index: true,
    },
    lastMessage: {
        content: { type: String },
        senderId: { type: mongoose_1.Schema.Types.ObjectId },
        senderName: { type: String },
        type: { type: String, enum: ['text', 'image', 'file', 'system'] },
        createdAt: { type: Date },
    },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    isGroup: { type: Boolean, default: false },
    groupName: { type: String },
    groupAvatar: { type: String },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, {
    timestamps: true,
    collection: 'chat_conversations',
});
// Compound index: quickly find all conversations for a user
ConversationSchema.index({ 'participants.userId': 1, lastActivityAt: -1 });
ConversationSchema.index({ 'participants.userId': 1, status: 1 });
// Unique conversation per context (e.g. one chat per consultation)
ConversationSchema.index({ contextType: 1, contextId: 1 }, { unique: true, sparse: true });
exports.ChatConversationModel = mongoose_1.models.ChatConversation ||
    (0, mongoose_1.model)('ChatConversation', ConversationSchema);
//# sourceMappingURL=chat.model.js.map