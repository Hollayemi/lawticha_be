import { Types } from 'mongoose';
export type ModuleCategory = 'criminal' | 'tenancy' | 'employment' | 'contracts' | 'business' | 'family' | 'consumer' | 'road';
export type ModuleStatus = 'active' | 'inactive' | 'pending';
export type TopicStatus = 'published' | 'draft' | 'pending';
export type VideoType = 'youtube' | 'upload';
export type ActivityAction = 'completed' | 'enrolled' | 'liked' | 'commented' | 'watched' | 'started';
export type TargetType = 'topic' | 'module' | 'subtopic';
export interface ISubTopic {
    _id: Types.ObjectId;
    topicId: Types.ObjectId;
    moduleId: Types.ObjectId;
    title: string;
    slug: string;
    notes: string;
    duration: string;
    durationSeconds: number;
    order: number;
    viewCount: number;
    completedBy: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SubTopicModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
export interface ITopic {
    _id: Types.ObjectId;
    moduleId: Types.ObjectId;
    title: string;
    slug: string;
    classification: string;
    overview: string;
    status: TopicStatus;
    order: number;
    videoType: VideoType | null;
    videoUrl: string;
    thumbnailUrl: string;
    duration: string;
    durationSeconds: number;
    watchCount: number;
    completionRate: number;
    likes: number;
    comments: number;
    tags: string[];
    subtopicCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const TopicModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
export interface IModule {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    category: ModuleCategory;
    status: ModuleStatus;
    thumbnail: string | null;
    description: string;
    materialSummary: object;
    topicCount: number;
    enrolledCount: number;
    completionRate: number;
    avgRating: number;
    reviewCount: number;
    totalWatchTimeHours: number;
    instructor: string;
    instructorId: Types.ObjectId;
    instructorInitials: string;
    instructorColor: string;
    trending: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ModuleModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
export interface IActivityItem {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    userName: string;
    userInitials: string;
    userColor: string;
    action: ActivityAction;
    targetTitle: string;
    targetType: TargetType;
    targetId: Types.ObjectId;
    moduleId: Types.ObjectId;
    createdAt: Date;
}
export declare const ActivityModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
export interface IComment {
    _id: Types.ObjectId;
    topicId: Types.ObjectId;
    moduleId: Types.ObjectId;
    userId: Types.ObjectId;
    userName: string;
    userInitials: string;
    userColor: string;
    text: string;
    likes: number;
    resolved: boolean;
    resolvedBy?: string;
    resolvedAt?: Date;
    parentId?: Types.ObjectId;
    replies?: IComment[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const CommentModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=Module.model.d.ts.map