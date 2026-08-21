/**
 * Chat Service – Public API
 * ─────────────────────────
 * Import everything you need from this single entry point.
 *
 * ```ts
 * import { ChatService, createChatRouter } from './chat-service';
 * ```
 */
export { ChatService } from './services/ChatService';
export { createChatRouter } from './router/chat.router';
export { ChatRepository } from './handlers/chat.repository';
export { PresenceManager } from './utils/presence.manager';
export { ChatMessageModel, ChatConversationModel } from './models/chat.model';
export type { IMessage, IConversation, IParticipant, IAttachment, IPresence, ParticipantRole, MessageStatus, MessageType, ConversationStatus, SendMessagePayload, TypingPayload, MarkReadPayload, GetMessagesPayload, JoinConversationPayload, LeaveConversationPayload, MessageReceivedEvent, MessageStatusUpdatedEvent, TypingEvent, PresenceEvent, ConversationUpdatedEvent, ErrorEvent, ChatServiceConfig, SocketAuthContext, } from './types/chat.types';
//# sourceMappingURL=index.d.ts.map