import { Types } from 'mongoose';
import { ChatMessageModel, ChatConversationModel } from '../models/chat.model';
import {
  IMessage,
  IConversation,
  IParticipant,
  MessageStatus,
  ConversationStatus,
  ParticipantRole,
  IAttachment,
  MessageType,
} from '../types/chat.types';

/**
 * ChatRepository
 * ──────────────
 * All database operations for the chat service.
 * Completely decoupled from Socket.io so it can be used
 * in REST endpoints or other transports too.
 */
export class ChatRepository {
  // ─── Conversation ───────────────────────────────────────────────────────────

  /**
   * Create a new conversation between two or more participants.
   */
  async createConversation(params: {
    participants: Omit<IParticipant, 'joinedAt' | 'unreadCount'>[];
    contextType?: string;
    contextId?: string;
    isGroup?: boolean;
    groupName?: string;
    groupAvatar?: string;
    metadata?: Record<string, unknown>;
  }): Promise<IConversation> {
    const doc = await ChatConversationModel.create({
      participants: params.participants.map(p => ({
        ...p,
        userId:     new Types.ObjectId(p.userId),
        joinedAt:   new Date(),
        unreadCount: 0,
      })),
      contextType:    params.contextType,
      contextId:      params.contextId ? new Types.ObjectId(params.contextId) : undefined,
      isGroup:        params.isGroup ?? false,
      groupName:      params.groupName,
      groupAvatar:    params.groupAvatar,
      metadata:       params.metadata ?? {},
      lastActivityAt: new Date(),
    });

    return doc.toObject() as IConversation;
  }

  /**
   * Find an existing conversation by contextType + contextId.
   * Useful when one conversation maps to one consultation/support ticket.
   */
  async findByContext(contextType: string, contextId: string): Promise<IConversation | null> {
    const doc = await ChatConversationModel.findOne({
      contextType,
      contextId: new Types.ObjectId(contextId),
    }).lean();
    return doc as IConversation | null;
  }

  /**
   * Find or create a conversation by context.
   */
  async findOrCreateByContext(params: {
    contextType: string;
    contextId: string;
    participants: Omit<IParticipant, 'joinedAt' | 'unreadCount'>[];
    metadata?: Record<string, unknown>;
  }): Promise<{ conversation: IConversation; created: boolean }> {
    const existing = await this.findByContext(params.contextType, params.contextId);
    if (existing) return { conversation: existing, created: false };

    const conversation = await this.createConversation({
      contextType:  params.contextType,
      contextId:    params.contextId,
      participants: params.participants,
      metadata:     params.metadata,
    });

    return { conversation, created: true };
  }

  /**
   * Find an existing 1-to-1 conversation between two specific users.
   */
  async findDirectConversation(
    userIdA: string,
    userIdB: string,
  ): Promise<IConversation | null> {
    const doc = await ChatConversationModel.findOne({
      isGroup: false,
      'participants.userId': {
        $all: [new Types.ObjectId(userIdA), new Types.ObjectId(userIdB)],
      },
    }).populate('participants.userId').lean();
    return doc as IConversation | null;
  }

  /**
   * Get a conversation by its ID.
   */
  async getConversationById(conversationId: string): Promise<IConversation | null> {
    const doc = await ChatConversationModel.findById(conversationId).lean();
    console.log({doc})
    return doc as IConversation | null;
  }

