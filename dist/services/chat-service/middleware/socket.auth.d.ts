import { Socket } from 'socket.io';
/**
 * Socket.io authentication middleware.
 *
 * Clients must pass a valid JWT either:
 *   - In the handshake auth object:  socket.auth = { token: '...' }
 *   - As a query param:              ?token=...
 *
 * On success, `socket.data.auth` is populated with the decoded context.
 */
export declare function createSocketAuthMiddleware(jwtSecret: string): (socket: Socket, next: (err?: Error) => void) => void;
//# sourceMappingURL=socket.auth.d.ts.map