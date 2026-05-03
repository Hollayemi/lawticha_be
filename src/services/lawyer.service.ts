import { FilterQuery, SortOrder } from 'mongoose';
import { LawyerModel } from '../models/Lawyer.model';
import { AuditLogModel } from '../models/Admin.model';
import { ILawyer, LawyerStatus, AuditAction } from '../models/types/lawticha.types';
import { AppError } from '../middleware/error';

// Helpers 

interface AdminCtx {
  adminId: string;
  adminName: string;
}

//  List lawyers 

export interface ListLawyersParams {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listLawyers(params: ListLawyersParams) {
  const { status = 'all', search, page = 1, pageSize = 20 } = params;

  const filter: FilterQuery<ILawyer> = { removedAt: null };

  if (status !== 'all' && Object.values(LawyerStatus).includes(status as LawyerStatus)) {
    filter.status = status;
  }

  if (search?.trim()) {
    filter.$text = { $search: search.trim() };
  }

  const skip = (page - 1) * pageSize;

  const [lawyers, total] = await Promise.all([
    LawyerModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .select('-passwordHash -googleId'),
    LawyerModel.countDocuments(filter),
  ]);

  return {
    data: lawyers.map(formatLawyerList),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

//  Get single lawyer 

export async function getLawyerById(id: string) {
  const lawyer = await LawyerModel.findOne({ _id: id, removedAt: null }).select(
    '-passwordHash -googleId'
  );
  if (!lawyer) throw new AppError('Lawyer not found', 404, 'NOT_FOUND');
  return { data: formatLawyerFull(lawyer) };
}

//  Update lawyer status 

export async function updateLawyerStatus(
  id: string,
  status: LawyerStatus,
  reason: string,
  admin: AdminCtx
) {
  if (!Object.values(LawyerStatus).includes(status)) {
    throw new AppError(
      `Invalid status. Must be one of: ${Object.values(LawyerStatus).join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }

  const lawyer = await LawyerModel.findOne({ _id: id, removedAt: null });
  if (!lawyer) throw new AppError('Lawyer not found', 404, 'NOT_FOUND');

  lawyer.status = status;
  // When suspended, mark as unavailable
  if (status === LawyerStatus.INACTIVE) lawyer.available = false;
  await lawyer.save();

  AuditLogModel.create({
    adminId:    admin.adminId,
    adminName:  admin.adminName,
    action:     AuditAction.LAWYER_STATUS_CHANGED,
    targetType: 'lawyer',
    targetId:   lawyer._id,
    meta:       { status, reason },
  }).catch(() => null);

  return {
    success: true,
    message: 'Lawyer status updated',
    data: { id: String(lawyer._id), status: lawyer.status },
  };
}

//  Send email to lawyer (stub) 

export async function emailLawyer(
  id: string,
  subject: string,
  body: string,
  admin: AdminCtx
) {
  const lawyer = await LawyerModel.findOne({ _id: id, removedAt: null });
  if (!lawyer) throw new AppError('Lawyer not found', 404, 'NOT_FOUND');

  // --- Production: call email provider here ---
  // await sendEmail({ to: lawyer.email, subject, html: body });
  console.log(`[EMAIL] To: ${lawyer.email} | Subject: ${subject}`);

  AuditLogModel.create({
    adminId:    admin.adminId,
    adminName:  admin.adminName,
    action:     AuditAction.LAWYER_EMAIL_SENT,
    targetType: 'lawyer',
    targetId:   lawyer._id,
    meta:       { subject },
  }).catch(() => null);

  return { success: true, message: 'Email sent successfully' };
}

//  Dashboard stats (lawyers slice) 

export async function getLawyerStats() {
  const [total, active, inactive, pending] = await Promise.all([
    LawyerModel.countDocuments({ removedAt: null }),
    LawyerModel.countDocuments({ status: LawyerStatus.ACTIVE,   removedAt: null }),
    LawyerModel.countDocuments({ status: LawyerStatus.INACTIVE, removedAt: null }),
    LawyerModel.countDocuments({ status: LawyerStatus.PENDING,  removedAt: null }),
  ]);

  // Average rating (only lawyers with at least one review)
  const ratingAgg = await LawyerModel.aggregate([
    { $match: { removedAt: null, reviewCount: { $gt: 0 } } },
    { $group: { _id: null, avg: { $avg: '$rating' } } },
  ]);
  const avgRating = ratingAgg[0]?.avg ? Number(ratingAgg[0].avg.toFixed(1)) : 0;

  return {
    totalLawyers:         total,
    activeLawyers:        active,
    inactiveLawyers:      inactive,
    pendingVerifications: pending,
    avgRating,
  };
}

//  Formatters 

function responseTimeLabel(minutes: number): string {
  if (minutes < 60) return `< ${minutes} min`;
  const h = Math.ceil(minutes / 60);
  return `< ${h} hr${h > 1 ? 's' : ''}`;
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

type LawyerDoc = ILawyer & { _id: any };

function formatLawyerList(l: LawyerDoc) {
  return {
    id:           String(l._id),
    name:         l.name,
    initials:     initials(l.name),
    color:        l.color,
    email:        l.email,
    phone:        l.phone,
    state:        l.state,
    specialisms:  l.specialisms,
    nbaNumber:    l.nbaNumber,
    yearsCall:    l.yearsCall,
    joinedAt:     (l as any).createdAt,
    status:       l.status,
    rating:       l.rating,
    reviewCount:  l.reviewCount,
    consultations: l.consultations,
    responseTime: responseTimeLabel(l.responseTimeMinutes),
    badges:       l.badges,
    lastActive:   l.lastActiveAt,
    available:    l.available,
  };
}

function formatLawyerFull(l: LawyerDoc) {
  return {
    ...formatLawyerList(l),
    bio:       l.bio,
    languages: l.languages,
    fee:       l.fee,
  };
}
