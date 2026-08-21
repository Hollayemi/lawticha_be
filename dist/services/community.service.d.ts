import { Types } from 'mongoose';
import { CreatePostInput, CreateCommentInput, CommunityUser, CommunityReference, ICommunityPost } from '../models/types/community.types';
export declare function listPosts(query: any): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare function getPostById(postId: string, userId?: string): Promise<{
    likedByUser: boolean;
    comments: {
        replies: (import("mongoose").FlattenMaps<any> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        _id: unknown;
        __v: number;
    }[];
    commentCount: number;
    title: string;
    content: string;
    author: CommunityUser;
    room: import("../models/types/community.types").CommunityRoomType;
    reference: CommunityReference | null;
    tags: string[];
    images: string[];
    likes: number;
    likedBy: Types.ObjectId[];
    viewCount: number;
    shares: number;
    bookmarks: number;
    bookmarkedBy: Types.ObjectId[];
    status: import("../models/types/community.types").PostStatus;
    type: import("../models/types/community.types").PostType;
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
    reports: import("../models/types/community.types").PostReport[];
    adminNote?: string;
    pollOptions?: import("../models/types/community.types").PollOption[];
    lastActivityAt: Date;
    aiModerated: boolean;
    aiModerationScore?: number;
    aiModerationFlags?: string[];
    createdAt: Date;
    updatedAt: Date;
    referencePath?: string | null;
    engagementScore?: number;
    addReport(reporterId: string, reporterName: string, reason: string, description?: string): Promise<ICommunityPost>;
    resolveReport(reportId: Types.ObjectId, resolvedBy: string, action: string, note?: string): Promise<ICommunityPost>;
    _id: Types.ObjectId;
    $locals: Record<string, unknown>;
    $op: "save" | "validate" | "remove" | null;
    $where: Record<string, unknown>;
    baseModelName?: string;
    collection: import("mongoose").Collection;
    db: import("mongoose").Connection;
    errors?: import("mongoose").Error.ValidationError;
    id?: any;
    isNew: boolean;
    schema: import("mongoose").Schema;
}>;
export declare function createPost(userId: string, input: CreatePostInput, files?: string[]): Promise<any>;
export declare function createComment(postId: string, userId: string, input: CreateCommentInput, files?: string[]): Promise<any>;
export declare function toggleLikePost(postId: string, userId: string): Promise<{
    liked: boolean;
    likes: any;
}>;
export declare function toggleLikeComment(postId: string, commentId: string, userId: string): Promise<{
    liked: boolean;
    likes: any;
}>;
export declare function acceptAnswer(postId: string, commentId: string, userId: string, adminCtx?: any): Promise<{
    message: string;
}>;
export declare function pinPost(postId: string, adminCtx: any): Promise<{
    message: string;
    isPinned: boolean;
}>;
export declare function lockPost(postId: string, adminCtx: any): Promise<{
    message: string;
    isLocked: boolean;
}>;
export declare function resolvePost(postId: string, userId: string): Promise<{
    message: string;
    isResolved: boolean;
}>;
export declare function getRooms(): Promise<{
    name: string;
    description: string;
    icon: string;
    color: string;
    allowedRoles: import("../models/types/community.types").UserRole[];
    id: string;
}[]>;
export declare function getPostsByReference(type: string, id: string): Promise<(import("mongoose").FlattenMaps<any> & Required<{
    _id: unknown;
}> & {
    __v: number;
})[]>;
//# sourceMappingURL=community.service.d.ts.map