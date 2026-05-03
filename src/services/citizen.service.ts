import { FilterQuery, SortOrder } from 'mongoose';
import { CitizenModel } from '../models/Citizen.model';
import { AuditLogModel } from '../models/Admin.model';
import { ICitizen, CitizenStatus, AuditAction } from '../models/types/lawticha.types';
import { AppError } from '../middleware/error';

//  Helpers 

const ALLOWED_SORT_FIELDS: Record<string, string> = {
  joinedAt:   'createdAt',
  name:       'name',
  topicsRead: 'topicsRead',
  lastActive: 'lastActiveAt',
};

interface AdminCtx {
  adminId: string;
  adminName: string;
}

//  List citizens 

export interface ListCitizensParams {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listCitizens(params: ListCitizensParams) {
  const {
    status = 'all',
    search,
    page = 1,
    pageSize = 20,
    sortBy = 'joinedAt',
    sortOrder = 'desc',
  } = params;

  const filter: FilterQuery<ICitizen> = { removedAt: null };

  if (status !== 'all' && Object.values(CitizenStatus).includes(status as CitizenStatus)) {
    filter.status = status;
  }

  if (search?.trim()) {
    filter.$text = { $search: search.trim() };
  }

  const sortField = ALLOWED_SORT_FIELDS[sortBy] ?? 'createdAt';
  const sort: Record<string, SortOrder> = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

  const skip = (page - 1) * pageSize;

  const [citizens, total] = await Promise.all([
    CitizenModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .select('-passwordHash -googleId'),
    CitizenModel.countDocuments(filter),
  ]);

  return {
    data: citizens.map(formatCitizenList),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

//  Get single citizen 

export async function getCitizenById(id: string) {
  const citizen = await CitizenModel.findOne({ _id: id, removedAt: null }).select(
    '-passwordHash -googleId'
  );
  if (!citizen) throw new AppError('Citizen not found', 404, 'NOT_FOUND');
  return { data: formatCitizenFull(citizen) };
}

//  Update citizen status 

export async function updateCitizenStatus(
  id: string,
  status: CitizenStatus,
  reason: string,
  admin: AdminCtx
) {
  if (!Object.values(CitizenStatus).includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${Object.values(CitizenStatus).join(', ')}`, 400, 'VALIDATION_ERROR');
  }

  const citizen = await CitizenModel.findOne({ _id: id, removedAt: null });
  if (!citizen) throw new AppError('Citizen not found', 404, 'NOT_FOUND');

  citizen.status = status;
  await citizen.save();

  // Audit log (fire-and-forget)
  AuditLogModel.create({
    adminId:    admin.adminId,
    adminName:  admin.adminName,
    action:     AuditAction.CITIZEN_STATUS_CHANGED,
    targetType: 'citizen',
    targetId:   citizen._id,
    meta:       { status, reason },
  }).catch(() => null);

  return {
    success: true,
    message: 'Citizen status updated',
    data: { id: citizen._id, status: citizen.status },
  };
}

//  Send email to citizen (stub — wire up nodemailer/SendGrid) 

export async function emailCitizen(
  id: string,
  subject: string,
  body: string,
  admin: AdminCtx
) {
  const citizen = await CitizenModel.findOne({ _id: id, removedAt: null });
  if (!citizen) throw new AppError('Citizen not found', 404, 'NOT_FOUND');

  // --- Production: call email provider here ---
  // await sendEmail({ to: citizen.email, subject, html: body });
  console.log(`[EMAIL] To: ${citizen.email} | Subject: ${subject}`);

  AuditLogModel.create({
    adminId:    admin.adminId,
    adminName:  admin.adminName,
    action:     AuditAction.CITIZEN_EMAIL_SENT,
    targetType: 'citizen',
    targetId:   citizen._id,
    meta:       { subject },
  }).catch(() => null);

  return { success: true, message: 'Email sent successfully' };
}

//  Dashboard stats (citizens slice) 

export async function getCitizenStats() {
  const [total, active, inactive, flagged] = await Promise.all([
    CitizenModel.countDocuments({ removedAt: null }),
    CitizenModel.countDocuments({ status: CitizenStatus.ACTIVE,   removedAt: null }),
    CitizenModel.countDocuments({ status: CitizenStatus.INACTIVE, removedAt: null }),
    CitizenModel.countDocuments({ status: CitizenStatus.WARNING,  removedAt: null }),
  ]);

  return { totalCitizens: total, activeCitizens: active, inactiveCitizens: inactive, flaggedCitizens: flagged };
}

//  Formatters 

function formatCitizenList(c: ICitizen & { _id: any; initials?: string }) {
  return {
    id:            String(c._id),
    name:          c.name,
    initials:      c.initials ?? initials(c.name),
    color:         c.color,
    email:         c.email,
    phone:         c.phone,
    state:         c.state,
    joinedAt:      (c as any).createdAt,
    status:        c.status,
    topicsRead:    c.topicsRead,
    consultations: c.consultations,
    lastActive:    c.lastActiveAt,
    reportCount:   c.reportCount,
  };
}

function formatCitizenFull(c: ICitizen & { _id: any; initials?: string }) {
  return {
    ...formatCitizenList(c),
    modulesEnrolled:  c.modulesEnrolled.map(String),
    bookmarkedTopics: c.bookmarkedTopics,
    communityPosts:   c.communityPosts,
  };
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
