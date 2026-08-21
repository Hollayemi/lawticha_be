"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSocketAuthMiddleware = createSocketAuthMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Socket.io authentication middleware.
 *
 * Clients must pass a valid JWT either:
 *   - In the handshake auth object:  socket.auth = { token: '...' }
 *   - As a query param:              ?token=...
 *
 * On success, `socket.data.auth` is populated with the decoded context.
 */
function createSocketAuthMiddleware(jwtSecret) {
    return (socket, next) => {
        try {
            const token = socket.handshake.auth?.token ||
                socket.handshake.query?.token;
            if (!token) {
                return next(new Error('AUTH_MISSING: No token provided.'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            const auth = {
                userId: decoded.id,
                role: decoded.role ?? 'citizen',
                name: decoded.name ?? 'User',
                avatarUrl: decoded.avatarUrl,
            };
            socket.data.auth = auth;
            next();
        }
        catch (err) {
            const message = err.name === 'TokenExpiredError'
                ? 'AUTH_EXPIRED: Token has expired.'
                : 'AUTH_INVALID: Invalid token.';
            next(new Error(message));
        }
    };
}
//# sourceMappingURL=socket.auth.js.map