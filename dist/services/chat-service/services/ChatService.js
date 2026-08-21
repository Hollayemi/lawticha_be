"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = exports.ChatConversationModel = exports.ChatMessageModel = void 0;
const socket_io_1 = require("socket.io");
const ioredis_1 = require("ioredis");
const chat_repository_1 = require("../handlers/chat.repository");
const presence_manager_1 = require("../utils/presence.manager");
const socket_auth_1 = require("../middleware/socket.auth");
const socket_handlers_1 = require("../handlers/socket.handlers");
var chat_model_1 = require("../models/chat.model");
Object.defineProperty(exports, "ChatMessageModel", { enumerable: true, get: function () { return chat_model_1.ChatMessageModel; } });
Object.defineProperty(exports, "ChatConversationModel", { enumerable: true, get: function () { return chat_model_1.ChatConversationModel; } });
__exportStar(require("../types/chat.types"), exports);
class ChatService {
    constructor(httpServer, config) {
        // ── Resolve config with defaults ─────────────────────────────────────────
        this.config = {
            redisUrl: config.redisUrl,
            jwtSecret: config.jwtSecret ?? process.env.JWT_SECRET ?? '',
            presenceTtlSeconds: config.presenceTtlSeconds ?? 30,
            heartbeatIntervalMs: config.heartbeatIntervalMs ?? 20000,
            corsOrigins: config.corsOrigins ?? '*',
            messagesPageSize: config.messagesPageSize ?? 50,
        };
        console.log(this.config);
        // ── Redis ────────────────────────────────────────────────────────────────
        this.redis = new ioredis_1.Redis(this.config.redisUrl, {
            lazyConnect: true,
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
        });
        // ── Domain layer ─────────────────────────────────────────────────────────
        this.repo = new chat_repository_1.ChatRepository();
        this.presence = new presence_manager_1.PresenceManager(this.redis, this.config.presenceTtlSeconds);
        // ── Socket.io ────────────────────────────────────────────────────────────
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: this.config.corsOrigins,
                methods: ['GET', 'POST'],
                credentials: true,
            },
            transports: ['websocket', 'polling'],
            pingTimeout: this.config.heartbeatIntervalMs * 2,
            pingInterval: this.config.heartbeatIntervalMs,
        });
    }
    async init() {
        await this.redis.connect();
        console.log('[ChatService] Redis connected.');
        this._attachAuthMiddleware();
        this._attachConnectionHandler();
        console.log('[ChatService] Socket.io ready.');
    }
    // Gracefully shut down the service.
    async shutdown() {
        await new Promise(resolve => this.io.close(() => resolve()));
        await this.redis.quit();
        console.log('[ChatService] Shut down.');
    }
    // ─── Private setup ─────────────────────────────────────────────────────────
    _attachAuthMiddleware() {
        const { jwtSecret } = this.config;
        if (!jwtSecret) {
            console.warn('[ChatService] WARNING: jwtSecret is empty. All connections will be rejected.');
        }
        this.io.use((0, socket_auth_1.createSocketAuthMiddleware)(jwtSecret));
    }
    _attachConnectionHandler() {
        this.io.on('connection', async (socket) => {
            const { userId } = socket.data.auth;
            console.log(`[ChatService] User ${userId} connected (socket ${socket.id})`);
            // Register presence
            await this.presence.setOnline(userId, socket.id);
            // Register all domain event handlers
            (0, socket_handlers_1.registerSocketHandlers)(this.io, socket, this.repo, this.presence, this.config.messagesPageSize);
        });
    }
    // ─── Public REST / Service API ─────────────────────────────────────────────
    /**
     * Create a new conversation.
     * Call this from your REST layer when a consultation is booked,
     * a support ticket is opened, etc.
     */
    async createConversation(params) {
        return this.repo.createConversation(params);
    }
    /**
     * Find or create a conversation tied to a specific context
     * (e.g. one conversation per consultation).
     */
    async findOrCreateConversation(params) {
        return this.repo.findOrCreateByContext(params);
    }
    /**
     * List conversations for a user (for an inbox view).
     */
    async getConversationsForUser(params) {
        return this.repo.listConversationsForUser(params);
    }
    /**
     * Get a single conversation by ID.
     */
    async getConversation(conversationId) {
        return this.repo.getConversationById(conversationId);
    }
    /**
     * Get a single conversation by its context (e.g. contextType='consultation',
     * contextId=<consultationId>). Lets the frontend open a case's chat when it
     * only has the consultation ID on hand (e.g. from the consultations list).
     */
    async getConversationByContext(contextType, contextId) {
        return this.repo.findByContext(contextType, contextId);
    }
    /**
     * Fetch paginated message history (for REST endpoints or initial page load).
     */
    async getMessages(params) {
        return this.repo.getMessages(params);
    }
    /**
     * Send a message programmatically (e.g. system notifications).
     * The message is persisted and pushed to connected sockets.
     */
    async sendSystemMessage(params) {
        const message = await this.repo.createMessage({
            conversationId: params.conversationId,
            senderId: '000000000000000000000000', // system user id
            senderRole: 'admin',
            senderName: 'System',
            content: params.content,
            type: 'system',
        });
        await this.repo.touchConversation(params.conversationId, {
            content: message.content,
            senderId: message.senderId.toString(),
            senderName: 'System',
            type: 'system',
        });
        // Push to all connected participants
        this.io
            .to(`conv:${params.conversationId}`)
            .emit('message:received', { message, conversationId: params.conversationId });
        return message;
    }
    /**
     * Close a conversation (e.g. consultation ended).
     * Emits a system message and status change event.
     */
    async closeConversation(conversationId, reason) {
        await this.repo.updateConversationStatus(conversationId, 'closed');
        if (reason) {
            await this.sendSystemMessage({
                conversationId,
                content: reason,
            });
        }
        this.io
            .to(`conv:${conversationId}`)
            .emit('conversation:updated', {
            conversation: { _id: conversationId, status: 'closed' },
        });
    }
    /**
     * Check if a user is currently online.
     */
    async isUserOnline(userId) {
        return this.presence.isOnline(userId);
    }
    /**
     * Get presence info for multiple users at once.
     */
    async getPresenceBulk(userIds) {
        return this.presence.getPresenceBulk(userIds);
    }
    /**
     * Push a notification to all connected sockets for a user
     * without going through a conversation (e.g. system alerts).
     */
    emitToUser(userId, event, data) {
        this.io.to(`user:${userId}`).emit(event, data);
    }
    /**
     * Access the raw Socket.io Server instance for advanced use cases.
     */
    get socketServer() {
        return this.io;
    }
}
exports.ChatService = ChatService;
//# sourceMappingURL=ChatService.js.map