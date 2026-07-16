import { Server, Socket } from 'socket.io';
import { ChatRepository } from './chat.repository';
import { PresenceManager } from '../utils/presence.manager';
import {
  SendMessagePayload,
  TypingPayload,
  MarkReadPayload,
  GetMessagesPayload,
  JoinConversationPayload,
  LeaveConversationPayload,
  SocketAuthContext,
} from '../types/chat.types';

/**
 * Registers all Socket.io event handlers for a single connected socket.
 * Called once per authenticated connection.
 */
export function registerSocketHandlers(
  io:           Server,
  socket:       Socket,
  repo:         ChatRepository,
  presence:     PresenceManager,
  pageSize:     number,
): void {
  const auth = socket.data.auth as SocketAuthContext;
  const { userId, role, name } = auth;

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function emitError(code: string, message: string): void {
    socket.emit('error', { code, message });
  }

  async function assertParticipant(conversationId: string): Promise<boolean> {
    const ok = await repo.isParticipant(conversationId, userId);
    if (!ok) emitError('FORBIDDEN', 'You are not a participant of this conversation.');
    return ok;
  }

  // ─── Connection setup ───────────────────────────────────────────────────────

  // Auto-join a personal room so we can target this user across sockets
  socket.join(`user:${userId}`);

  // Mark delivered for any conversations this user is in
  // (Fire-and-forget — best effort on connect)
  (async () => {
    try {
      const { data: conversations } = await repo.listConversationsForUser({ userId });
      for (const conv of conversations) {
        const convId = conv._id.toString();
        await repo.markDelivered(convId, userId);
        io.to(`user:${userId}`).emit('messages:delivered', { conversationId: convId });
      }
    } catch { /* ignore */ }
  })();

  // Broadcast online status to all rooms this user participates in
  io.emit('presence:update', {
    userId,
    isOnline:   true,
    lastSeenAt: new Date().toISOString(),
  });

  // ─── join_conversation ──────────────────────────────────────────────────────

  socket.on(
    'conversation:join',
    async ({ conversationId }: JoinConversationPayload) => {
      if (!conversationId) return emitError('VALIDATION', 'conversationId is required.');
      if (!(await assertParticipant(conversationId))) return;

      socket.join(`conv:${conversationId}`);

      // Reset unread + update lastSeen
      await Promise.all([
        repo.resetUnreadCount(conversationId, userId),
        repo.updateParticipantLastSeen(conversationId, userId),
      ]);

      socket.emit('conversation:joined', { conversationId });
    }
  );

  // ─── leave_conversation ─────────────────────────────────────────────────────

  socket.on(
    'conversation:leave',
    ({ conversationId }: LeaveConversationPayload) => {
      socket.leave(`conv:${conversationId}`);
      socket.emit('conversation:left', { conversationId });
    }
  );

  // ─── message:send ───────────────────────────────────────────────────────────

  socket.on(
    'message:send',
    async (payload: SendMessagePayload, ack?: (res: unknown) => void) => {
      const { conversationId, content, type = 'text', attachments = [], replyTo } = payload;

      // Validation
      if (!conversationId) return emitError('VALIDATION', 'conversationId is required.');
      if (!content?.trim() && !attachments.length) {
        return emitError('VALIDATION', 'Message content or attachment is required.');
      }
      if (!(await assertParticipant(conversationId))) return;

      // Check conversation is still active
      const conversation = await repo.getConversationById(conversationId);
      if (!conversation || conversation.status !== 'active') {
        return emitError('CONVERSATION_CLOSED', 'This conversation is no longer active.');
      }

      try {
        // Persist message
        const message = await repo.createMessage({
          conversationId,
          senderId:   userId,
          senderRole: role,
          senderName: name,
          content:    content?.trim() ?? '',
          type,
          attachments,
          replyTo,
        });

        // Update conversation snapshot + unread counts
        await Promise.all([
          repo.touchConversation(conversationId, {
            content:    message.content,
            senderId:   userId,
            senderName: name,
            type:       message.type,
          }),
          repo.incrementUnreadForOthers(conversationId, userId),
        ]);

        const event = { message, conversationId };

        // Deliver to everyone in the conversation room (including sender)
        io.to(`conv:${conversationId}`).emit('message:received', event);

        // Also push to each participant's personal room
        // so they receive it even if they haven't joined the conv room yet
        const updatedConv = await repo.getConversationById(conversationId);
        if (updatedConv) {
          for (const p of updatedConv.participants) {
            const pid = p.userId.toString();
            if (pid !== userId) {
              io.to(`user:${pid}`).emit('message:received', event);
            }
          }
        }

        // Acknowledge to sender
        if (ack) ack({ success: true, messageId: message._id });
      } catch (err: any) {
        console.error('[ChatService] message:send error', err);
        if (ack) ack({ success: false, error: 'Failed to send message.' });
        emitError('SERVER_ERROR', 'Failed to send message.');
      }
    }
  );

  // ─── message:get_history ────────────────────────────────────────────────────

  socket.on(
    'message:history',
    async (payload: GetMessagesPayload, ack?: (res: unknown) => void) => {
      const { conversationId, before, limit } = payload;
      if (!conversationId) return emitError('VALIDATION', 'conversationId is required.');
      if (!(await assertParticipant(conversationId))) return;

      try {
        const messages = await repo.getMessages({
          conversationId,
          before,
          limit: limit ?? pageSize,
        });

        if (ack) ack({ success: true, messages });
      } catch (err) {
        console.error('[ChatService] message:history error', err);
        if (ack) ack({ success: false, error: 'Failed to fetch messages.' });
      }
    }
  );

  // ─── message:read ───────────────────────────────────────────────────────────

  socket.on(
    'message:read',
    async (payload: MarkReadPayload) => {
      const { conversationId, messageIds } = payload;
      if (!conversationId || !messageIds?.length) return;
      if (!(await assertParticipant(conversationId))) return;

      try {
        await Promise.all([
          repo.markRead({ conversationId, messageIds, userId }),
          repo.resetUnreadCount(conversationId, userId),
          repo.updateParticipantLastSeen(conversationId, userId),
        ]);

        // Notify others in the room that messages were read
        socket.to(`conv:${conversationId}`).emit('message:status_updated', {
          conversationId,
          messageIds,
          status: 'read',
          userId,
        });
      } catch (err) {
        console.error('[ChatService] message:read error', err);
      }
    }
  );

  // ─── typing:start / typing:stop ─────────────────────────────────────────────

  socket.on('typing:start', ({ conversationId }: TypingPayload) => {
    socket.to(`conv:${conversationId}`).emit('typing', {
      conversationId,
      userId,
      userName:  name,
      isTyping:  true,
    });
  });

  socket.on('typing:stop', ({ conversationId }: TypingPayload) => {
    socket.to(`conv:${conversationId}`).emit('typing', {
      conversationId,
      userId,
      userName:  name,
      isTyping:  false,
    });
  });

  // ─── presence:get ───────────────────────────────────────────────────────────

  socket.on(
    'presence:get',
    async (userIds: string[], ack?: (res: unknown) => void) => {
      if (!Array.isArray(userIds)) return;
      const presenceMap = await presence.getPresenceBulk(userIds);
      if (ack) ack({ presence: presenceMap });
    }
  );

  // ─── heartbeat ──────────────────────────────────────────────────────────────

  socket.on('heartbeat', async () => {
    await presence.heartbeat(userId, socket.id);
    socket.emit('heartbeat:ack');
  });

  // ─── message:delete ─────────────────────────────────────────────────────────

  socket.on(
    'message:delete',
    async (
      { conversationId, messageId }: { conversationId: string; messageId: string },
      ack?: (res: unknown) => void
    ) => {
      if (!conversationId || !messageId) return;
      if (!(await assertParticipant(conversationId))) return;

      const deleted = await repo.deleteMessage(messageId, userId);
      if (deleted) {
        io.to(`conv:${conversationId}`).emit('message:deleted', {
          conversationId,
          messageId,
          deletedBy: userId,
        });
        if (ack) ack({ success: true });
      } else {
        if (ack) ack({ success: false, error: 'Cannot delete this message.' });
      }
    }
  );

  // ─── disconnect ─────────────────────────────────────────────────────────────

  socket.on('disconnect', async () => {
    const { wentOffline } = await presence.removeSocket(socket.id);

    if (wentOffline) {
      const lastSeenAt = new Date().toISOString();

      // Broadcast offline status
      io.emit('presence:update', { userId, isOnline: false, lastSeenAt });

      // Update lastSeenAt in all active conversations
      try {
        const { data: conversations } = await repo.listConversationsForUser({ userId });
        await Promise.all(
          conversations.map(c =>
            repo.updateParticipantLastSeen(c._id.toString(), userId)
          )
        );
      } catch { /* ignore */ }
    }
  });
}
