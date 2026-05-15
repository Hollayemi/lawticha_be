import { Types } from 'mongoose';

export type CommunityRoomType = 'general' | 'legal-advice' | 'case-study' | 'law-students' | 'lawyers-lounge' | 'ask-lawyer';
export type ReferenceType = 'module' | 'topic' | 'subtopic';
export type UserRole = 'citizen' | 'lawyer' | 'admin' | 'moderator';

export interface CommunityUser {
  userId: Types.ObjectId;
  name: string;
  email: string;
  avatar?: string;
  specialisms: [];
  role: UserRole;
  isVerified: boolean;
  badge?: string;
  lawFirm?: string;
  yearsOfExperience?: number;
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

export interface ICommunityComment {
  _id: Types.ObjectId;
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
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommunityPost {
  _id: Types.ObjectId;
  title: string;
  content: string;
  author: CommunityUser;
  room: CommunityRoomType;
  reference?: CommunityReference;
  tags: string[];
  images: string[];
  likes: number;
  likedBy: Types.ObjectId[];
  comments: Types.ObjectId[];
  commentCount: number;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isResolved: boolean;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs
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
  images?: any[];
}

export interface CreateCommentInput {
  content: string;
  images?: any[];
  parentId?: string;
}

export interface ListPostsQuery {
  room?: CommunityRoomType;
  sort?: 'latest' | 'popular' | 'trending' | 'unanswered';
  search?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminCtx {
  adminId: string;
  adminName: string;
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