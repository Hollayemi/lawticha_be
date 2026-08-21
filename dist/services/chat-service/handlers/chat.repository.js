"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepository = void 0;
const mongoose_1 = require("mongoose");
const chat_model_1 = require("../models/chat.model");
/**
 * ChatRepository
 * ──────────────
 * All database operations for the chat service.
 * Completely decoupled from Socket.io so it can be used
 * in REST endpoints or other transports too.
 */
class ChatRepository {
    // ─── Conversation ───────────────────────────────────────────────────────────
    /**
     * Create a new conversation between two or more participants.
     */
    async createConversation(params) {
        const doc = await chat_model_1.ChatConversationModel.create({
            participants: params.participants.map(p => ({
                ...p,
                userId: new mongoose_1.Types.ObjectId(p.userId),
                joinedAt: new Date(),
                unreadCount: 0,
            })),
            contextType: params.contextType,
            contextId: params.contextId ? new mongoose_1.Types.ObjectId(params.contextId) : undefined,
            isGroup: params.isGroup ?? false,
            groupName: params.groupName,
            groupAvatar: params.groupAvatar,
            metadata: params.metadata ?? {},
            lastActivityAt: new Date(),
        });
        return doc.toObject();
    }
    /**
     * Find an existing conversation by contextType + contextId.
     * Useful when one conversation maps to one consultation/support ticket.
     */
    async findByContext(contextType, contextId) {
        const doc = await chat_model_1.ChatConversationModel.findOne({
            contextType,
            contextId: new mongoose_1.Types.ObjectId(contextId),
        }).lean();
        return doc;
    }
    /**
     * Find or create a conversation by context.
     */
    async findOrCreateByContext(params) {
        const existing = await this.findByContext(params.contextType, params.contextId);
        if (existing)
            return { conversation: existing, created: false };
        const conversation = await this.createConversation({
            contextType: params.contextType,
            contextId: params.contextId,
            participants: params.participants,
            metadata: params.metadata,
        });
        return { conversation, created: true };
    }
    /**
     * Find an existing 1-to-1 conversation between two specific users.
     */
    async findDirectConversation(userIdA, userIdB) {
        const doc = await chat_model_1.ChatConversationModel.findOne({
            isGroup: false,
            'participants.userId': {
                $all: [new mongoose_1.Types.ObjectId(userIdA), new mongoose_1.Types.ObjectId(userIdB)],
            },
        }).populate('participants.userId').lean();
        return doc;
    }
    /**
     * Get a conversation by its ID.
     */
    async getConversationById(conversationId) {
        const doc = await chat_model_1.ChatConversationModel.findById(conversationId).lean();
        console.log({ doc });
        return doc;
    }
    /**
     * List all conversations for a user, newest activity first.
     */
    async listConversationsForUser(params) {
        const { userId, status = 'active', page = 1, pageSize = 20 } = params;
        console.log(params);
        const filter = {
            'participants.userId': new mongoose_1.Types.ObjectId(userId),
            status,
        };
        const skip = (page - 1) * pageSize;
        const [docs, total] = await Promise.all([
            chat_model_1.ChatConversationModel.find(filter)
                .sort({ lastActivityAt: -1 })
                .skip(skip)
                .limit(pageSize)
                .lean(),
            chat_model_1.ChatConversationModel.countDocuments(filter),
        ]);
        return { data: docs, total };
    }
    /**
     * Update a conversation's status.
     */
    async updateConversationStatus(conversationId, status) {
        await chat_model_1.ChatConversationModel.findByIdAndUpdate(conversationId, { status });
    }
    /**
     * Verify that a user is a participant of a conversation.
     */
    async isParticipant(conversationId, userId) {
        const count = await chat_model_1.ChatConversationModel.countDocuments({
            _id: new mongoose_1.Types.ObjectId(conversationId),
            'participants.userId': new mongoose_1.Types.ObjectId(userId),
        });
        return count > 0;
    }
    /**
     * Update last activity + lastMessage snapshot on the conversation.
     * Called after every new message.
     */
    async touchConversation(conversationId, lastMessage) {
        await chat_model_1.ChatConversationModel.findByIdAndUpdate(conversationId, {
            lastActivityAt: new Date(),
            lastMessage: {
                content: lastMessage.content,
                senderId: new mongoose_1.Types.ObjectId(lastMessage.senderId),
                senderName: lastMessage.senderName,
                type: lastMessage.type,
                createdAt: new Date(),
            },
        });
    }
    /**
     * Increment unread count for all participants EXCEPT the sender.
     */
    async incrementUnreadForOthers(conversationId, senderId) {
        await chat_model_1.ChatConversationModel.updateOne({ _id: new mongoose_1.Types.ObjectId(conversationId) }, {
            $inc: {
                'participants.$[other].unreadCount': 1,
            },
        }, {
            arrayFilters: [
                { 'other.userId': { $ne: new mongoose_1.Types.ObjectId(senderId) } },
            ],
        });
    }
    /**
     * Reset unread count to 0 for a specific user.
     */
    async resetUnreadCount(conversationId, userId) {
        await chat_model_1.ChatConversationModel.updateOne({
            _id: new mongoose_1.Types.ObjectId(conversationId),
            'participants.userId': new mongoose_1.Types.ObjectId(userId),
        }, { $set: { 'participants.$.unreadCount': 0 } });
    }
    /**
     * Update a participant's lastSeenAt timestamp.
     */
    async updateParticipantLastSeen(conversationId, userId) {
        await chat_model_1.ChatConversationModel.updateOne({
            _id: new mongoose_1.Types.ObjectId(conversationId),
            'participants.userId': new mongoose_1.Types.ObjectId(userId),
        }, { $set: { 'participants.$.lastSeenAt': new Date() } });
    }
    // ─── Messages ───────────────────────────────────────────────────────────────
    /**
     * Persist a new message.
     */
    async createMessage(params) {
        console.log('hereeeeeeeeeeeeeeeeeeeeeeee');
        const doc = await chat_model_1.ChatMessageModel.create({
            conversationId: new mongoose_1.Types.ObjectId(params.conversationId),
            senderId: new mongoose_1.Types.ObjectId(params.senderId),
            senderRole: params.senderRole,
            senderName: params.senderName,
            content: params.content,
            type: params.type ?? 'text',
            attachments: params.attachments ?? [],
            replyTo: params.replyTo ? new mongoose_1.Types.ObjectId(params.replyTo) : undefined,
            status: 'sent',
            readBy: [],
        });
        return doc.toObject();
    }
    /**
     * Paginate messages in a conversation (cursor-based, newest first).
     * Pass `before` (message _id) to get messages older than that cursor.
     */
    async getMessages(params) {
        const { conversationId, before, limit = 50 } = params;
        const filter = {
            conversationId: new mongoose_1.Types.ObjectId(conversationId),
            isDeleted: false,
        };
        if (before) {
            filter._id = { $lt: new mongoose_1.Types.ObjectId(before) };
        }
        const docs = await chat_model_1.ChatMessageModel
            .find(filter)
            .sort({ _id: -1 }) // newest first so pagination works intuitively
            .limit(limit)
            .lean();
        // Reverse so caller gets oldest → newest in the page
        return docs.reverse();
    }
    /**
     * Mark messages as delivered for a user.
     */
    async markDelivered(conversationId, userId) {
        await chat_model_1.ChatMessageModel.updateMany({
            conversationId: new mongoose_1.Types.ObjectId(conversationId),
            senderId: { $ne: new mongoose_1.Types.ObjectId(userId) },
            status: 'sent',
        }, { $set: { status: 'delivered' } });
    }
    /**
     * Mark specific messages as read by a user.
     */
    async markRead(params) {
        const { conversationId, messageIds, userId } = params;
        const now = new Date();
        await chat_model_1.ChatMessageModel.updateMany({
            _id: { $in: messageIds.map(id => new mongoose_1.Types.ObjectId(id)) },
            conversationId: new mongoose_1.Types.ObjectId(conversationId),
            senderId: { $ne: new mongoose_1.Types.ObjectId(userId) },
            'readBy.userId': { $ne: new mongoose_1.Types.ObjectId(userId) },
        }, {
            $set: { status: 'read' },
            $push: { readBy: { userId: new mongoose_1.Types.ObjectId(userId), readAt: now } },
        });
    }
    /**
     * Soft-delete a message (sender only).
     */
    async deleteMessage(messageId, senderId) {
        const result = await chat_model_1.ChatMessageModel.updateOne({
            _id: new mongoose_1.Types.ObjectId(messageId),
            senderId: new mongoose_1.Types.ObjectId(senderId),
        }, {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                content: '[Message deleted]',
            },
        });
        return result.modifiedCount > 0;
    }
    /**
     * Count unread messages in a conversation for a specific user.
     */
    async countUnread(conversationId, userId) {
        return chat_model_1.ChatMessageModel.countDocuments({
            conversationId: new mongoose_1.Types.ObjectId(conversationId),
            senderId: { $ne: new mongoose_1.Types.ObjectId(userId) },
            isDeleted: false,
            'readBy.userId': { $ne: new mongoose_1.Types.ObjectId(userId) },
        });
    }
    /**
     * Get the latest message in a conversation (for preview).
     */
    async getLatestMessage(conversationId) {
        const doc = await chat_model_1.ChatMessageModel
            .findOne({ conversationId: new mongoose_1.Types.ObjectId(conversationId), isDeleted: false })
            .sort({ createdAt: -1 })
            .lean();
        return doc;
    }
}
exports.ChatRepository = ChatRepository;
//# sourceMappingURL=chat.repository.js.map