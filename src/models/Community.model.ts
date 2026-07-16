// models/Community.model.ts
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
  specialisms: [{ type: String, trim: true, ref: 'Specialism' }],
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

// Report sub-schema for comments
const CommentReportSchema = new Schema({
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reporterName: { type: String },
  reason: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolutionNote: { type: String },
}, { _id: true });

// Edit history sub-schema
const EditHistorySchema = new Schema({
  content: { type: String, required: true },
  editedAt: { type: Date, default: Date.now },
}, { _id: false });

// Comment schema
const CommunityCommentSchema = new Schema<ICommunityComment>({
  postId: { type: Schema.Types.ObjectId, ref: 'CommunityPost', required: true, index: true },
  content: { type: String, required: true },
  author: { type: CommunityUserSchema, required: true },
  images: [{ type: String }],
  likes: { type: Number, default: 0 },
  likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  parentId: { type: Schema.Types.ObjectId, ref: 'CommunityComment', default: null },
  replies: [{ type: Schema.Types.ObjectId, ref: 'CommunityComment' }],
  isLawyerAnswer: { type: Boolean, default: false },
  isAcceptedAnswer: { type: Boolean, default: false },
  
  // Moderation fields
  isRemoved: { type: Boolean, default: false },
  removalReason: { type: String },
  removedAt: { type: Date },
  removedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  
  // Edit tracking
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  editHistory: [EditHistorySchema],
  
  // Reports
  reports: [CommentReportSchema],
  
  // Flag for AI/content moderation
  flagged: { type: Boolean, default: false },
  flagReason: { type: String },
}, {
  timestamps: true,
  collection: 'community_comments'
});

// Comment indexes
CommunityCommentSchema.index({ postId: 1, createdAt: -1 });
CommunityCommentSchema.index({ parentId: 1 });
CommunityCommentSchema.index({ 'author.userId': 1 });
CommunityCommentSchema.index({ isRemoved: 1 });
CommunityCommentSchema.index({ isAcceptedAnswer: 1 });

// Report sub-schema for posts
const PostReportSchema = new Schema({
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reporterName: { type: String, required: true },
  reason: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolutionNote: { type: String },
  resolutionAction: { type: String, enum: ['dismiss', 'remove_post', 'warn_user', 'ban_user'] },
}, { _id: true });

// Poll option sub-schema
const PollOptionSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  votes: { type: Number, default: 0 },
  votedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { _id: false });

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
  images: [{ type: String }],
  
  // Engagement metrics
  likes: { type: Number, default: 0 },
  likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: Schema.Types.ObjectId, ref: 'CommunityComment' }],
  commentCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  bookmarks: { type: Number, default: 0 },
  bookmarkedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  
  // Post status & moderation
  status: {
    type: String,
    enum: ['active', 'pending', 'promoted', 'rejected', 'removed'],
    default: 'active',
    index: true,
  },
  type: {
    type: String,
    enum: ['discussion', 'argument', 'poll', 'announcement', 'case_study'],
    default: 'discussion',
  },
  
  // Pin & lock
  isPinned: { type: Boolean, default: false, index: true },
  pinnedAt: { type: Date },
  pinnedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isLocked: { type: Boolean, default: false },
  lockedAt: { type: Date },
  lockedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  
  // Resolution
  isResolved: { type: Boolean, default: false },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  
  // Promotion
  isPromoted: { type: Boolean, default: false },
  promotedAt: { type: Date },
  promotedUntil: { type: Date },
  promotedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  
  // Approval workflow (for pending posts)
  approvedAt: { type: Date },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  
  // Rejection
  rejectedAt: { type: Date },
  rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  
  // Reports
  reportCount: { type: Number, default: 0 },
  reports: [PostReportSchema],
  
  // Admin notes
  adminNote: { type: String },
  
  // Poll specific (only used when type === 'poll')
  pollOptions: [PollOptionSchema],
  
  // Activity tracking
  lastActivityAt: { type: Date, default: Date.now, index: true },
  
  // AI moderation flags
  aiModerated: { type: Boolean, default: false },
  aiModerationScore: { type: Number, min: 0, max: 1 },
  aiModerationFlags: [{ type: String }],
}, {
  timestamps: true,
  collection: 'community_posts'
});

