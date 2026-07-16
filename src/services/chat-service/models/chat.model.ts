import { Schema, model, models, Types, Document } from 'mongoose';
import {
  IMessage,
  IConversation,
  IParticipant,
  IAttachment,
  MessageStatus,
  MessageType,
  ConversationStatus,
  ParticipantRole,
} from '../types/chat.types';

// ─── Attachment Sub-Schema ────────────────────────────────────────────────────

const AttachmentSchema = new Schema<IAttachment>(
  {
    url:       { type: String, required: true },
    name:      { type: String, required: true },
    mimeType:  { type: String, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { _id: false }
);

// ─── Message Model ────────────────────────────────────────────────────────────

export interface IMessageDocument extends Omit<IMessage, '_id'>, Document {
  _id: Types.ObjectId;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    conversationId: {
      type:     Schema.Types.ObjectId,
      ref:      'ChatConversation',
      required: true,
      index:    true,
    },
    senderId: {
      type:     Schema.Types.ObjectId,
      required: true,
      index:    true,
    },
    senderRole: {
      type:     String,
      enum:     ['citizen', 'lawyer', 'admin'] as ParticipantRole[],
      required: true,
    },
    senderName: {
      type:     String,
      required: true,
    },
    type: {
      type:    String,
      enum:    ['text', 'image', 'file', 'system'] as MessageType[],
      default: 'text',
    },
    content: {
      type:     String,
      required: true,
      trim:     true,
    },
    attachments: {
      type:    [AttachmentSchema],
      default: [],
    },
    status: {
      type:    String,
      enum:    ['sent', 'delivered', 'read'] as MessageStatus[],
      default: 'sent',
    },
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, required: true },
        readAt: { type: Date, default: Date.now },
        _id:    false,
      },
    ],
    isDeleted:  { type: Boolean, default: false },
    deletedAt:  { type: Date },
    replyTo:    { type: Schema.Types.ObjectId, ref: 'ChatMessage', default: null },
  },
  {
    timestamps: true,
    collection: 'chat_messages',
  }
);

// Indexes for efficient querying
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, isDeleted: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });

export const ChatMessageModel =
  models.ChatMessage || model<IMessageDocument>('ChatMessage', MessageSchema);

// ─── Conversation Model ───────────────────────────────────────────────────────

export interface IConversationDocument extends Omit<IConversation, '_id'>, Document {
  _id: Types.ObjectId;
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    userId:      { type: Schema.Types.ObjectId, required: true, ref: "User" },
    role:        { type: String, enum: ['citizen', 'lawyer', 'admin'], required: true },
    name:        { type: String, required: true },
    avatarUrl:   { type: String },
    joinedAt:    { type: Date, default: Date.now },
    lastSeenAt:  { type: Date },
    unreadCount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversationDocument>(
  {
    contextType: { type: String, index: true },
    contextId:   { type: Schema.Types.ObjectId, index: true, sparse: true },
    participants: {
      type:     [ParticipantSchema],
      required: true,
      validate: {
        validator: (v: IParticipant[]) => v.length >= 2,
        message: 'A conversation requires at least 2 participants.',
      },
    },
    status: {
      type:    String,
      enum:    ['active', 'closed', 'archived'] as ConversationStatus[],
      default: 'active',
      index:   true,
    },
    lastMessage: {
      content:    { type: String },
      senderId:   { type: Schema.Types.ObjectId },
      senderName: { type: String },
      type:       { type: String, enum: ['text', 'image', 'file', 'system'] },
      createdAt:  { type: Date },
    },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    isGroup:        { type: Boolean, default: false },
    groupName:      { type: String },
    groupAvatar:    { type: String },
    metadata:       { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'chat_conversations',
  }
);

// Compound index: quickly find all conversations for a user
ConversationSchema.index({ 'participants.userId': 1, lastActivityAt: -1 });
ConversationSchema.index({ 'participants.userId': 1, status: 1 });
// Unique conversation per context (e.g. one chat per consultation)
ConversationSchema.index(
  { contextType: 1, contextId: 1 },
  { unique: true, sparse: true }
);

export const ChatConversationModel =
  models.ChatConversation ||
  model<IConversationDocument>('ChatConversation', ConversationSchema);
