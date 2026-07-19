import { Document, Types } from 'mongoose';

export type CommunityRoomType = 'general' | 'legal-advice' | 'case-study' | 'law-students' | 'lawyers-lounge' | 'ask-lawyer';
export type ReferenceType = 'module' | 'topic' | 'subtopic';
export type PostType = 'discussion' | 'argument' | 'poll' | 'announcement' | 'case_study';
export type PostStatus = 'active' | 'pending' | 'promoted' | 'rejected' | 'removed';
export type UserRole = 'citizen' | 'lawyer' | 'admin' | 'moderator';
export type ResolutionAction = 'dismiss' | 'remove_post' | 'warn_user' | 'ban_user';

export interface CommunityUser {
  userId: Types.ObjectId;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
  badge?: string;
  lawFirm?: string;
  yearsOfExperience?: number;
  specialisms?: string[];
}

export interface CommunityReference {
  type: ReferenceType;
  id: Types.ObjectId;
  referenceModel: string;
  title: string;
  slug?: string;
  moduleId?: Types.ObjectId;
  moduleTitle?: string;
  topicId?: Types.ObjectId;
  topicTitle?: string;
  excerpt?: string;
  thumbnail?: string;
}

export interface PostReport {
  _id: Types.ObjectId;
  reporterId: Types.ObjectId;
  reporterName: string;
  reason: string;
  description?: string;
  createdAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
  resolutionNote?: string;
  resolutionAction?: ResolutionAction;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  votedBy: Types.ObjectId[];
}

export interface CommentReport {
  reporterId: Types.ObjectId;
  reporterName?: string;
  reason: string;
  description?: string;
  createdAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
  resolutionNote?: string;
}

export interface EditHistory {
  content: string;
  editedAt: Date;
}

export interface ICommunityComment extends Document {
  postId: Types.ObjectId;
  content: string;
  author: CommunityUser;
  images: string[];
  likes: number;
  likedBy: Types.ObjectId[];
  parentId: Types.ObjectId | null;
  replies: Types.ObjectId[];
  isLawyerAnswer: boolean;
  isAcceptedAnswer: boolean;
  isRemoved: boolean;
  removalReason?: string;
  removedAt?: Date;
  removedBy?: Types.ObjectId;
  isEdited: boolean;
  editedAt?: Date;
  editHistory: EditHistory[];
  reports: CommentReport[];
  flagged: boolean;
  flagReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommunityPost extends Document {
  title: string;
  content: string;
  author: CommunityUser;
  room: CommunityRoomType;
  reference: CommunityReference | null;
  tags: string[];
  images: string[];
  likes: number;
  likedBy: Types.ObjectId[];
  comments: Types.ObjectId[];
  commentCount: number;
  viewCount: number;
  shares: number;
  bookmarks: number;
  bookmarkedBy: Types.ObjectId[];
  status: PostStatus;
  type: PostType;
  isPinned: boolean;
  pinnedAt?: Date;
  pinnedBy?: Types.ObjectId;
  isLocked: boolean;
  lockedAt?: Date;
  lockedBy?: Types.ObjectId;
  isResolved: boolean;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  isPromoted: boolean;
  promotedAt?: Date;
  promotedUntil?: Date;
  promotedBy?: Types.ObjectId;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  rejectedAt?: Date;
  rejectedBy?: Types.ObjectId;
  rejectionReason?: string;
  reportCount: number;
  reports: PostReport[];
  adminNote?: string;
  pollOptions?: PollOption[];
  lastActivityAt: Date;
  aiModerated: boolean;
  aiModerationScore?: number;
  aiModerationFlags?: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  referencePath?: string | null;
  engagementScore?: number;
  
  // Methods
  addReport(reporterId: string, reporterName: string, reason: string, description?: string): Promise<ICommunityPost>;
  resolveReport(reportId: Types.ObjectId, resolvedBy: string, action: string, note?: string): Promise<ICommunityPost>;
}

export interface CreatePostInput {
  title: string;
  content: string;
  room: CommunityRoomType;
  reference?: {
    type: ReferenceType;
    id: string;
    title: string;
    moduleId?: string;
    moduleTitle?: string;
    topicId?: string;
    topicTitle?: string;
  };
  tags: string[];
}

export interface CreateCommentInput {
  content: string;
  parentId?: string;
}
// Room metadata
export const COMMUNITY_ROOMS: Record<CommunityRoomType, { name: string; description: string; icon: string; color: string; allowedRoles: UserRole[] }> = {
  'general': {
    name: 'General Discussion',
    description: 'General legal discussions and community conversations',
    icon: '💬',
    color: '#3B82F6',
    allowedRoles: ['citizen', 'lawyer', 'admin', 'moderator']
  },
  'legal-advice': {
    name: 'Legal Advice',
    description: 'Seek legal advice from verified professionals',
    icon: '⚖️',
    color: '#10B981',
    allowedRoles: ['citizen', 'lawyer', 'admin', 'moderator']
  },
  'case-study': {
    name: 'Case Studies',
    description: 'Share and discuss legal cases and scenarios',
    icon: '📋',
    color: '#F59E0B',
    allowedRoles: ['citizen', 'lawyer', 'admin', 'moderator']
  },
  'law-students': {
    name: 'Law Students',
    description: 'For law students and aspiring legal professionals',
    icon: '📚',
    color: '#8B5CF6',
    allowedRoles: ['citizen', 'lawyer', 'admin', 'moderator']
  },
  'lawyers-lounge': {
    name: 'Lawyers Lounge',
    description: 'Professional discussions for verified lawyers',
    icon: '👔',
    color: '#E8317A',
    allowedRoles: ['lawyer', 'admin', 'moderator']
  },
  'ask-lawyer': {
    name: 'Ask a Lawyer',
    description: 'Direct your legal questions to verified lawyers',
    icon: '🎓',
    color: '#06B6D4',
    allowedRoles: ['citizen', 'lawyer', 'admin', 'moderator']
  }
};