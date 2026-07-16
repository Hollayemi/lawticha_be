import { Types } from 'mongoose';

// ─── Participant Role ─────────────────────────────────────────────────────────

export type ParticipantRole = 'citizen' | 'lawyer' | 'admin';

// ─── Message Status ───────────────────────────────────────────────────────────

export type MessageStatus = 'sent' | 'delivered' | 'read';

// ─── Message Types ────────────────────────────────────────────────────────────

export type MessageType = 'text' | 'image' | 'file' | 'system';

// ─── Conversation Status ──────────────────────────────────────────────────────

export type ConversationStatus = 'active' | 'closed' | 'archived';

// ─── Attachment ───────────────────────────────────────────────────────────────

export interface IAttachment {
  url: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
}

// ─── Message ─────────────────────────────────────────────────────────────────

export interface IMessage {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderRole: ParticipantRole;
  senderName: string;
  type: MessageType;
  content: string;
  attachments: IAttachment[];
  status: MessageStatus;
  readBy: {
    userId: Types.ObjectId;
    readAt: Date;
  }[];
  isDeleted: boolean;
  deletedAt?: Date;
  replyTo?: Types.ObjectId;   // parent message id for thread replies
  createdAt: Date;
  updatedAt: Date;
}

// ─── Participant ──────────────────────────────────────────────────────────────

export interface IParticipant {
  userId: Types.ObjectId;
  role: ParticipantRole;
  name: string;
  avatarUrl?: string;
  joinedAt: Date;
  lastSeenAt?: Date;
  isOnline?: boolean;           // resolved from Redis, not stored in Mongo
  unreadCount: number;
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export interface IConversation {
  _id: Types.ObjectId;
  /**
   * Optional reference to a consultation or any external entity.
   * Makes the service reusable across projects.
   */
  contextType?: string;         // e.g. 'consultation', 'support', 'general'
  contextId?: Types.ObjectId;
  participants: IParticipant[];
  status: ConversationStatus;
  lastMessage?: {
    content: string;
    senderId: Types.ObjectId;
    senderName: string;
    type: MessageType;
    createdAt: Date;
  };
  lastActivityAt: Date;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  metadata?: Record<string, unknown>;  // project-specific extra data
  createdAt: Date;
  updatedAt: Date;
}

// ─── Presence ─────────────────────────────────────────────────────────────────

export interface IPresence {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string;           // ISO string
  socketId?: string;
}

// ─── Socket Payloads (Client → Server) ───────────────────────────────────────

export interface JoinConversationPayload {
  conversationId: string;
}

export interface LeaveConversationPayload {
  conversationId: string;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  type?: MessageType;
  attachments?: IAttachment[];
  replyTo?: string;
}

export interface TypingPayload {
  conversationId: string;
}

export interface MarkReadPayload {
  conversationId: string;
  messageIds: string[];
}

export interface GetMessagesPayload {
  conversationId: string;
  before?: string;              // cursor: message _id to paginate backward
  limit?: number;
}

// ─── Socket Events (Server → Client) ─────────────────────────────────────────

export interface MessageReceivedEvent {
  message: IMessage;
  conversationId: string;
}

export interface MessageStatusUpdatedEvent {
  conversationId: string;
  messageIds: string[];
  status: MessageStatus;
  userId: string;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface PresenceEvent {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string;
}

export interface ConversationUpdatedEvent {
  conversation: Partial<IConversation>;
}

export interface ErrorEvent {
  code: string;
  message: string;
}

// ─── ChatService Config ───────────────────────────────────────────────────────

export interface ChatServiceConfig {
  /**
   * Redis connection URL.
   * e.g. 'redis://localhost:6379'
   */
  redisUrl: string;

  /**
   * JWT secret used to authenticate socket connections.
   * Defaults to process.env.JWT_SECRET.
   */
  jwtSecret?: string;

  /**
   * Presence TTL in seconds. How long a user is considered "online"
   * after their last heartbeat. Default: 30 seconds.
   */
  presenceTtlSeconds?: number;

  /**
   * How often the client should send a heartbeat ping (ms). Default: 20000.
   */
  heartbeatIntervalMs?: number;

  /**
   * Allowed origins for Socket.io CORS. Default: '*'.
   */
  corsOrigins?: string | string[];

  /**
   * Max messages per page when fetching history. Default: 50.
   */
  messagesPageSize?: number;
}

// ─── Auth Context attached to every authenticated socket ─────────────────────

export interface SocketAuthContext {
  userId: string;
  role: ParticipantRole;
  name: string;
  avatarUrl?: string;
}
