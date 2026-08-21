"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardOverview = getDashboardOverview;
exports.getDashboardAnalytics = getDashboardAnalytics;
const User_model_1 = require("../models/User.model");
const LawyerProfile_model_1 = require("../models/LawyerProfile.model");
const CitizenProfile_model_1 = require("../models/CitizenProfile.model");
const Consultation_model_1 = require("../models/Consultation.model");
const Community_model_1 = require("../models/Community.model");
const Book_model_1 = require("../models/Book.model");
const BookOrder_model_1 = require("../models/BookOrder.model");
const types_1 = require("../models/types");
// ─── Constants ────────────────────────────────────────────────────────────────
/** Platform keeps this fraction of every consultation fee */
const COMMISSION_RATE = 0.2;
// ─── Helpers ──────────────────────────────────────────────────────────────────
function periodToDays(period) {
    return { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period];
}
function startOf(days) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
function startOfDay(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function startOfWeek() {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
}
function startOfMonth(offsetMonths = 0) {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - offsetMonths);
    return d;
}
/**
 * Build an array of date-bucketed labels for the given period.
 * Returns ISO date strings and display labels.
 */
function buildDateBuckets(days) {
    const buckets = [];
    const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        buckets.push({ date: iso, label: fmt.format(d) });
    }
    return buckets;
}
// ─── Overview ─────────────────────────────────────────────────────────────────
async function getDashboardOverview() {
    const now = new Date();
    const todayStart = startOfDay();
    const weekStart = startOfWeek();
    const thisMonthStart = startOfMonth();
    const lastMonthStart = startOfMonth(1);
    const lastMonthEnd = thisMonthStart;
    // ── Citizens ────────────────────────────────────────────────────────────────
    const [totalCitizens, activeCitizens, newCitizensThisWeek, newCitizensLastWeek,] = await Promise.all([
        User_model_1.UserModel.countDocuments({ role: 'citizen' }),
        User_model_1.UserModel.countDocuments({ role: 'citizen', isActive: true }),
        User_model_1.UserModel.countDocuments({ role: 'citizen', createdAt: { $gte: weekStart } }),
        User_model_1.UserModel.countDocuments({
            role: 'citizen',
            createdAt: { $gte: new Date(weekStart.getTime() - 7 * 86400000), $lt: weekStart },
        }),
    ]);
    const citizenGrowth = newCitizensLastWeek === 0
        ? newCitizensThisWeek > 0 ? 100 : 0
        : Math.round(((newCitizensThisWeek - newCitizensLastWeek) / newCitizensLastWeek) * 100);
    // ── Lawyers ─────────────────────────────────────────────────────────────────
    const [totalLawyers, verifiedLawyers, pendingLawyers, newLawyersThisWeek,] = await Promise.all([
        LawyerProfile_model_1.LawyerProfileModel.countDocuments(),
        LawyerProfile_model_1.LawyerProfileModel.countDocuments({ verificationStatus: types_1.VerificationStatus.VERIFIED }),
        LawyerProfile_model_1.LawyerProfileModel.countDocuments({ verificationStatus: types_1.VerificationStatus.PENDING }),
        User_model_1.UserModel.countDocuments({ role: 'lawyer', createdAt: { $gte: weekStart } }),
    ]);
    // ── Consultations ───────────────────────────────────────────────────────────
    const [totalConsultations, activeConsultations, completedConsultations, disputedConsultations, newConsultationsToday,] = await Promise.all([
        Consultation_model_1.ConsultationModel.countDocuments(),
        Consultation_model_1.ConsultationModel.countDocuments({ status: { $in: ['pending', 'accepted'] } }),
        Consultation_model_1.ConsultationModel.countDocuments({ status: 'completed' }),
        Consultation_model_1.ConsultationModel.countDocuments({ status: 'declined' }),
        Consultation_model_1.ConsultationModel.countDocuments({ createdAt: { $gte: todayStart } }),
    ]);
    // ── Revenue ─────────────────────────────────────────────────────────────────
    const revenueAgg = await Consultation_model_1.ConsultationModel.aggregate([
        { $match: { status: 'completed' } },
        {
            $group: {
                _id: null,
                totalGross: { $sum: '$feePaid' },
            },
        },
    ]);
    const thisMonthRevenueAgg = await Consultation_model_1.ConsultationModel.aggregate([
        { $match: { status: 'completed', completedAt: { $gte: thisMonthStart } } },
        { $group: { _id: null, total: { $sum: '$feePaid' } } },
    ]);
    const lastMonthRevenueAgg = await Consultation_model_1.ConsultationModel.aggregate([
        {
            $match: {
                status: 'completed',
                completedAt: { $gte: lastMonthStart, $lt: lastMonthEnd },
            },
        },
        { $group: { _id: null, total: { $sum: '$feePaid' } } },
    ]);
    const totalGross = revenueAgg[0]?.totalGross ?? 0;
    const thisMonthRevenue = thisMonthRevenueAgg[0]?.total ?? 0;
    const lastMonthRevenue = lastMonthRevenueAgg[0]?.total ?? 0;
    const revenueGrowth = lastMonthRevenue === 0
        ? thisMonthRevenue > 0 ? 100 : 0
        : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
    // ── Community ────────────────────────────────────────────────────────────────
    const [totalPosts, pendingPosts, reportedPosts, newPostsToday,] = await Promise.all([
        Community_model_1.CommunityPostModel.countDocuments(),
        Community_model_1.CommunityPostModel.countDocuments({ status: 'pending' }),
        Community_model_1.CommunityPostModel.countDocuments({ reportCount: { $gt: 0 } }),
        Community_model_1.CommunityPostModel.countDocuments({ createdAt: { $gte: todayStart } }),
    ]);
    // ── Library ──────────────────────────────────────────────────────────────────
    const [totalBooks, downloadsAgg, pendingOrders, libraryRevenueAgg,] = await Promise.all([
        Book_model_1.BookModel.countDocuments(),
        Book_model_1.BookModel.aggregate([{ $group: { _id: null, total: { $sum: '$downloadCount' } } }]),
        BookOrder_model_1.BookOrderModel.countDocuments({ status: { $in: ['pending', 'processing'] } }),
        BookOrder_model_1.BookOrderModel.aggregate([
            {
                $match: {
                    status: { $ne: 'cancelled' },
                    orderedAt: { $gte: thisMonthStart },
                },
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
    ]);
    return {
        citizens: {
            total: totalCitizens,
            active: activeCitizens,
            inactive: totalCitizens - activeCitizens,
            newThisWeek: newCitizensThisWeek,
            growthPercent: citizenGrowth,
        },
        lawyers: {
            total: totalLawyers,
            verified: verifiedLawyers,
            pendingVerification: pendingLawyers,
            newThisWeek: newLawyersThisWeek,
        },
        consultations: {
            total: totalConsultations,
            active: activeConsultations,
            completed: completedConsultations,
            disputed: disputedConsultations,
            newToday: newConsultationsToday,
        },
        revenue: {
            totalGross,
            platformCommission: Math.round(totalGross * COMMISSION_RATE),
            thisMonth: thisMonthRevenue,
            lastMonth: lastMonthRevenue,
            growthPercent: revenueGrowth,
        },
        community: {
            totalPosts,
            pendingReview: pendingPosts,
            reportedPosts,
            newToday: newPostsToday,
        },
        library: {
            totalBooks,
            totalDownloads: downloadsAgg[0]?.total ?? 0,
            pendingOrders,
            revenueThisMonth: libraryRevenueAgg[0]?.total ?? 0,
        },
    };
}
// ─── Analytics ────────────────────────────────────────────────────────────────
async function getDashboardAnalytics(period) {
    const days = periodToDays(period);
    const since = startOf(days);
    const buckets = buildDateBuckets(days);
    // ── Revenue time-series ──────────────────────────────────────────────────────
    const revenueRaw = await Consultation_model_1.ConsultationModel.aggregate([
        { $match: { status: 'completed', completedAt: { $gte: since } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
                gross: { $sum: '$feePaid' },
            },
        },
    ]);
    const revenueMap = new Map(revenueRaw.map((r) => [r._id, r.gross]));
    const revenueData = buckets.map(({ date, label }) => {
        const gross = revenueMap.get(date) ?? 0;
        const commission = Math.round(gross * COMMISSION_RATE);
        return {
            date,
            label,
            gross,
            commission,
            lawyerPayout: gross - commission,
        };
    });
    // ── Consultations time-series ─────────────────────────────────────────────
    const consultRaw = await Consultation_model_1.ConsultationModel.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    status: '$status',
                },
                count: { $sum: 1 },
            },
        },
    ]);
    const consultMap = new Map();
    for (const row of consultRaw) {
        const { date, status } = row._id;
        if (!consultMap.has(date)) {
            consultMap.set(date, { completed: 0, disputed: 0, cancelled: 0 });
        }
        const bucket = consultMap.get(date);
        if (status === 'completed')
            bucket.completed += row.count;
        else if (status === 'declined')
            bucket.disputed += row.count;
        else if (status === 'cancelled')
            bucket.cancelled += row.count;
    }
    const consultationData = buckets.map(({ date, label }) => {
        const b = consultMap.get(date) ?? { completed: 0, disputed: 0, cancelled: 0 };
        return { date, label, ...b };
    });
    // ── User growth time-series ───────────────────────────────────────────────
    const userRaw = await User_model_1.UserModel.aggregate([
        { $match: { createdAt: { $gte: since }, role: { $in: ['citizen', 'lawyer'] } } },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    role: '$role',
                },
                count: { $sum: 1 },
            },
        },
    ]);
    const userMap = new Map();
    for (const row of userRaw) {
        const { date, role } = row._id;
        if (!userMap.has(date))
            userMap.set(date, { citizens: 0, lawyers: 0 });
        const b = userMap.get(date);
        if (role === 'citizen')
            b.citizens += row.count;
        else if (role === 'lawyer')
            b.lawyers += row.count;
    }
    // Seed cumulative starting points (all users created before window)
    const [priorCitizens, priorLawyers] = await Promise.all([
        User_model_1.UserModel.countDocuments({ role: 'citizen', createdAt: { $lt: since } }),
        User_model_1.UserModel.countDocuments({ role: 'lawyer', createdAt: { $lt: since } }),
    ]);
    let cumCitizens = priorCitizens;
    let cumLawyers = priorLawyers;
    const userGrowthData = buckets.map(({ date, label }) => {
        const b = userMap.get(date) ?? { citizens: 0, lawyers: 0 };
        cumCitizens += b.citizens;
        cumLawyers += b.lawyers;
        return {
            date,
            label,
            citizens: b.citizens,
            lawyers: b.lawyers,
            cumCitizens,
            cumLawyers,
        };
    });
    // ── Top lawyers ───────────────────────────────────────────────────────────
    const topLawyerProfiles = await LawyerProfile_model_1.LawyerProfileModel.find({
        verificationStatus: types_1.VerificationStatus.VERIFIED,
    })
        .sort({ consultationCount: -1, ratingAvg: -1 })
        .limit(10)
        .populate('userId', 'firstName lastName avatarUrl');
    // Dispute counts per lawyer
    const disputeAgg = await Consultation_model_1.ConsultationModel.aggregate([
        { $match: { status: 'declined' } },
        { $group: { _id: '$lawyerProfileId', count: { $sum: 1 } } },
    ]);
    const disputeMap = new Map(disputeAgg.map((d) => [String(d._id), d.count]));
    // Completion rate per lawyer
    const completionAgg = await Consultation_model_1.ConsultationModel.aggregate([
        { $match: { status: { $in: ['completed', 'declined', 'cancelled'] } } },
        {
            $group: {
                _id: '$lawyerProfileId',
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                total: { $sum: 1 },
            },
        },
    ]);
    const completionMap = new Map(completionAgg.map((c) => [
        String(c._id),
        c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0,
    ]));
    // Total earned per lawyer
    const earnedAgg = await Consultation_model_1.ConsultationModel.aggregate([
        { $match: { status: 'completed' } },
        {
            $group: {
                _id: '$lawyerProfileId',
                total: { $sum: { $multiply: ['$feePaid', 1 - COMMISSION_RATE] } },
            },
        },
    ]);
    const earnedMap = new Map(earnedAgg.map((e) => [String(e._id), Math.round(e.total)]));
    const topLawyers = topLawyerProfiles.map((p) => {
        const user = p.userId;
        const firstName = user?.firstName ?? '';
        const lastName = user?.lastName ?? '';
        const fullName = `${firstName} ${lastName}`.trim();
        const pid = String(p._id);
        return {
            lawyerId: String(p.userId),
            fullName: fullName || 'Unknown',
            avatarInitials: `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase(),
            colorA: p.colorA,
            colorB: p.colorB,
            scnNumber: p.scnNumber ?? '',
            specialisms: p.specialisms,
            consultationCount: p.consultationCount,
            rating: p.ratingAvg,
            reviewCount: p.reviewCount,
            totalEarned: earnedMap.get(pid) ?? 0,
            completionRate: completionMap.get(pid) ?? 0,
            disputeCount: disputeMap.get(pid) ?? 0,
        };
    });
    // ── Recent activity feed ──────────────────────────────────────────────────
    // Pull from multiple sources, merge and sort by createdAt desc
    const [recentConsultations, recentUsers, recentDisputes, recentPosts] = await Promise.all([
        Consultation_model_1.ConsultationModel.find({ createdAt: { $gte: startOf(3) } })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('citizenId', 'firstName lastName'),
        User_model_1.UserModel.find({ createdAt: { $gte: startOf(3) } })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('firstName lastName role createdAt'),
        Consultation_model_1.ConsultationModel.find({ status: 'declined', updatedAt: { $gte: startOf(3) } })
            .sort({ updatedAt: -1 })
            .limit(5)
            .populate('citizenId', 'firstName lastName'),
        Community_model_1.CommunityPostModel.find({ reportCount: { $gt: 0 }, createdAt: { $gte: startOf(3) } })
            .sort({ createdAt: -1 })
            .limit(5),
    ]);
    const activityItems = [];
    for (const c of recentConsultations) {
        const actor = c.citizenId;
        const name = actor ? `${actor.firstName} ${actor.lastName}`.trim() : 'Unknown';
        activityItems.push({
            id: String(c._id),
            type: 'consultation_booked',
            actorName: name,
            actorInitials: name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
            actorColor: '#1E3A5F',
            description: `Booked a ${c.mode} consultation`,
            metadata: { mode: c.mode, fee: c.feePaid },
            createdAt: c.createdAt.toISOString(),
        });
    }
    for (const u of recentUsers) {
        const name = `${u.firstName} ${u.lastName}`.trim();
        const type = u.role === 'lawyer' ? 'lawyer_applied' : 'citizen_joined';
        activityItems.push({
            id: String(u._id),
            type,
            actorName: name,
            actorInitials: name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
            actorColor: '#2D5A8E',
            description: u.role === 'lawyer' ? 'Applied as a lawyer' : 'Joined as a citizen',
            createdAt: u.createdAt.toISOString(),
        });
    }
    for (const d of recentDisputes) {
        const actor = d.citizenId;
        const name = actor ? `${actor.firstName} ${actor.lastName}`.trim() : 'Unknown';
        activityItems.push({
            id: `dispute-${String(d._id)}`,
            type: 'dispute_raised',
            actorName: name,
            actorInitials: name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
            actorColor: '#DC2626',
            description: 'Consultation declined / dispute raised',
            createdAt: d.updatedAt.toISOString(),
        });
    }
    for (const p of recentPosts) {
        const name = p.author?.name ?? 'Unknown';
        activityItems.push({
            id: `report-${String(p._id)}`,
            type: 'post_reported',
            actorName: name,
            actorInitials: name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
            actorColor: '#F59E0B',
            description: `Post reported ${p.reportCount} time(s)`,
            metadata: { reportCount: p.reportCount },
            createdAt: p.createdAt.toISOString(),
        });
    }
    // Sort newest first and cap at 20
    const recentActivity = activityItems
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20);
    // ── Pending actions ───────────────────────────────────────────────────────
    const [pendingVerificationCount, disputeCount, reportedPostCount, pendingOrderCount,] = await Promise.all([
        LawyerProfile_model_1.LawyerProfileModel.countDocuments({ verificationStatus: types_1.VerificationStatus.PENDING }),
        Consultation_model_1.ConsultationModel.countDocuments({ status: 'declined' }),
        Community_model_1.CommunityPostModel.countDocuments({ reportCount: { $gt: 0 }, status: { $ne: 'removed' } }),
        BookOrder_model_1.BookOrderModel.countDocuments({ status: 'pending' }),
    ]);
    const pendingActions = [];
    if (pendingVerificationCount > 0) {
        pendingActions.push({
            id: 'pending-verifications',
            type: 'lawyer_verification',
            title: 'Pending Lawyer Verifications',
            subtitle: `${pendingVerificationCount} application${pendingVerificationCount !== 1 ? 's' : ''} awaiting review`,
            urgency: pendingVerificationCount >= 10 ? 'critical' : pendingVerificationCount >= 5 ? 'high' : 'medium',
            count: pendingVerificationCount,
            createdAt: new Date().toISOString(),
        });
    }
    if (disputeCount > 0) {
        pendingActions.push({
            id: 'open-disputes',
            type: 'dispute',
            title: 'Open Disputes',
            subtitle: `${disputeCount} dispute${disputeCount !== 1 ? 's' : ''} need attention`,
            urgency: disputeCount >= 5 ? 'critical' : disputeCount >= 2 ? 'high' : 'medium',
            count: disputeCount,
            createdAt: new Date().toISOString(),
        });
    }
    if (reportedPostCount > 0) {
        pendingActions.push({
            id: 'reported-posts',
            type: 'reported_post',
            title: 'Reported Community Posts',
            subtitle: `${reportedPostCount} post${reportedPostCount !== 1 ? 's' : ''} flagged for review`,
            urgency: reportedPostCount >= 10 ? 'high' : 'medium',
            count: reportedPostCount,
            createdAt: new Date().toISOString(),
        });
    }
    if (pendingOrderCount > 0) {
        pendingActions.push({
            id: 'pending-orders',
            type: 'pending_order',
            title: 'Pending Library Orders',
            subtitle: `${pendingOrderCount} order${pendingOrderCount !== 1 ? 's' : ''} awaiting fulfilment`,
            urgency: 'medium',
            count: pendingOrderCount,
            createdAt: new Date().toISOString(),
        });
    }
    // ── Breakdowns ────────────────────────────────────────────────────────────
    const modeAgg = await Consultation_model_1.ConsultationModel.aggregate([
        { $group: { _id: '$mode', count: { $sum: 1 } } },
    ]);
    const consultationsByMode = { message: 0, call: 0, video: 0 };
    for (const r of modeAgg) {
        if (r._id in consultationsByMode) {
            consultationsByMode[r._id] = r.count;
        }
    }
    const statusAgg = await Consultation_model_1.ConsultationModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const consultationsByStatus = {};
    for (const r of statusAgg) {
        consultationsByStatus[r._id] = r.count;
    }
    const specialismAgg = await LawyerProfile_model_1.LawyerProfileModel.aggregate([
        { $match: { verificationStatus: types_1.VerificationStatus.VERIFIED } },
        { $unwind: { path: '$specialisms', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$specialisms', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
    ]);
    const lawyersBySpecialism = specialismAgg.map((r) => ({
        specialism: r._id,
        count: r.count,
    }));
    const stateAgg = await CitizenProfile_model_1.CitizenProfileModel.aggregate([
        { $match: { stateCode: { $exists: true, $ne: '' } } },
        { $group: { _id: '$stateCode', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
    ]);
    const citizensByState = stateAgg.map((r) => ({
        state: r._id,
        count: r.count,
    }));
    return {
        period,
        revenue: revenueData,
        consultations: consultationData,
        userGrowth: userGrowthData,
        topLawyers,
        recentActivity,
        pendingActions,
        consultationsByMode,
        consultationsByStatus,
        lawyersBySpecialism,
        citizensByState,
    };
}
//# sourceMappingURL=dashboard.service.js.map