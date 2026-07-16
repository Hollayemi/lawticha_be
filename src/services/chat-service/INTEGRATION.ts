/**
 * ══════════════════════════════════════════════════════════════════════════════
 * HOW TO INTEGRATE ChatService INTO LawTicha (server.ts)
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * 1.  Install dependencies:
 *       npm install socket.io ioredis
 *       npm install --save-dev @types/socket.io
 *
 * 2.  Copy the entire chat-service/ folder into your src/ directory.
 *
 * 3.  Update src/server.ts as shown below.
 *
 * 4.  When a consultation is booked (in lawyer.service.ts → bookConsultation),
 *     call chatService.findOrCreateConversation(…) to pre-create the chat room.
 */

// ─── src/server.ts (modified excerpt) ────────────────────────────────────────

/*

import http from 'http';
import { ChatService }    from './chat-service/ChatService';
import { createChatRouter } from './chat-service/chat.router';

// ... your existing imports ...

const app = express();

// ... all your existing middleware + routes ...

// ── Create HTTP server (required for Socket.io) ──────────────────────────────
const httpServer = http.createServer(app);

// ── Initialise ChatService ────────────────────────────────────────────────────
export const chatService = new ChatService(httpServer, {
  redisUrl:    process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtSecret:   process.env.JWT_SECRET,
  corsOrigins: process.env.CLIENT_URL ?? 'http://localhost:3000',
  presenceTtlSeconds:  30,
  heartbeatIntervalMs: 20_000,
  messagesPageSize:    50,
});

// ── Mount the REST chat routes ────────────────────────────────────────────────
// Both citizens and admins can use these endpoints.
// 'protect' validates the JWT and sets req.user.
app.use('/api/v1/chat', protect, createChatRouter(chatService));

// ── Error handling (keep after all routes) ────────────────────────────────────
app.use('*', handle404);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, async () => {
  await chatService.init();       // ← connects Redis + starts Socket.io
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  await chatService.shutdown();
  process.exit(0);
});

*/

// ─── Integration in lawyer.service.ts → bookConsultation ─────────────────────

/*

// At the bottom of bookConsultation(), after creating the ConsultationModel:

import { chatService } from '../server';   // or inject via DI

const lawyerUser = profile.userId as any;

await chatService.findOrCreateConversation({
  contextType:  'consultation',
  contextId:    consultation._id.toString(),
  participants: [
    {
      userId:    citizenId,
      role:      'citizen',
      name:      citizenName,           // resolve from UserModel
    },
    {
      userId:    lawyerUser._id.toString(),
      role:      'lawyer',
      name:      `${lawyerUser.firstName} ${lawyerUser.lastName}`.trim(),
      avatarUrl: lawyerUser.avatarUrl,
    },
  ],
  metadata: {
    consultationId: consultation._id.toString(),
    mode:           input.mode,
    feePaid:        feePaid,
  },
});

*/

// ─── Environment variables to add to .env ─────────────────────────────────────

/*

REDIS_URL=redis://localhost:6379

*/

// ─── Client-side Socket.io usage (React / Next.js) ───────────────────────────

/*

import { io, Socket } from 'socket.io-client';

const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL, {
  auth:       { token: accessToken },   // JWT from your login response
  transports: ['websocket'],
});

// Join a conversation room
socket.emit('conversation:join', { conversationId });

// Listen for incoming messages
socket.on('message:received', ({ message, conversationId }) => {
  console.log('New message:', message);
});

// Send a message
socket.emit('message:send', {
  conversationId,
  content: 'Hello!',
  type:    'text',
}, (ack) => {
  if (ack.success) console.log('Sent, id:', ack.messageId);
});

// Fetch history (paginated)
socket.emit('message:history', { conversationId, limit: 50 }, ({ messages }) => {
  console.log('History:', messages);
});

// Typing indicators
socket.emit('typing:start', { conversationId });
socket.on('typing',         ({ userId, userName, isTyping }) => { ... });

// Presence
socket.emit('presence:get', [userId1, userId2], ({ presence }) => { ... });
socket.on('presence:update', ({ userId, isOnline, lastSeenAt }) => { ... });

// Heartbeat (keep presence alive)
setInterval(() => socket.emit('heartbeat'), 20_000);

// Mark messages as read
socket.emit('message:read', { conversationId, messageIds: ['...', '...'] });

// Listen for read receipts
socket.on('message:status_updated', ({ conversationId, messageIds, status, userId }) => { ... });

*/

export {};   // make this a module
