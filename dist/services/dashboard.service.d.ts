type Period = '7d' | '30d' | '90d' | '1y';
export declare function getDashboardOverview(): Promise<{
    citizens: {
        total: number;
        active: number;
        inactive: number;
        newThisWeek: number;
        growthPercent: number;
    };
    lawyers: {
        total: number;
        verified: number;
        pendingVerification: number;
        newThisWeek: number;
    };
    consultations: {
        total: number;
        active: number;
        completed: number;
        disputed: number;
        newToday: number;
    };
    revenue: {
        totalGross: any;
        platformCommission: number;
        thisMonth: any;
        lastMonth: any;
        growthPercent: number;
    };
    community: {
        totalPosts: number;
        pendingReview: number;
        reportedPosts: number;
        newToday: number;
    };
    library: {
        totalBooks: number;
        totalDownloads: any;
        pendingOrders: number;
        revenueThisMonth: any;
    };
}>;
export declare function getDashboardAnalytics(period: Period): Promise<{
    period: Period;
    revenue: {
        date: string;
        label: string;
        gross: number;
        commission: number;
        lawyerPayout: number;
    }[];
    consultations: {
        completed: number;
        disputed: number;
        cancelled: number;
        date: string;
        label: string;
    }[];
    userGrowth: {
        date: string;
        label: string;
        citizens: number;
        lawyers: number;
        cumCitizens: number;
        cumLawyers: number;
    }[];
    topLawyers: {
        lawyerId: string;
        fullName: string;
        avatarInitials: string;
        colorA: any;
        colorB: any;
        scnNumber: any;
        specialisms: any;
        consultationCount: any;
        rating: any;
        reviewCount: any;
        totalEarned: number;
        completionRate: number;
        disputeCount: number;
    }[];
    recentActivity: any[];
    pendingActions: any[];
    consultationsByMode: {
        message: number;
        call: number;
        video: number;
    };
    consultationsByStatus: Record<string, number>;
    lawyersBySpecialism: {
        specialism: string;
        count: number;
    }[];
    citizensByState: {
        state: string;
        count: number;
    }[];
}>;
export {};
//# sourceMappingURL=dashboard.service.d.ts.map