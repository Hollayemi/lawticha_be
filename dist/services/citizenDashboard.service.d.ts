export declare function getUserStats(userId: string): Promise<{
    topicsCompletedCount: any;
    streakDays: any;
    certificatesCount: any;
    totalStudyMinutes: any;
    xpTotal: any;
    xpLevel: any;
}>;
export declare function getContinueReading(userId: string, limit?: number): Promise<{
    slug: any;
    icon: any;
    gradient: any;
    tag: any;
    tagColor: any;
    title: any;
    progress: any;
    lastRead: string;
    section: any;
    xpReward: number;
}[]>;
export declare function getDailyChallenge(userId: string): Promise<{
    id: any;
    title: string;
    question: any;
    options: any;
    correct: any;
    xpReward: any;
    completed: boolean;
} | null>;
export declare function getTrendingTopics(limit?: number): Promise<{
    icon: string;
    title: any;
    reads: string;
    hot: boolean;
    slug: any;
}[]>;
export declare function getBookmarks(userId: string, limit?: number): Promise<{
    title: any;
    law: any;
    color: any;
}[]>;
export declare function getCommunityHighlights(limit?: number): Promise<{
    initials: string;
    color: string;
    name: any;
    text: any;
    time: string;
    likes: any;
}[]>;
export declare function getNextGoal(userId: string): Promise<{
    title: any;
    description: any;
    progress: number;
    total: number;
    completed: number;
    tasks: {
        done: boolean;
        text: any;
    }[];
} | null>;
export declare function getWelcomeVideo(): {
    title: string;
    duration: string;
    views: number;
    url: string | undefined;
};
export declare function getDashboardData(userId: string): Promise<{
    stats: {
        topicsCompletedCount: any;
        streakDays: any;
        certificatesCount: any;
        totalStudyMinutes: any;
        xpTotal: any;
        xpLevel: any;
    };
    continueReading: {
        slug: any;
        icon: any;
        gradient: any;
        tag: any;
        tagColor: any;
        title: any;
        progress: any;
        lastRead: string;
        section: any;
        xpReward: number;
    }[];
    dailyChallenge: {
        id: any;
        title: string;
        question: any;
        options: any;
        correct: any;
        xpReward: any;
        completed: boolean;
    } | null;
    trendingTopics: {
        icon: string;
        title: any;
        reads: string;
        hot: boolean;
        slug: any;
    }[];
    bookmarks: {
        title: any;
        law: any;
        color: any;
    }[];
    communityHighlights: {
        initials: string;
        color: string;
        name: any;
        text: any;
        time: string;
        likes: any;
    }[];
    nextGoal: {
        title: any;
        description: any;
        progress: number;
        total: number;
        completed: number;
        tasks: {
            done: boolean;
            text: any;
        }[];
    } | null;
    welcomeVideo: {
        title: string;
        duration: string;
        views: number;
        url: string | undefined;
    };
}>;
export declare function submitQuizAnswer(userId: string, questionId: string, answer: number): Promise<{
    correct: boolean;
    xpEarned: any;
}>;
export declare function updateReadingProgress(userId: string, slug: string, progress: number): Promise<{
    progress: number;
}>;
export declare function addBookmark(userId: string, title: string, law: string): Promise<{
    title: any;
    law: any;
    color: any;
}>;
export declare function removeBookmark(userId: string, title: string): Promise<void>;
export declare function completeGoalTask(userId: string, taskText: string): Promise<{
    title: any;
    description: any;
    progress: number;
    total: number;
    completed: number;
    tasks: {
        done: boolean;
        text: any;
    }[];
} | null>;
//# sourceMappingURL=citizenDashboard.service.d.ts.map