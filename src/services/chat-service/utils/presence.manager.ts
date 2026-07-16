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
export class PresenceManager {
  private redis: Redis;
  private ttlSeconds: number;

  private static PRESENCE_KEY = (uid: string) => `chat:presence:${uid}`;
  private static SOCKET_KEY   = (sid: string) => `chat:socket:${sid}`;
  private static USER_SOCKETS = (uid: string) => `chat:user_sockets:${uid}`;

  constructor(redis: Redis, ttlSeconds: number = 30) {
    this.redis      = redis;
    this.ttlSeconds = ttlSeconds;
  }

  /**
   * Mark a user as online and store their socket mapping.
   */
  async setOnline(userId: string, socketId: string): Promise<void> {
    const presence: IPresence = {
      userId,
      isOnline:   true,
      lastSeenAt: new Date().toISOString(),
      socketId,
    };

    const pipeline = this.redis.pipeline();

    // Presence record (refreshed on every heartbeat)
    pipeline.set(
      PresenceManager.PRESENCE_KEY(userId),
      JSON.stringify(presence),
      'EX',
      this.ttlSeconds
    );

    // Reverse lookup: socket → user
    pipeline.set(
      PresenceManager.SOCKET_KEY(socketId),
      userId,
      'EX',
      this.ttlSeconds + 5
    );

    // Set of sockets for this user (TTL slightly longer than presence)
    pipeline.sadd(PresenceManager.USER_SOCKETS(userId), socketId);
    pipeline.expire(PresenceManager.USER_SOCKETS(userId), this.ttlSeconds + 5);

    await pipeline.exec();
  }

  /**
   * Refresh a user's presence TTL (called on heartbeat).
   */
  async heartbeat(userId: string, socketId: string): Promise<void> {
    const raw = await this.redis.get(PresenceManager.PRESENCE_KEY(userId));
    const presence: IPresence = raw
      ? { ...JSON.parse(raw), lastSeenAt: new Date().toISOString() }
      : { userId, isOnline: true, lastSeenAt: new Date().toISOString(), socketId };

    const pipeline = this.redis.pipeline();
    pipeline.set(
      PresenceManager.PRESENCE_KEY(userId),
      JSON.stringify(presence),
      'EX',
      this.ttlSeconds
    );
    pipeline.expire(PresenceManager.SOCKET_KEY(socketId), this.ttlSeconds + 5);
    pipeline.expire(PresenceManager.USER_SOCKETS(userId), this.ttlSeconds + 5);
    await pipeline.exec();
  }

  /**
   * Remove a specific socket. If the user has no remaining sockets,
   * they are considered offline.
   * Returns true if the user went fully offline.
   */
  async removeSocket(socketId: string): Promise<{ userId: string | null; wentOffline: boolean }> {
    const userId = await this.redis.get(PresenceManager.SOCKET_KEY(socketId));
    if (!userId) return { userId: null, wentOffline: false };

    const pipeline = this.redis.pipeline();
    pipeline.del(PresenceManager.SOCKET_KEY(socketId));
    pipeline.srem(PresenceManager.USER_SOCKETS(userId), socketId);
    const results = await pipeline.exec();

    // results[1] is the srem result count — we need remaining set size
    const remainingSockets = await this.redis.scard(PresenceManager.USER_SOCKETS(userId));

    if (remainingSockets === 0) {
      // User truly offline – update presence record but keep lastSeenAt
      const raw = await this.redis.get(PresenceManager.PRESENCE_KEY(userId));
      const presence: IPresence = raw
        ? { ...JSON.parse(raw), isOnline: false, socketId: undefined }
        : { userId, isOnline: false, lastSeenAt: new Date().toISOString() };

      // Keep the presence key briefly so others can see "last seen"
      await this.redis.set(
        PresenceManager.PRESENCE_KEY(userId),
        JSON.stringify({ ...presence, lastSeenAt: new Date().toISOString() }),
        'EX',
        60 * 60 // 1 hour last-seen window
      );

      return { userId, wentOffline: true };
    }

    return { userId, wentOffline: false };
  }

  /**
   * Get presence info for one user.
   */
  async getPresence(userId: string): Promise<IPresence> {
    const raw = await this.redis.get(PresenceManager.PRESENCE_KEY(userId));
    if (!raw) {
      return { userId, isOnline: false, lastSeenAt: new Date(0).toISOString() };
    }
    return JSON.parse(raw) as IPresence;
  }

  /**
   * Get presence info for multiple users in one round-trip.
   */
  async getPresenceBulk(userIds: string[]): Promise<Record<string, IPresence>> {
    if (!userIds.length) return {};

    const keys    = userIds.map(PresenceManager.PRESENCE_KEY);
    const results = await this.redis.mget(...keys);
    const map: Record<string, IPresence> = {};

    for (let i = 0; i < userIds.length; i++) {
      const raw = results[i];
      map[userIds[i]] = raw
        ? (JSON.parse(raw) as IPresence)
        : { userId: userIds[i], isOnline: false, lastSeenAt: new Date(0).toISOString() };
    }

    return map;
  }

  /**
   * Check if a user is online.
   */
  async isOnline(userId: string): Promise<boolean> {
    const presence = await this.getPresence(userId);
    return presence.isOnline;
  }

  /**
   * Get all active socket IDs for a user (useful for targeting specific tabs).
   */
  async getUserSockets(userId: string): Promise<string[]> {
    return this.redis.smembers(PresenceManager.USER_SOCKETS(userId));
  }
}
