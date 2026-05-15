import { Schema, model, models, Types } from 'mongoose';
import { 
  CommunityRoomType, 
  ReferenceType, 
  CommunityUser, 
  CommunityReference,
  ICommunityPost,
  ICommunityComment
} from './types/community.types';

// User reference schema (denormalized for performance)
const CommunityUserSchema = new Schema<CommunityUser>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  avatar: { type: String },
  role: { type: String, enum: ['citizen', 'lawyer', 'admin', 'moderator'], default: 'citizen' },
  isVerified: { type: Boolean, default: false },
  badge: { type: String },
  lawFirm: { type: String },
  yearsOfExperience: { type: Number },
}, { _id: false });

// Reference schema for linking to modules/topics/subtopics
const CommunityReferenceSchema = new Schema<CommunityReference>({
  type: { type: String, enum: ['module', 'topic', 'subtopic'], required: true },
  id: { type: Schema.Types.ObjectId, required: true, refPath: 'referenceModel' },
  referenceModel: { type: String, required: true },
  title: { type: String, required: true },
  slug: { type: String },
  moduleId: { type: Schema.Types.ObjectId },
  moduleTitle: { type: String },
  topicId: { type: Schema.Types.ObjectId },
  topicTitle: { type: String },
  excerpt: { type: String },
  thumbnail: { type: String },
}, { _id: false });

// Comment schema
const CommunityCommentSchema = new Schema<ICommunityComment>({
  postId: { type: Schema.Types.ObjectId, ref: 'CommunityPost', required: true, index: true },
  content: { type: String, required: true },
  author: { type: CommunityUserSchema, required: true },
  images: [{ type: String }], // Cloudinary URLs
  likes: { type: Number, default: 0 },
  likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  parentId: { type: Schema.Types.ObjectId, ref: 'CommunityComment', default: null },
  replies: [{ type: Schema.Types.ObjectId, ref: 'CommunityComment' }],
  isLawyerAnswer: { type: Boolean, default: false },
  isAcceptedAnswer: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
}, {
  timestamps: true,
  collection: 'community_comments'
});

CommunityCommentSchema.index({ postId: 1, createdAt: -1 });
CommunityCommentSchema.index({ parentId: 1 });
CommunityCommentSchema.index({ 'author.userId': 1 });

// Main post schema
const CommunityPostSchema = new Schema<ICommunityPost>({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true, maxlength: 5000 },
  author: { type: CommunityUserSchema, required: true },
  room: { 
    type: String, 
    enum: ['general', 'legal-advice', 'case-study', 'law-students', 'lawyers-lounge', 'ask-lawyer'],
    required: true,
    index: true
  },
  reference: { type: CommunityReferenceSchema, default: null },
  tags: [{ type: String, trim: true, lowercase: true }],
  images: [{ type: String }], // Cloudinary URLs
  likes: { type: Number, default: 0 },
  likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: Schema.Types.ObjectId, ref: 'CommunityComment' }],
  commentCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false, index: true },
  isLocked: { type: Boolean, default: false },
  isResolved: { type: Boolean, default: false },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  lastActivityAt: { type: Date, default: Date.now, index: true },
}, {
  timestamps: true,
  collection: 'community_posts'
});

// Indexes
CommunityPostSchema.index({ title: 'text', content: 'text' });
CommunityPostSchema.index({ room: 1, createdAt: -1 });
CommunityPostSchema.index({ room: 1, isPinned: -1, lastActivityAt: -1 });
CommunityPostSchema.index({ tags: 1 });
CommunityPostSchema.index({ 'author.userId': 1 });
CommunityPostSchema.index({ 'reference.type': 1, 'reference.id': 1 });

// Virtual for full reference path
CommunityPostSchema.virtual('referencePath').get(function() {
  if (!this.reference) return null;
  
  if (this.reference.type === 'module') {
    return `/dashboard/learn/${this.reference.id}`;
  } else if (this.reference.type === 'topic') {
    return `/dashboard/learn/${this.reference.moduleId}/topic/${this.reference.id}`;
  } else {
    return `/dashboard/learn/${this.reference.moduleId}/topic/${this.reference.topicId}/subtopic/${this.reference.id}`;
  }
});

// Update comment count middleware
CommunityPostSchema.pre('save', async function(next) {
  if (this.isModified('comments')) {
    this.commentCount = this.comments.length;
  }
  next();
});

export const CommunityPostModel = models.CommunityPost || model<ICommunityPost>('CommunityPost', CommunityPostSchema);
export const CommunityCommentModel = models.CommunityComment || model<ICommunityComment>('CommunityComment', CommunityCommentSchema);