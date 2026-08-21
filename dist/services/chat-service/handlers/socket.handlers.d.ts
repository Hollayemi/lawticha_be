import { Server, Socket } from 'socket.io';
import { ChatRepository } from './chat.repository';
import { PresenceManager } from '../utils/presence.manager';
/**
 * Registers all Socket.io event handlers for a single connected socket.
 * Called once per authenticated connection.
 */
export declare function registerSocketHandlers(io: Server, socket: Socket, repo: ChatRepository, presence: PresenceManager, pageSize: number): void;
//# sourceMappingURL=socket.handlers.d.ts.map