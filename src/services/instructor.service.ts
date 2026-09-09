import { Types } from 'mongoose';
import { LawyerProfileModel } from '../models/LawyerProfile.model';
import { UserModel } from '../models/User.model';
import { AuditLogModel } from '../models/Admin.model';
import { AuditAction } from '../models/types';
import { InstructorStatus } from '../models/types/lawticha.types';
import { ModuleModel, ActivityModel } from '../models/Module.model';
import { AppError } from '../middleware/error';
import NotificationController from '../controllers/others/notification';

interface AdminCtx {
  adminId: string;
  adminName: string;
}

//  Lawyer: request to become an instructor 

export async function requestInstructor(userId: string, motivation?: string) {
  const profile = await LawyerProfileModel.findOne({ userId });
  if (!profile) {
    throw new AppError('Complete your lawyer profile before applying to teach.', 404, 'NOT_FOUND');
  }
  // if (!profile.isVerified) {
  //   throw new AppError('Only NBA-verified lawyers can apply to become instructors.', 403, 'FORBIDDEN');
  // }

  await profile.requestInstructor(motivation);

  await NotificationController.saveAndSendNotification(
    {
      userId,
      title: '📝 Instructor Request Submitted',
      body: 'Your request to become an instructor has been received and is under review.',
      type: 'instructor_request_submitted',
      clickUrl: `${process.env.CLIENT_URL}/dashboard/settings?tab=lawyer_profile`,
      priority: 'medium',
    },
    'user',
    { push_notification: true }
  ).catch(() => null);

  return { message: 'Instructor request submitted.', profile };
}

//  Lawyer: check own instructor status 

export async function getInstructorStatus(userId: string) {
  const profile = await LawyerProfileModel.findOne({ userId });
  if (!profile) throw new AppError('Lawyer profile not found.', 404, 'NOT_FOUND');

  return {
    instructorStatus: profile.instructorStatus,
    instructorRequestedAt: profile.instructorRequestedAt ?? null,
    instructorApprovedAt: profile.instructorApprovedAt ?? null,
    instructorRejectedReason: profile.instructorRejectedReason ?? null,
  };
}

//  Admin: list instructor requests (queue) 

export interface InstructorRequestFilters {
  status?: InstructorStatus | 'all';
  page?: number;
  pageSize?: number;
}

export async function listInstructorRequests(filters: InstructorRequestFilters = {}) {
  const { status = InstructorStatus.PENDING, page = 1, pageSize = 20 } = filters;

  const filter: Record<string, unknown> = {};
  if (status && status !== 'all') filter.instructorStatus = status;
  else filter.instructorStatus = { $ne: InstructorStatus.NONE };

  const skip = (page - 1) * pageSize;

  const [docs, total] = await Promise.all([
    LawyerProfileModel.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ instructorRequestedAt: -1 })
      .skip(skip)
      .limit(pageSize),
    LawyerProfileModel.countDocuments(filter),
  ]);

  return {
    data: docs.map((p) => ({
      lawyerProfileId: String(p._id),
      userId: String(p.userId),
      user: p.userId, // populated
      title: p.title,
      specialisms: p.specialisms,
      scnNumber: p.scnNumber,
      instructorStatus: p.instructorStatus,
      instructorMotivation: p.instructorMotivation,
      instructorRequestedAt: p.instructorRequestedAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

//  Admin: approve instructor request 

export async function approveInstructorRequest(lawyerProfileId: string, admin: AdminCtx) {
  const profile = await LawyerProfileModel.findById(lawyerProfileId);
  if (!profile) throw new AppError('Lawyer profile not found.', 404, 'NOT_FOUND');

  await profile.approveInstructor(new Types.ObjectId(admin.adminId));

  await NotificationController.saveAndSendNotification(
    {
      userId: profile.userId.toString(),
      title: '🎉 Instructor Application Approved!',
      body: "You're now an approved instructor. You can start creating legal content and earn as it grows.",
      type: 'instructor_request_approved',
      clickUrl: `${process.env.CLIENT_URL}/instructor/dashboard`,
      priority: 'high',
    },
    'user',
    { push_notification: true, email_notification: true }
  ).catch(() => null);

  AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.INSTRUCTOR_REQUEST_APPROVED,
    targetType: 'instructor',
    targetId: profile._id,
    meta: { userId: profile.userId.toString() },
  }).catch(() => null);

  return { message: 'Instructor request approved.', profile };
}

//  Admin: reject instructor request 

export async function rejectInstructorRequest(
  lawyerProfileId: string,
  admin: AdminCtx,
  reason: string
) {
  const profile = await LawyerProfileModel.findById(lawyerProfileId);
  if (!profile) throw new AppError('Lawyer profile not found.', 404, 'NOT_FOUND');

  await profile.rejectInstructor(new Types.ObjectId(admin.adminId), reason);

  await NotificationController.saveAndSendNotification(
    {
      userId: profile.userId.toString(),
      title: 'Instructor Application Update',
      body: `Your instructor request wasn't approved this time. Reason: ${reason || 'Please contact support for details.'}`,
      type: 'instructor_request_rejected',
      clickUrl: `${process.env.CLIENT_URL}/dashboard/settings?tab=lawyer_profile`,
      priority: 'medium',
    },
    'user',
    { push_notification: true, email_notification: true }
  ).catch(() => null);

  AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.INSTRUCTOR_REQUEST_REJECTED,
    targetType: 'instructor',
    targetId: profile._id,
    meta: { reason },
  }).catch(() => null);

  return { message: 'Instructor request rejected.', profile };
}

//  Instructor: dashboard stats across their own modules 

export async function getInstructorDashboardStats(userId: string) {
  const instructorId = new Types.ObjectId(userId);

  const modules = await ModuleModel.find({ instructorId });
  const moduleIds = modules.map((m) => m._id);

  const totals = modules.reduce(
    (acc, m) => {
      acc.enrolledCount += m.enrolledCount || 0;
      acc.totalWatchTimeHours += m.totalWatchTimeHours || 0;
      acc.reviewCount += m.reviewCount || 0;
      acc.ratingSum += (m.avgRating || 0) * (m.reviewCount || 0);
      return acc;
    },
    { enrolledCount: 0, totalWatchTimeHours: 0, reviewCount: 0, ratingSum: 0 }
  );

  const byStatus = modules.reduce((acc: Record<string, number>, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {});

  // Growth over the last 30 days, from enrollment activity on this instructor's modules
  const since = new Date(Date.now() - 30 * 86_400_000);
  let enrollmentTrend: { date: string; count: number }[] = [];
  try {
    const trend = await ActivityModel.aggregate([
      {
        $match: {
          moduleId: { $in: moduleIds },
          action: 'enrolled',
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    enrollmentTrend = trend.map((t) => ({ date: t._id, count: t.count }));
  } catch { /* Activity model may be empty */ }

  const topModules = [...modules]
    .sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0))
    .slice(0, 5)
    .map((m) => ({
      id: String(m._id),
      title: m.title,
      status: m.status,
      enrolledCount: m.enrolledCount,
      avgRating: m.avgRating,
      completionRate: m.completionRate,
    }));

  return {
    totalModules: modules.length,
    modulesByStatus: byStatus,
    totalEnrolled: totals.enrolledCount,
    totalWatchTimeHours: totals.totalWatchTimeHours,
    avgRating: totals.reviewCount > 0 ? Number((totals.ratingSum / totals.reviewCount).toFixed(2)) : 0,
    enrollmentTrend,
    topModules,
  };
}
