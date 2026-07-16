/**
 * Chat Service – Public API
 * ─────────────────────────
 * Import everything you need from this single entry point.
 *
 * ```ts
 * import { ChatService, createChatRouter } from './chat-service';
 * ```
 */

export { ChatService }         from './services/ChatService';
export { createChatRouter }    from './router/chat.router';
export { ChatRepository }      from './handlers/chat.repository';
export { PresenceManager }     from './utils/presence.manager';

// Models (register with Mongoose automatically on import)
export { ChatMessageModel, ChatConversationModel } from './models/chat.model';

// All TypeScript types
export type {
  // Core domain types
  IMessage,
  IConversation,
  IParticipant,
  IAttachment,
  IPresence,

  // Enums / union types
  ParticipantRole,
  MessageStatus,
  MessageType,
  ConversationStatus,

  // Socket payload shapes
  SendMessagePayload,
  TypingPayload,
  MarkReadPayload,
  GetMessagesPayload,
  JoinConversationPayload,
  LeaveConversationPayload,

  // Socket event shapes
  MessageReceivedEvent,
  MessageStatusUpdatedEvent,
  TypingEvent,
  PresenceEvent,
  ConversationUpdatedEvent,
  ErrorEvent,

  // Config & auth
  ChatServiceConfig,
  SocketAuthContext,
} from './types/chat.types';
