import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';

import { ChatRepository } from '../handlers/chat.repository';
import { PresenceManager } from '../utils/presence.manager';
import { createSocketAuthMiddleware } from '../middleware/socket.auth';
import { registerSocketHandlers } from '../handlers/socket.handlers';
import {
  ChatServiceConfig,
  IConversation,
  IMessage,
  IPresence,
  ConversationStatus,
  IAttachment,
  MessageType,
  IParticipant,
} from '../types/chat.types';

export { ChatMessageModel, ChatConversationModel } from '../models/chat.model';
export * from '../types/chat.types';

export class ChatService {
  private io:       Server;
  private redis:    Redis;
  private repo:     ChatRepository;
  private presence: PresenceManager;
  private config:   Required<ChatServiceConfig>;

  constructor(
    httpServer: HttpServer | HttpsServer,
    config: ChatServiceConfig,
  ) {
    // ── Resolve config with defaults ─────────────────────────────────────────
    this.config = {
      redisUrl:            config.redisUrl,
      jwtSecret:           config.jwtSecret ?? process.env.JWT_SECRET ?? '',
      presenceTtlSeconds:  config.presenceTtlSeconds  ?? 30,
      heartbeatIntervalMs: config.heartbeatIntervalMs ?? 20_000,
      corsOrigins:         config.corsOrigins         ?? '*',
      messagesPageSize:    config.messagesPageSize     ?? 50,
    };

    console.log(this.config)

    // ── Redis ────────────────────────────────────────────────────────────────
    this.redis = new Redis(this.config.redisUrl, {
      lazyConnect:        true,
      maxRetriesPerRequest: 3,
      enableReadyCheck:   true,
    });

    // ── Domain layer ─────────────────────────────────────────────────────────
    this.repo     = new ChatRepository();
    this.presence = new PresenceManager(this.redis, this.config.presenceTtlSeconds);

    // ── Socket.io ────────────────────────────────────────────────────────────
    this.io = new Server(httpServer, {
      cors: {
        origin:      this.config.corsOrigins,
        methods:     ['GET', 'POST'],
        credentials: true,
      },
      transports:   ['websocket', 'polling'],
      pingTimeout:  this.config.heartbeatIntervalMs * 2,
      pingInterval: this.config.heartbeatIntervalMs,
    });
  }

  async init(): Promise<void> {
    await this.redis.connect();
    console.log('[ChatService] Redis connected.');

    this._attachAuthMiddleware();
    this._attachConnectionHandler();

    console.log('[ChatService] Socket.io ready.');
  }

  // Gracefully shut down the service.

  async shutdown(): Promise<void> {
    await new Promise<void>(resolve => this.io.close(() => resolve()));
    await this.redis.quit();
    console.log('[ChatService] Shut down.');
  }   

  // ─── Private setup ─────────────────────────────────────────────────────────

  private _attachAuthMiddleware(): void {
    const { jwtSecret } = this.config;

    if (!jwtSecret) {
      console.warn('[ChatService] WARNING: jwtSecret is empty. All connections will be rejected.');
    }

    this.io.use(createSocketAuthMiddleware(jwtSecret));
  }

  private _attachConnectionHandler(): void {
    this.io.on('connection', async (socket: Socket) => {
      const { userId } = socket.data.auth;

      console.log(`[ChatService] User ${userId} connected (socket ${socket.id})`);

      // Register presence
      await this.presence.setOnline(userId, socket.id);

      // Register all domain event handlers
      registerSocketHandlers(
        this.io,
        socket,
        this.repo,
        this.presence,
        this.config.messagesPageSize,
      );
    });
  }

  // ─── Public REST / Service API ─────────────────────────────────────────────

  /**
   * Create a new conversation.
   * Call this from your REST layer when a consultation is booked,
   * a support ticket is opened, etc.
   */
  async createConversation(params: {
    participants: Omit<IParticipant, 'joinedAt' | 'unreadCount'>[];
    contextType?: string;
    contextId?:   string;
    isGroup?:     boolean;
    groupName?:   string;
    groupAvatar?: string;
    metadata?:    Record<string, unknown>;
  }): Promise<IConversation> {
    return this.repo.createConversation(params);
  }

  /**
   * Find or create a conversation tied to a specific context
   * (e.g. one conversation per consultation).
   */
  async findOrCreateConversation(params: {
    contextType:  string;
    contextId:    string;
    participants: Omit<IParticipant, 'joinedAt' | 'unreadCount'>[];
    metadata?:    Record<string, unknown>;
  }): Promise<{ conversation: IConversation; created: boolean }> {
    return this.repo.findOrCreateByContext(params);
  }

  /**
   * List conversations for a user (for an inbox view).
   */
  async getConversationsForUser(params: {
    userId:    string;
    status?:   ConversationStatus;
    page?:     number;
    pageSize?: number;
  }): Promise<{ data: IConversation[]; total: number }> {
    return this.repo.listConversationsForUser(params);
  }

  /**
   * Get a single conversation by ID.
   */
  async getConversation(conversationId: string): Promise<IConversation | null> {
    return this.repo.getConversationById(conversationId);
  }

  /**
   * Fetch paginated message history (for REST endpoints or initial page load).
   */
  async getMessages(params: {
    conversationId: string;
    before?:        string;
    limit?:         number;
  }): Promise<IMessage[]> {
    return this.repo.getMessages(params);
  }

  /**
   * Send a message programmatically (e.g. system notifications).
   * The message is persisted and pushed to connected sockets.
   */
  async sendSystemMessage(params: {
    conversationId: string;
    content:        string;
    metadata?:      Record<string, unknown>;
  }): Promise<IMessage> {
    const message = await this.repo.createMessage({
      conversationId: params.conversationId,
      senderId:       '000000000000000000000000',    // system user id
      senderRole:     'admin',
      senderName:     'System',
      content:        params.content,
      type:           'system',
    });

    await this.repo.touchConversation(params.conversationId, {
      content:    message.content,
      senderId:   message.senderId.toString(),
      senderName: 'System',
      type:       'system',
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
  async closeConversation(conversationId: string, reason?: string): Promise<void> {
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
  async isUserOnline(userId: string): Promise<boolean> {
    return this.presence.isOnline(userId);
  }

  /**
   * Get presence info for multiple users at once.
   */
  async getPresenceBulk(userIds: string[]): Promise<Record<string, IPresence>> {
    return this.presence.getPresenceBulk(userIds);
  }

  /**
   * Push a notification to all connected sockets for a user
   * without going through a conversation (e.g. system alerts).
   */
  emitToUser(userId: string, event: string, data: unknown): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Access the raw Socket.io Server instance for advanced use cases.
   */
  get socketServer(): Server {
    return this.io;
  }
}
