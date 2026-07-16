import { Types } from 'mongoose';
import { UserModel } from '../models/User.model';
import { LawyerProfileModel } from '../models/LawyerProfile.model';
import { CitizenProfileModel } from '../models/CitizenProfile.model';
import { ConsultationModel, LawyerRequestModel } from '../models/Consultation.model';
import { CommunityPostModel } from '../models/Community.model';
import { BookModel } from '../models/Book.model';
import { BookOrderModel } from '../models/BookOrder.model';
import { VerificationStatus } from '../models/types';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Platform keeps this fraction of every consultation fee */
const COMMISSION_RATE = 0.2;

type Period = '7d' | '30d' | '90d' | '1y';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function periodToDays(period: Period): number {
  return { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period];
}

function startOf(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function startOfDay(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

function startOfMonth(offsetMonths = 0): Date {
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
function buildDateBuckets(days: number): { date: string; label: string }[] {
  const buckets: { date: string; label: string }[] = [];
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

export async function getDashboardOverview() {
  const now = new Date();
  const todayStart = startOfDay();
  const weekStart = startOfWeek();
  const thisMonthStart = startOfMonth();
  const lastMonthStart = startOfMonth(1);
  const lastMonthEnd = thisMonthStart;

  // ── Citizens ────────────────────────────────────────────────────────────────
  const [
    totalCitizens,
    activeCitizens,
    newCitizensThisWeek,
    newCitizensLastWeek,
  ] = await Promise.all([
    UserModel.countDocuments({ role: 'citizen' }),
    UserModel.countDocuments({ role: 'citizen', isActive: true }),
    UserModel.countDocuments({ role: 'citizen', createdAt: { $gte: weekStart } }),
    UserModel.countDocuments({
      role: 'citizen',
      createdAt: { $gte: new Date(weekStart.getTime() - 7 * 86_400_000), $lt: weekStart },
    }),
  ]);

  const citizenGrowth =
    newCitizensLastWeek === 0
      ? newCitizensThisWeek > 0 ? 100 : 0
      : Math.round(((newCitizensThisWeek - newCitizensLastWeek) / newCitizensLastWeek) * 100);

  // ── Lawyers ─────────────────────────────────────────────────────────────────
  const [
    totalLawyers,
    verifiedLawyers,
    pendingLawyers,
    newLawyersThisWeek,
  ] = await Promise.all([
    LawyerProfileModel.countDocuments(),
    LawyerProfileModel.countDocuments({ verificationStatus: VerificationStatus.VERIFIED }),
    LawyerProfileModel.countDocuments({ verificationStatus: VerificationStatus.PENDING }),
    UserModel.countDocuments({ role: 'lawyer', createdAt: { $gte: weekStart } }),
  ]);

  // ── Consultations ───────────────────────────────────────────────────────────
  const [
    totalConsultations,
    activeConsultations,
    completedConsultations,
    disputedConsultations,
    newConsultationsToday,
  ] = await Promise.all([
    ConsultationModel.countDocuments(),
    ConsultationModel.countDocuments({ status: { $in: ['pending', 'accepted'] } }),
    ConsultationModel.countDocuments({ status: 'completed' }),
    ConsultationModel.countDocuments({ status: 'declined' }),
    ConsultationModel.countDocuments({ createdAt: { $gte: todayStart } }),
  ]);

  // ── Revenue ─────────────────────────────────────────────────────────────────
  const revenueAgg = await ConsultationModel.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: null,
        totalGross: { $sum: '$feePaid' },
      },
    },
  ]);

  const thisMonthRevenueAgg = await ConsultationModel.aggregate([
    { $match: { status: 'completed', completedAt: { $gte: thisMonthStart } } },
    { $group: { _id: null, total: { $sum: '$feePaid' } } },
  ]);

  const lastMonthRevenueAgg = await ConsultationModel.aggregate([
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

  const revenueGrowth =
    lastMonthRevenue === 0
      ? thisMonthRevenue > 0 ? 100 : 0
      : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);

  // ── Community ────────────────────────────────────────────────────────────────
  const [
    totalPosts,
    pendingPosts,
    reportedPosts,
    newPostsToday,
  ] = await Promise.all([
    CommunityPostModel.countDocuments(),
    CommunityPostModel.countDocuments({ status: 'pending' }),
    CommunityPostModel.countDocuments({ reportCount: { $gt: 0 } }),
    CommunityPostModel.countDocuments({ createdAt: { $gte: todayStart } }),
  ]);

  // ── Library ──────────────────────────────────────────────────────────────────
  const [
    totalBooks,
    downloadsAgg,
    pendingOrders,
    libraryRevenueAgg,
  ] = await Promise.all([
    BookModel.countDocuments(),
    BookModel.aggregate([{ $group: { _id: null, total: { $sum: '$downloadCount' } } }]),
    BookOrderModel.countDocuments({ status: { $in: ['pending', 'processing'] } }),
    BookOrderModel.aggregate([
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

export async function getDashboardAnalytics(period: Period) {
  const days = periodToDays(period);
  const since = startOf(days);
  const buckets = buildDateBuckets(days);

  // ── Revenue time-series ──────────────────────────────────────────────────────
  const revenueRaw = await ConsultationModel.aggregate([
    { $match: { status: 'completed', completedAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
        gross: { $sum: '$feePaid' },
      },
    },
  ]);

  const revenueMap = new Map(revenueRaw.map((r) => [r._id, r.gross as number]));

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
  const consultRaw = await ConsultationModel.aggregate([
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

  type ConsultBucket = { completed: number; disputed: number; cancelled: number };
  const consultMap = new Map<string, ConsultBucket>();

  for (const row of consultRaw) {
    const { date, status } = row._id;
    if (!consultMap.has(date)) {
      consultMap.set(date, { completed: 0, disputed: 0, cancelled: 0 });
    }
    const bucket = consultMap.get(date)!;
    if (status === 'completed') bucket.completed += row.count;
    else if (status === 'declined') bucket.disputed += row.count;
    else if (status === 'cancelled') bucket.cancelled += row.count;
  }

  const consultationData = buckets.map(({ date, label }) => {
    const b = consultMap.get(date) ?? { completed: 0, disputed: 0, cancelled: 0 };
    return { date, label, ...b };
  });

  // ── User growth time-series ───────────────────────────────────────────────
  const userRaw = await UserModel.aggregate([
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

  type DailyUsers = { citizens: number; lawyers: number };
  const userMap = new Map<string, DailyUsers>();

  for (const row of userRaw) {
    const { date, role } = row._id;
    if (!userMap.has(date)) userMap.set(date, { citizens: 0, lawyers: 0 });
    const b = userMap.get(date)!;
    if (role === 'citizen') b.citizens += row.count;
    else if (role === 'lawyer') b.lawyers += row.count;
  }

  // Seed cumulative starting points (all users created before window)
  const [priorCitizens, priorLawyers] = await Promise.all([
    UserModel.countDocuments({ role: 'citizen', createdAt: { $lt: since } }),
    UserModel.countDocuments({ role: 'lawyer', createdAt: { $lt: since } }),
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
  const topLawyerProfiles = await LawyerProfileModel.find({
    verificationStatus: VerificationStatus.VERIFIED,
  })
    .sort({ consultationCount: -1, ratingAvg: -1 })
    .limit(10)
    .populate('userId', 'firstName lastName avatarUrl');

  // Dispute counts per lawyer
  const disputeAgg = await ConsultationModel.aggregate([
    { $match: { status: 'declined' } },
    { $group: { _id: '$lawyerProfileId', count: { $sum: 1 } } },
  ]);
  const disputeMap = new Map(disputeAgg.map((d) => [String(d._id), d.count as number]));

  // Completion rate per lawyer
  const completionAgg = await ConsultationModel.aggregate([
    { $match: { status: { $in: ['completed', 'declined', 'cancelled'] } } },
    {
      $group: {
        _id: '$lawyerProfileId',
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
  ]);
  const completionMap = new Map(
    completionAgg.map((c) => [
      String(c._id),
      c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0,
    ])
  );

  // Total earned per lawyer
  const earnedAgg = await ConsultationModel.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$lawyerProfileId',
        total: { $sum: { $multiply: ['$feePaid', 1 - COMMISSION_RATE] } },
      },
    },
  ]);
  const earnedMap = new Map(earnedAgg.map((e) => [String(e._id), Math.round(e.total as number)]));

  const topLawyers = topLawyerProfiles.map((p) => {
    const user = p.userId as any;
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
      nbaNumber: p.nbaNumber ?? '',
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
    ConsultationModel.find({ createdAt: { $gte: startOf(3) } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('citizenId', 'firstName lastName'),
    UserModel.find({ createdAt: { $gte: startOf(3) } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('firstName lastName role createdAt'),
    ConsultationModel.find({ status: 'declined', updatedAt: { $gte: startOf(3) } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('citizenId', 'firstName lastName'),
    CommunityPostModel.find({ reportCount: { $gt: 0 }, createdAt: { $gte: startOf(3) } })
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  const activityItems: any[] = [];

  for (const c of recentConsultations) {
    const actor = c.citizenId as any;
    const name = actor ? `${actor.firstName} ${actor.lastName}`.trim() : 'Unknown';
    activityItems.push({
      id: String(c._id),
      type: 'consultation_booked',
      actorName: name,
      actorInitials: name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
      actorColor: '#1E3A5F',
      description: `Booked a ${c.mode} consultation`,
      metadata: { mode: c.mode, fee: c.feePaid },
      createdAt: (c as any).createdAt.toISOString(),
    });
  }

  for (const u of recentUsers) {
    const name = `${(u as any).firstName} ${(u as any).lastName}`.trim();
    const type = u.role === 'lawyer' ? 'lawyer_applied' : 'citizen_joined';
    activityItems.push({
      id: String(u._id),
      type,
      actorName: name,
      actorInitials: name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
      actorColor: '#2D5A8E',
      description: u.role === 'lawyer' ? 'Applied as a lawyer' : 'Joined as a citizen',
      createdAt: (u as any).createdAt.toISOString(),
    });
  }

  for (const d of recentDisputes) {
    const actor = d.citizenId as any;
    const name = actor ? `${actor.firstName} ${actor.lastName}`.trim() : 'Unknown';
    activityItems.push({
      id: `dispute-${String(d._id)}`,
      type: 'dispute_raised',
      actorName: name,
      actorInitials: name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
      actorColor: '#DC2626',
      description: 'Consultation declined / dispute raised',
      createdAt: (d as any).updatedAt.toISOString(),
    });
  }

  for (const p of recentPosts) {
    const name = (p as any).author?.name ?? 'Unknown';
    activityItems.push({
      id: `report-${String(p._id)}`,
      type: 'post_reported',
      actorName: name,
      actorInitials: name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
      actorColor: '#F59E0B',
      description: `Post reported ${(p as any).reportCount} time(s)`,
      metadata: { reportCount: (p as any).reportCount },
      createdAt: (p as any).createdAt.toISOString(),
    });
  }

  // Sort newest first and cap at 20
  const recentActivity = activityItems
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  // ── Pending actions ───────────────────────────────────────────────────────
  const [
    pendingVerificationCount,
    disputeCount,
    reportedPostCount,
    pendingOrderCount,
  ] = await Promise.all([
    LawyerProfileModel.countDocuments({ verificationStatus: VerificationStatus.PENDING }),
    ConsultationModel.countDocuments({ status: 'declined' }),
    CommunityPostModel.countDocuments({ reportCount: { $gt: 0 }, status: { $ne: 'removed' } }),
    BookOrderModel.countDocuments({ status: 'pending' }),
  ]);

  const pendingActions: any[] = [];

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
  const modeAgg = await ConsultationModel.aggregate([
    { $group: { _id: '$mode', count: { $sum: 1 } } },
  ]);
  const consultationsByMode = { message: 0, call: 0, video: 0 };
  for (const r of modeAgg) {
    if (r._id in consultationsByMode) {
      (consultationsByMode as any)[r._id] = r.count;
    }
  }

  const statusAgg = await ConsultationModel.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const consultationsByStatus: Record<string, number> = {};
  for (const r of statusAgg) {
    consultationsByStatus[r._id] = r.count;
  }

  const specialismAgg = await LawyerProfileModel.aggregate([
    { $match: { verificationStatus: VerificationStatus.VERIFIED } },
    { $unwind: { path: '$specialisms', preserveNullAndEmptyArrays: false } },
    { $group: { _id: '$specialisms', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  const lawyersBySpecialism = specialismAgg.map((r) => ({
    specialism: r._id as string,
    count: r.count as number,
  }));

  const stateAgg = await CitizenProfileModel.aggregate([
    { $match: { stateCode: { $exists: true, $ne: '' } } },
    { $group: { _id: '$stateCode', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 15 },
  ]);
  const citizensByState = stateAgg.map((r) => ({
    state: r._id as string,
    count: r.count as number,
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
