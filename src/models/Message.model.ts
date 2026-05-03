import { Schema, model, models } from 'mongoose';
import { IMessage, IConversation } from './types';

/**
 * CONVERSATION
 * A thread between a citizen and a lawyer — tied to a Consultation.
 * One consultation → one conversation.
 *
 * From: dashboard/messages/page.tsx (implied)
 *       dashboard/layer/page.tsx → MESSAGES list (preview, unread count, typing)
 *       dashboard/activities/page.tsx → "Open Messages" button
 */
const ConversationSchema = new Schema<IConversation>(
  {
    consultationId: {
      type: Schema.Types.ObjectId,
      ref: 'Consultation',
      required: true,
      unique: true,
      index: true,
    },
    participantIds: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    // For O(1) lookup: "is this user in this conversation?"
    citizenId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lawyerId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    lastMessageAt:      { type: Date },
    lastMessagePreview: { type: String },  // truncated text for inbox list
    isArchivedByCitizen: { type: Boolean, default: false },
    isArchivedByLawyer:  { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'conversations',
  }
);

ConversationSchema.index({ citizenId: 1, lastMessageAt: -1 });
ConversationSchema.index({ lawyerId: 1, lastMessageAt: -1 });

export const ConversationModel =
  models.Conversation || model<IConversation>('Conversation', ConversationSchema);

// 

/**
 * MESSAGE
 * Individual message within a Conversation.
 *
 * From: dashboard/messages/page.tsx
 *       dashboard/layer/page.tsx → "Typing…" indicator, unread count
 */
const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['citizen', 'lawyer'],
      required: true,
    },

    body:        { type: String, required: true },
    attachments: [{ url: String, name: String, mimeType: String, sizeBytes: Number }],

    isRead:    { type: Boolean, default: false },
    readAt:    { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'messages',
  }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ conversationId: 1, isRead: 1 });

export const MessageModel =
  models.Message || model<IMessage>('Message', MessageSchema);