  /**
   * List all conversations for a user, newest activity first.
   */
  async listConversationsForUser(params: {
    userId: string;
    status?: ConversationStatus;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: IConversation[]; total: number }> {
    const { userId, status = 'active', page = 1, pageSize = 20 } = params;

    console.log(params)

    const filter: Record<string, unknown> = {
      'participants.userId': new Types.ObjectId(userId),
      status,
    };

    const skip = (page - 1) * pageSize;

    const [docs, total] = await Promise.all([
      ChatConversationModel.find(filter)
        .sort({ lastActivityAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean<IConversation>(),
      ChatConversationModel.countDocuments(filter),
    ]);

    return { data: docs as any, total };
  }

  /**
   * Update a conversation's status.
   */
  async updateConversationStatus(
    conversationId: string,
    status: ConversationStatus,
  ): Promise<void> {
    await ChatConversationModel.findByIdAndUpdate(conversationId, { status });
  }

  /**
   * Verify that a user is a participant of a conversation.
   */
  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const count = await ChatConversationModel.countDocuments({
      _id:                  new Types.ObjectId(conversationId),
      'participants.userId': new Types.ObjectId(userId),
    });
    return count > 0;
  }

  /**
   * Update last activity + lastMessage snapshot on the conversation.
   * Called after every new message.
   */
  async touchConversation(
    conversationId: string,
    lastMessage: {
      content:    string;
      senderId:   string;
      senderName: string;
      type:       MessageType;
    },
  ): Promise<void> {
    await ChatConversationModel.findByIdAndUpdate(conversationId, {
      lastActivityAt: new Date(),
      lastMessage: {
        content:    lastMessage.content,
        senderId:   new Types.ObjectId(lastMessage.senderId),
        senderName: lastMessage.senderName,
        type:       lastMessage.type,
        createdAt:  new Date(),
      },
    });
  }

  /**
   * Increment unread count for all participants EXCEPT the sender.
   */
  async incrementUnreadForOthers(conversationId: string, senderId: string): Promise<void> {
    await ChatConversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      {
        $inc: {
          'participants.$[other].unreadCount': 1,
        },
      },
      {
        arrayFilters: [
          { 'other.userId': { $ne: new Types.ObjectId(senderId) } },
        ],
      }
    );
  }

  /**
   * Reset unread count to 0 for a specific user.
   */
  async resetUnreadCount(conversationId: string, userId: string): Promise<void> {
    await ChatConversationModel.updateOne(
      {
        _id:                  new Types.ObjectId(conversationId),
        'participants.userId': new Types.ObjectId(userId),
      },
      { $set: { 'participants.$.unreadCount': 0 } }
    );
  }

  /**
   * Update a participant's lastSeenAt timestamp.
   */
  async updateParticipantLastSeen(conversationId: string, userId: string): Promise<void> {
    await ChatConversationModel.updateOne(
      {
        _id:                  new Types.ObjectId(conversationId),
        'participants.userId': new Types.ObjectId(userId),
      },
      { $set: { 'participants.$.lastSeenAt': new Date() } }
    );
  }

  // ─── Messages ───────────────────────────────────────────────────────────────

  /**
   * Persist a new message.
   */
  async createMessage(params: {
    conversationId: string;
    senderId:       string;
    senderRole:     ParticipantRole;
    senderName:     string;
    content:        string;
    type?:          MessageType;
    attachments?:   IAttachment[];
    replyTo?:       string;
  }): Promise<IMessage> {
    console.log('hereeeeeeeeeeeeeeeeeeeeeeee')
    const doc = await ChatMessageModel.create({
      conversationId: new Types.ObjectId(params.conversationId),
      senderId:       new Types.ObjectId(params.senderId),
      senderRole:     params.senderRole,
      senderName:     params.senderName,
      content:        params.content,
      type:           params.type ?? 'text',
      attachments:    params.attachments ?? [],
      replyTo:        params.replyTo ? new Types.ObjectId(params.replyTo) : undefined,
      status:         'sent',
      readBy:         [],
    });

    return doc.toObject() as IMessage;
  }

  /**
   * Paginate messages in a conversation (cursor-based, newest first).
   * Pass `before` (message _id) to get messages older than that cursor.
   */
  async getMessages(params: {
    conversationId: string;
    before?:        string;
    limit?:         number;
  }): Promise<IMessage[]> {
    const { conversationId, before, limit = 50 } = params;

    const filter: Record<string, unknown> = {
      conversationId: new Types.ObjectId(conversationId),
      isDeleted:      false,
    };

    if (before) {
      filter._id = { $lt: new Types.ObjectId(before) };
    }

    const docs = await ChatMessageModel
      .find(filter)
      .sort({ _id: -1 })          // newest first so pagination works intuitively
      .limit(limit)
      .lean();

    // Reverse so caller gets oldest → newest in the page
    return (docs as any[]).reverse();
  }

  /**
   * Mark messages as delivered for a user.
   */
  async markDelivered(conversationId: string, userId: string): Promise<void> {
    await ChatMessageModel.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        senderId:       { $ne: new Types.ObjectId(userId) },
        status:         'sent',
      },
      { $set: { status: 'delivered' } }
    );
  }

  /**
   * Mark specific messages as read by a user.
   */
  async markRead(params: {
    conversationId: string;
    messageIds:     string[];
    userId:         string;
  }): Promise<void> {
    const { conversationId, messageIds, userId } = params;
    const now = new Date();

    await ChatMessageModel.updateMany(
      {
        _id:            { $in: messageIds.map(id => new Types.ObjectId(id)) },
        conversationId: new Types.ObjectId(conversationId),
        senderId:       { $ne: new Types.ObjectId(userId) },
        'readBy.userId': { $ne: new Types.ObjectId(userId) },
      },
      {
        $set:  { status: 'read' },
        $push: { readBy: { userId: new Types.ObjectId(userId), readAt: now } },
      }
    );
  }

  /**
   * Soft-delete a message (sender only).
   */
  async deleteMessage(messageId: string, senderId: string): Promise<boolean> {
    const result = await ChatMessageModel.updateOne(
      {
        _id:      new Types.ObjectId(messageId),
        senderId: new Types.ObjectId(senderId),
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          content:   '[Message deleted]',
        },
      }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Count unread messages in a conversation for a specific user.
   */
  async countUnread(conversationId: string, userId: string): Promise<number> {
    return ChatMessageModel.countDocuments({
      conversationId: new Types.ObjectId(conversationId),
      senderId:       { $ne: new Types.ObjectId(userId) },
      isDeleted:      false,
      'readBy.userId': { $ne: new Types.ObjectId(userId) },
    });
  }

  /**
   * Get the latest message in a conversation (for preview).
   */
  async getLatestMessage(conversationId: string): Promise<IMessage | null> {
    const doc = await ChatMessageModel
      .findOne({ conversationId: new Types.ObjectId(conversationId), isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();
    return doc as IMessage | null;
  }
}
