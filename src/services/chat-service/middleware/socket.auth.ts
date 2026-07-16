import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SocketAuthContext } from '../types/chat.types';

/**
 * Socket.io authentication middleware.
 *
 * Clients must pass a valid JWT either:
 *   - In the handshake auth object:  socket.auth = { token: '...' }
 *   - As a query param:              ?token=...
 *
 * On success, `socket.data.auth` is populated with the decoded context.
 */
export function createSocketAuthMiddleware(jwtSecret: string) {
  return (socket: Socket, next: (err?: Error) => void): void => {
    try {
      const token: string | undefined =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token as string;

      if (!token) {
        return next(new Error('AUTH_MISSING: No token provided.'));
      }

      const decoded = jwt.verify(token, jwtSecret) as {
        id:       string;
        role?:    string;
        name?:    string;
        avatarUrl?: string;
      };

      const auth: SocketAuthContext = {
        userId:    decoded.id,
        role:      (decoded.role as SocketAuthContext['role']) ?? 'citizen',
        name:      decoded.name ?? 'User',
        avatarUrl: decoded.avatarUrl,
      };

      socket.data.auth = auth;
      next();
    } catch (err: any) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'AUTH_EXPIRED: Token has expired.'
          : 'AUTH_INVALID: Invalid token.';
      next(new Error(message));
    }
  };
}
