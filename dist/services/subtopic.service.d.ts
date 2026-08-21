import { Types } from 'mongoose';
export declare function toggleLikeSubtopic(subtopicId: string, citizenId: string): Promise<{
    subtopicId: any;
    liked: boolean;
    likesCount: any;
}>;
export declare function toggleCompleteSubtopic(subtopicId: string, citizenId: string): Promise<{
    subtopicId: any;
    completed: boolean;
    completedBy: any;
}>;
export declare function getSubtopicState(subtopicId: string, citizenId?: string): Promise<{
    currentSubtopic: {
        id: any;
        title: any;
        order: any;
        likesCount: number;
        completedBy: number;
        liked: any;
        completed: any;
    };
    topic: {
        id: any;
        title: any;
        totalSubtopics: number;
        completedSubtopics: number;
        progressPercent: number;
        completedSubtopicIds: any[];
        subtopics: {
            id: any;
            title: any;
            order: any;
            duration: any;
            completed: any;
            liked: any;
        }[];
    };
}>;
export declare function getSubtopicStatesBulk(subtopicIds: Types.ObjectId[], citizenId?: string): Promise<Map<string, {
    liked: boolean;
    completed: boolean;
}>>;
export interface CreateBookmarkInput {
    subtopicId: string;
    citizenId: string;
    highlightedText: string;
    url: string;
    comment?: string;
    startOffset?: number;
    endOffset?: number;
}
export declare function createBookmark(input: CreateBookmarkInput): Promise<{
    id: string;
    subtopicId: string;
    topicId: string;
    moduleId: string;
    subtopicTitle: any;
    topicTitle: any;
    moduleTitle: any;
    highlightedText: any;
    comment: any;
    startOffset: any;
    endOffset: any;
    createdAt: any;
    updatedAt: any;
}>;
export declare function listBookmarksForSubtopic(subtopicId: string, citizenId: string): Promise<{
    id: string;
    subtopicId: string;
    topicId: string;
    moduleId: string;
    subtopicTitle: any;
    topicTitle: any;
    moduleTitle: any;
    highlightedText: any;
    comment: any;
    startOffset: any;
    endOffset: any;
    createdAt: any;
    updatedAt: any;
}[]>;
export interface ListMyBookmarksParams {
    citizenId: string;
    moduleId?: string;
    topicId?: string;
    page?: number;
    pageSize?: number;
}
export declare function listMyBookmarks(params: ListMyBookmarksParams): Promise<{
    data: {
        id: string;
        subtopicId: string;
        topicId: string;
        moduleId: string;
        subtopicTitle: any;
        topicTitle: any;
        moduleTitle: any;
        highlightedText: any;
        comment: any;
        startOffset: any;
        endOffset: any;
        createdAt: any;
        updatedAt: any;
    }[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}>;
export declare function getBookmarkById(bookmarkId: string, citizenId: string): Promise<{
    id: string;
    subtopicId: string;
    topicId: string;
    moduleId: string;
    subtopicTitle: any;
    topicTitle: any;
    moduleTitle: any;
    highlightedText: any;
    comment: any;
    startOffset: any;
    endOffset: any;
    createdAt: any;
    updatedAt: any;
}>;
export interface UpdateBookmarkInput {
    highlightedText?: string;
    comment?: string;
    startOffset?: number;
    endOffset?: number;
}
export declare function updateBookmark(bookmarkId: string, citizenId: string, input: UpdateBookmarkInput): Promise<{
    id: string;
    subtopicId: string;
    topicId: string;
    moduleId: string;
    subtopicTitle: any;
    topicTitle: any;
    moduleTitle: any;
    highlightedText: any;
    comment: any;
    startOffset: any;
    endOffset: any;
    createdAt: any;
    updatedAt: any;
}>;
export declare function deleteBookmark(bookmarkId: string, citizenId: string): Promise<void>;
//# sourceMappingURL=subtopic.service.d.ts.map