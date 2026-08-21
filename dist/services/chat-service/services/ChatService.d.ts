import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { Server } from 'socket.io';
import { ChatServiceConfig, IConversation, IMessage, IPresence, ConversationStatus, IParticipant } from '../types/chat.types';
export { ChatMessageModel, ChatConversationModel } from '../models/chat.model';
export * from '../types/chat.types';
export declare class ChatService {
    private io;
    private redis;
    private repo;
    private presence;
    private config;
    constructor(httpServer: HttpServer | HttpsServer, config: ChatServiceConfig);
    init(): Promise<void>;
    shutdown(): Promise<void>;
    private _attachAuthMiddleware;
    private _attachConnectionHandler;
    /**
     * Create a new conversation.
     * Call this from your REST layer when a consultation is booked,
     * a support ticket is opened, etc.
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
     * Find or create a conversation tied to a specific context
     * (e.g. one conversation per consultation).
     */
    findOrCreateConversation(params: {
        contextType: string;
        contextId: string;
        participants: Omit<IParticipant, 'joinedAt' | 'unreadCount'>[];
        metadata?: Record<string, unknown>;
    }): Promise<{
        conversation: IConversation;
        created: boolean;
    }>;
    /**
     * List conversations for a user (for an inbox view).
     */
    getConversationsForUser(params: {
        userId: string;
        status?: ConversationStatus;
        page?: number;
        pageSize?: number;
    }): Promise<{
        data: IConversation[];
        total: number;
    }>;
    /**
     * Get a single conversation by ID.
     */
    getConversation(conversationId: string): Promise<IConversation | null>;
    /**
     * Get a single conversation by its context (e.g. contextType='consultation',
     * contextId=<consultationId>). Lets the frontend open a case's chat when it
     * only has the consultation ID on hand (e.g. from the consultations list).
     */
    getConversationByContext(contextType: string, contextId: string): Promise<IConversation | null>;
    /**
     * Fetch paginated message history (for REST endpoints or initial page load).
     */
    getMessages(params: {
        conversationId: string;
        before?: string;
        limit?: number;
    }): Promise<IMessage[]>;
    /**
     * Send a message programmatically (e.g. system notifications).
     * The message is persisted and pushed to connected sockets.
     */
    sendSystemMessage(params: {
        conversationId: string;
        content: string;
        metadata?: Record<string, unknown>;
    }): Promise<IMessage>;
    /**
     * Close a conversation (e.g. consultation ended).
     * Emits a system message and status change event.
     */
    closeConversation(conversationId: string, reason?: string): Promise<void>;
    /**
     * Check if a user is currently online.
     */
    isUserOnline(userId: string): Promise<boolean>;
    /**
     * Get presence info for multiple users at once.
     */
    getPresenceBulk(userIds: string[]): Promise<Record<string, IPresence>>;
    /**
     * Push a notification to all connected sockets for a user
     * without going through a conversation (e.g. system alerts).
     */
    emitToUser(userId: string, event: string, data: unknown): void;
    /**
     * Access the raw Socket.io Server instance for advanced use cases.
     */
    get socketServer(): Server;
}
//# sourceMappingURL=ChatService.d.ts.map