import { ModuleStatus, TopicStatus, VideoType, ModuleCategory } from '../models/Module.model';
export interface ModuleFilters {
    status?: ModuleStatus | 'all';
    category?: ModuleCategory | 'all';
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare function listModules(filters?: ModuleFilters): Promise<{
    data: {
        id: string;
        title: any;
        category: any;
        status: any;
        slug: any;
        materialSummary: any;
        thumbnail: any;
        description: any;
        topicCount: any;
        enrolledCount: any;
        completionRate: any;
        avgRating: any;
        reviewCount: any;
        totalWatchTimeHours: any;
        instructor: any;
        instructorId: string;
        instructorInitials: any;
        instructorColor: any;
        trending: any;
        createdAt: any;
        updatedAt: any;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare function getModuleStats(): Promise<{
    totalModules: number;
    totalTopics: number;
    totalEnrolled: any;
    avgCompletion: number;
}>;
export declare function getDailyStats(): Promise<{
    lessonsWatchedToday: number;
    lessonsWatchedChange: number;
    newEnrolmentsToday: number;
    newEnrolmentsChange: number;
    completionsToday: number;
    completionsChange: number;
    avgSessionDurationMinutes: number;
    avgSessionDurationChange: number;
}>;
export declare function getModuleById(id: string): Promise<{
    id: string;
    title: any;
    category: any;
    status: any;
    slug: any;
    materialSummary: any;
    thumbnail: any;
    description: any;
    topicCount: any;
    enrolledCount: any;
    completionRate: any;
    avgRating: any;
    reviewCount: any;
    totalWatchTimeHours: any;
    instructor: any;
    instructorId: string;
    instructorInitials: any;
    instructorColor: any;
    trending: any;
    createdAt: any;
    updatedAt: any;
}>;
export interface CreateModuleInput {
    title: string;
    category: ModuleCategory;
    description: string;
    instructorId: string;
    thumbnailUrl?: string;
    thumbnailFile?: string;
    status?: ModuleStatus;
}
export declare function createModule(input: CreateModuleInput): Promise<{
    id: string;
    title: any;
    category: any;
    status: any;
    slug: any;
    materialSummary: any;
    thumbnail: any;
    description: any;
    topicCount: any;
    enrolledCount: any;
    completionRate: any;
    avgRating: any;
    reviewCount: any;
    totalWatchTimeHours: any;
    instructor: any;
    instructorId: string;
    instructorInitials: any;
    instructorColor: any;
    trending: any;
    createdAt: any;
    updatedAt: any;
}>;
export interface UpdateModuleInput {
    title?: string;
    category?: ModuleCategory;
    description?: string;
    instructorId?: string;
    thumbnailUrl?: string;
    status?: ModuleStatus;
    trending?: boolean;
}
export declare function updateModule(id: string, input: UpdateModuleInput): Promise<{
    id: string;
    title: any;
    category: any;
    status: any;
    slug: any;
    materialSummary: any;
    thumbnail: any;
    description: any;
    topicCount: any;
    enrolledCount: any;
    completionRate: any;
    avgRating: any;
    reviewCount: any;
    totalWatchTimeHours: any;
    instructor: any;
    instructorId: string;
    instructorInitials: any;
    instructorColor: any;
    trending: any;
    createdAt: any;
    updatedAt: any;
}>;
export declare function deleteModule(id: string): Promise<void>;
export declare function listTopics(moduleId: string, status?: string): Promise<{
    subtopics: any;
    id: string;
    moduleId: string;
    title: any;
    classification: any;
    overview: any;
    status: any;
    order: any;
    videoType: any;
    videoUrl: any;
    thumbnailUrl: any;
    duration: any;
    durationSeconds: any;
    watchCount: any;
    completionRate: any;
    likes: any;
    comments: any;
    tags: any;
    subtopicCount: any;
    createdAt: any;
    updatedAt: any;
}[]>;
export declare function getTopicById(moduleId: string, topicId: string): Promise<{
    subtopics: {
        id: string;
        topicId: string;
        moduleId: string;
        title: any;
        notes: any;
        duration: any;
        durationSeconds: any;
        order: any;
        viewCount: any;
        completedBy: any;
        createdAt: any;
        updatedAt: any;
    }[];
    id: string;
    moduleId: string;
    title: any;
    classification: any;
    overview: any;
    status: any;
    order: any;
    videoType: any;
    videoUrl: any;
    thumbnailUrl: any;
    duration: any;
    durationSeconds: any;
    watchCount: any;
    completionRate: any;
    likes: any;
    comments: any;
    tags: any;
    subtopicCount: any;
    createdAt: any;
    updatedAt: any;
}>;
export interface CreateTopicInput {
    moduleId: string;
    title: string;
    classification: string;
    overview: string;
    status?: TopicStatus;
    order?: number;
    videoType?: VideoType;
    videoUrl?: string;
    thumbnailUrl?: string;
    tags?: string[];
}
export declare function createTopic(input: CreateTopicInput): Promise<{
    id: string;
    moduleId: string;
    title: any;
    classification: any;
    overview: any;
    status: any;
    order: any;
    videoType: any;
    videoUrl: any;
    thumbnailUrl: any;
    duration: any;
    durationSeconds: any;
    watchCount: any;
    completionRate: any;
    likes: any;
    comments: any;
    tags: any;
    subtopicCount: any;
    createdAt: any;
    updatedAt: any;
}>;
export interface UpdateTopicInput {
    title?: string;
    classification?: string;
    overview?: string;
    status?: TopicStatus;
    order?: number;
    videoType?: VideoType | null;
    videoUrl?: string;
    thumbnailUrl?: string;
    tags?: string[];
}
export declare function updateTopic(moduleId: string, topicId: string, input: UpdateTopicInput): Promise<{
    id: string;
    moduleId: string;
    title: any;
    classification: any;
    overview: any;
    status: any;
    order: any;
    videoType: any;
    videoUrl: any;
    thumbnailUrl: any;
    duration: any;
    durationSeconds: any;
    watchCount: any;
    completionRate: any;
    likes: any;
    comments: any;
    tags: any;
    subtopicCount: any;
    createdAt: any;
    updatedAt: any;
}>;
export declare function deleteTopic(moduleId: string, topicId: string): Promise<void>;
export declare function reorderTopics(moduleId: string, orderedIds: string[]): Promise<void>;
export declare function listSubTopics(moduleId: string, topicId: string): Promise<{
    id: string;
    topicId: string;
    moduleId: string;
    title: any;
    notes: any;
    duration: any;
    durationSeconds: any;
    order: any;
    viewCount: any;
    completedBy: any;
    createdAt: any;
    updatedAt: any;
}[]>;
export interface CreateSubTopicInput {
    moduleId: string;
    topicId: string;
    title: string;
    notes?: string;
    duration?: string;
    order?: number;
}
export declare function createSubTopic(input: CreateSubTopicInput): Promise<{
    id: string;
    topicId: string;
    moduleId: string;
    title: any;
    notes: any;
    duration: any;
    durationSeconds: any;
    order: any;
    viewCount: any;
    completedBy: any;
    createdAt: any;
    updatedAt: any;
}>;
export interface UpdateSubTopicInput {
    title?: string;
    notes?: string;
    duration?: string;
    order?: number;
}
export declare function updateSubTopic(moduleId: string, topicId: string, subtopicId: string, input: UpdateSubTopicInput): Promise<{
    id: string;
    topicId: string;
    moduleId: string;
    title: any;
    notes: any;
    duration: any;
    durationSeconds: any;
    order: any;
    viewCount: any;
    completedBy: any;
    createdAt: any;
    updatedAt: any;
}>;
export declare function updateSubTopicNotes(moduleId: string, topicId: string, subtopicId: string, notes: string): Promise<{
    id: string;
    notes: any;
    updatedAt: any;
}>;
export declare function deleteSubTopic(moduleId: string, topicId: string, subtopicId: string): Promise<void>;
export declare function reorderSubTopics(moduleId: string, topicId: string, orderedIds: string[]): Promise<void>;
export declare function getModuleActivity(moduleId: string, limit?: number, before?: string): Promise<{
    id: string;
    userId: string;
    userName: any;
    userInitials: any;
    userColor: any;
    action: any;
    targetTitle: any;
    targetType: any;
    targetId: string;
    moduleId: string;
    createdAt: any;
}[]>;
export declare function getModuleAnalytics(moduleId: string): Promise<{
    moduleId: string;
    enrolledCount: any;
    completionRate: any;
    avgRating: any;
    totalWatchTimeHours: any;
    progressDistribution: {
        label: string;
        count: number;
        percentage: number;
        color: string;
    }[];
    topicPerformance: {
        topicId: string;
        title: any;
        classification: any;
        order: any;
        watchCount: any;
        completionRate: any;
        likes: any;
        comments: any;
        status: any;
        duration: any;
    }[];
    updatedAt: any;
}>;
export declare function getTopicAnalytics(moduleId: string, topicId: string): Promise<{
    topicId: string;
    watchCount: any;
    completionRate: any;
    likes: any;
    comments: any;
    avgWatchDurationSeconds: number;
    likeRate: number;
    commentRate: number;
    dailyViews: {
        day: string;
        date: string;
        views: number;
    }[];
    subtopicCompletion: {
        subtopicId: string;
        title: any;
        order: any;
        viewCount: any;
        completedBy: any;
        dropOffPercentage: number;
    }[];
    topStates: never[];
    weeklyEngagement: {
        label: string;
        value: string;
        trend: string;
        up: boolean;
    }[];
    updatedAt: any;
}>;
export interface CommentsParams {
    moduleId: string;
    topicId: string;
    resolved?: boolean;
}
export interface LearnersParams {
    moduleId: string;
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: 'enrolledAt' | 'progress' | 'lastActiveAt';
    sortOrder?: 'asc' | 'desc';
}
export declare function getModuleLearners(params: LearnersParams): Promise<{
    data: {
        id: string;
        name: string;
        initials: string;
        color: string;
        email: any;
        state: string;
        enrolledAt: any;
        progressPercentage: any;
        topicsCompleted: any;
        totalTopics: any;
        lastActiveAt: any;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare function getTopLearners(moduleId: string, limit?: number): Promise<{
    id: string;
    name: string;
    initials: string;
    color: string;
    progressPercentage: any;
    topicsCompleted: any;
    certificateEarned: boolean;
}[]>;
export declare function getComments(moduleId: string, topicId: string, resolved?: boolean): Promise<any[]>;
export declare function resolveComment(moduleId: string, topicId: string, commentId: string, resolved: boolean, adminName: string): Promise<any>;
export declare function deleteComment(moduleId: string, topicId: string, commentId: string): Promise<void>;
//# sourceMappingURL=module.service.d.ts.map