// Text search index
CommunityPostSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Compound indexes for common queries
CommunityPostSchema.index({ room: 1, status: 1, createdAt: -1 });
CommunityPostSchema.index({ room: 1, isPinned: -1, lastActivityAt: -1 });
CommunityPostSchema.index({ status: 1, createdAt: -1 });
CommunityPostSchema.index({ isPromoted: 1, promotedUntil: 1 });
CommunityPostSchema.index({ tags: 1 });
CommunityPostSchema.index({ 'author.userId': 1 });
CommunityPostSchema.index({ 'reference.type': 1, 'reference.id': 1 });
CommunityPostSchema.index({ reportCount: -1 });
CommunityPostSchema.index({ likes: -1 });
CommunityPostSchema.index({ viewCount: -1 });

// Virtual for full reference path
CommunityPostSchema.virtual('referencePath').get(function() {
  if (!this.reference) return null;
  
  if (this.reference.type === 'module') {
    return `/dashboard/learn/${this.reference.id}`;
  } else if (this.reference.type === 'topic') {
    return `/dashboard/learn/${this.reference.moduleId}/topic/${this.reference.id}`;
  } else if (this.reference.type === 'subtopic') {
    return `/dashboard/learn/${this.reference.moduleId}/topic/${this.reference.topicId}/subtopic/${this.reference.id}`;
  }
  return null;
});

// Virtual for engagement score
CommunityPostSchema.virtual('engagementScore').get(function() {
  return (this.likes * 1) + (this.commentCount * 2) + (this.shares * 3) + (this.bookmarks * 1.5);
});

// Pre-save middleware to update comment count
CommunityPostSchema.pre('save', async function(next) {
  if (this.isModified('comments')) {
    this.commentCount = this.comments.length;
  }
  if (this.isModified('lastActivityAt') === false) {
    this.lastActivityAt = new Date();
  }
  next();
});

// Pre-save middleware for promotion expiry
CommunityPostSchema.pre('save', function(next) {
  if (this.isPromoted && this.promotedUntil && this.promotedUntil < new Date()) {
    this.isPromoted = false;
    this.promotedUntil = undefined;
  }
  next();
});

// Static method to cleanup expired promotions
CommunityPostSchema.statics.cleanupExpiredPromotions = async function() {
  return this.updateMany(
    { isPromoted: true, promotedUntil: { $lt: new Date() } },
    { $set: { isPromoted: false }, $unset: { promotedUntil: "" } }
  );
};

// Method to add report
CommunityPostSchema.methods.addReport = async function(reporterId: string, reporterName: string, reason: string, description?: string) {
  this.reports.push({ reporterId, reporterName, reason, description, createdAt: new Date() });
  this.reportCount = this.reports.length;
  return this.save();
};

// Method to resolve report
CommunityPostSchema.methods.resolveReport = async function(reportId: Types.ObjectId, resolvedBy: string, action: string, note?: string) {
  const report = this.reports.id(reportId);
  if (report) {
    report.resolved = true;
    report.resolvedAt = new Date();
    report.resolvedBy = resolvedBy;
    report.resolutionNote = note;
    report.resolutionAction = action;
    
    // If action is to remove post, update status
    if (action === 'remove_post') {
      this.status = 'removed';
    }
    
    await this.save();
  }
  return this;
};

// Export models
export const CommunityPostModel = models.CommunityPost || model<ICommunityPost>('CommunityPost', CommunityPostSchema);
export const CommunityCommentModel = models.CommunityComment || model<ICommunityComment>('CommunityComment', CommunityCommentSchema);