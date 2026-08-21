import { Redis } from 'ioredis';
import { IPresence } from '../types/chat.types';
/**
 * PresenceManager
 * ───────────────
 * Manages online/offline state for users via Redis.
 *
 * Key schema:
 *   chat:presence:{userId}     → JSON { isOnline, lastSeenAt, socketId }
 *   chat:socket:{socketId}     → userId  (reverse lookup for disconnects)
 *   chat:user_sockets:{userId} → Set of socketIds (supports multiple tabs)
 */
export declare class PresenceManager {
    private redis;
    private ttlSeconds;
    private static PRESENCE_KEY;
    private static SOCKET_KEY;
    private static USER_SOCKETS;
    constructor(redis: Redis, ttlSeconds?: number);
    /**
     * Mark a user as online and store their socket mapping.
     */
    setOnline(userId: string, socketId: string): Promise<void>;
    /**
     * Refresh a user's presence TTL (called on heartbeat).
     */
    heartbeat(userId: string, socketId: string): Promise<void>;
    /**
     * Remove a specific socket. If the user has no remaining sockets,
     * they are considered offline.
     * Returns true if the user went fully offline.
     */
    removeSocket(socketId: string): Promise<{
        userId: string | null;
        wentOffline: boolean;
    }>;
    /**
     * Get presence info for one user.
     */
    getPresence(userId: string): Promise<IPresence>;
    /**
     * Get presence info for multiple users in one round-trip.
     */
    getPresenceBulk(userIds: string[]): Promise<Record<string, IPresence>>;
    /**
     * Check if a user is online.
     */
    isOnline(userId: string): Promise<boolean>;
    /**
     * Get all active socket IDs for a user (useful for targeting specific tabs).
     */
    getUserSockets(userId: string): Promise<string[]>;
}
//# sourceMappingURL=presence.manager.d.ts.map