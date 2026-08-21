import { Types } from 'mongoose';
export interface ISubtopicActivity {
    _id: Types.ObjectId;
    citizenId: Types.ObjectId;
    subtopicId: Types.ObjectId;
    topicId: Types.ObjectId;
    moduleId: Types.ObjectId;
    liked: boolean;
    likedAt?: Date;
    completed: boolean;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SubtopicActivityModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
export interface ISubtopicBookmark {
    _id: Types.ObjectId;
    citizenId: Types.ObjectId;
    subtopicId: Types.ObjectId;
    topicId: Types.ObjectId;
    moduleId: Types.ObjectId;
    url: string;
    subtopicTitle: string;
    topicTitle: string;
    moduleTitle: string;
    highlightedText: string;
    comment: string;
    startOffset?: number;
    endOffset?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SubtopicBookmarkModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=SubtopicEngagement.model.d.ts.map