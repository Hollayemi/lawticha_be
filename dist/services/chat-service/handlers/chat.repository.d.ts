import { IMessage, IConversation, IParticipant, ConversationStatus, ParticipantRole, IAttachment, MessageType } from '../types/chat.types';
/**
 * ChatRepository
 * ──────────────
 * All database operations for the chat service.
 * Completely decoupled from Socket.io so it can be used
 * in REST endpoints or other transports too.
 */
export declare class ChatRepository {
    /**
     * Create a new conversation between two or more participants.
     */
    createConversation(params: {
        participants: Omit<IParticipant, 'joinedAt' | 'unreadCount'>[];
        contextType?: string;
        contextId?: string;
        isGroup?: boolean;
        groupName?: string;
        groupAvatar?: string;
        metadata?: Record<string, unknown>;
    }): Promise<IConversation>;
    /**
     * Find an existing conversation by contextType + contextId.
     * Useful when one conversation maps to one consultation/support ticket.
     */
    findByContext(contextType: string, contextId: string): Promise<IConversation | null>;
    /**
     * Find or create a conversation by context.
     */
    findOrCreateByContext(params: {
        contextType: string;
        contextId: string;
        participants: Omit<IParticipant, 'joinedAt' | 'unreadCount'>[];
        metadata?: Record<string, unknown>;
    }): Promise<{
        conversation: IConversation;
        created: boolean;
    }>;
    /**
     * Find an existing 1-to-1 conversation between two specific users.
     */
    findDirectConversation(userIdA: string, userIdB: string): Promise<IConversation | null>;
    /**
     * Get a conversation by its ID.
     */
    getConversationById(conversationId: string): Promise<IConversation | null>;
    /**
     * List all conversations for a user, newest activity first.
     */
    listConversationsForUser(params: {
        userId: string;
        status?: ConversationStatus;
        page?: number;
        pageSize?: number;
    }): Promise<{
        data: IConversation[];
        total: number;
    }>;
    /**
     * Update a conversation's status.
     */
    updateConversationStatus(conversationId: string, status: ConversationStatus): Promise<void>;
    /**
     * Verify that a user is a participant of a conversation.
     */
    isParticipant(conversationId: string, userId: string): Promise<boolean>;
    /**
     * Update last activity + lastMessage snapshot on the conversation.
     * Called after every new message.
     */
    touchConversation(conversationId: string, lastMessage: {
        content: string;
        senderId: string;
        senderName: string;
        type: MessageType;
    }): Promise<void>;
    /**
     * Increment unread count for all participants EXCEPT the sender.
     */
    incrementUnreadForOthers(conversationId: string, senderId: string): Promise<void>;
    /**
     * Reset unread count to 0 for a specific user.
     */
    resetUnreadCount(conversationId: string, userId: string): Promise<void>;
    /**
     * Update a participant's lastSeenAt timestamp.
     */
    updateParticipantLastSeen(conversationId: string, userId: string): Promise<void>;
    /**
     * Persist a new message.
     */
    createMessage(params: {
        conversationId: string;
        senderId: string;
        senderRole: ParticipantRole;
        senderName: string;
        content: string;
        type?: MessageType;
        attachments?: IAttachment[];
        replyTo?: string;
    }): Promise<IMessage>;
    /**
     * Paginate messages in a conversation (cursor-based, newest first).
     * Pass `before` (message _id) to get messages older than that cursor.
     */
    getMessages(params: {
        conversationId: string;
        before?: string;
        limit?: number;
    }): Promise<IMessage[]>;
    /**
     * Mark messages as delivered for a user.
     */
    markDelivered(conversationId: string, userId: string): Promise<void>;
    /**
     * Mark specific messages as read by a user.
     */
    markRead(params: {
        conversationId: string;
        messageIds: string[];
        userId: string;
    }): Promise<void>;
    /**
     * Soft-delete a message (sender only).
     */
    deleteMessage(messageId: string, senderId: string): Promise<boolean>;
    /**
     * Count unread messages in a conversation for a specific user.
     */
    countUnread(conversationId: string, userId: string): Promise<number>;
    /**
     * Get the latest message in a conversation (for preview).
     */
    getLatestMessage(conversationId: string): Promise<IMessage | null>;
}
//# sourceMappingURL=chat.repository.d.ts.map