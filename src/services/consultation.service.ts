import { Types } from 'mongoose';
import { ConsultationModel, LawyerRequestModel } from '../models/Consultation.model';
import { LawyerProfileModel } from '../models/LawyerProfile.model';
import { UserModel } from '../models/User.model';
import { AuditLogModel } from '../models/Admin.model';
import { AuditAction, MatchStatus, VerificationStatus } from '../models/types';
import { AppError } from '../middleware/error';
import {
  ConsultStatus,
  ConsultMode,
  MatchRequestStatus,
  IConsultationStats,
  IMessage,
  IConsultationDocumentMeta,
  IRecommendedLawyer,
} from '../models/types';
import { bookConsultation, receiptId } from './lawyer.service';
import { isWithinBudget } from '../utils/functions';
import PaymentGateway from './payment/payment';
import CloudinaryService from '../utils/cloudinary';
import { lawyerObject } from '../helpers/formatReturn';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminCtx {
  adminId: string;
  adminName: string;
}

export interface ListConsultationsParams {
  status?: ConsultStatus | 'all';
  mode?: ConsultMode | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  citizenId?: string;
  lawyerId?: string;
  disputed?: boolean;
  flagged?: boolean;
}

export interface ListMatchRequestsParams {
  status?: MatchRequestStatus | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
  urgency?: string;
}

export interface UpdateConsultationStatusPayload {
  status: ConsultStatus;
  note?: string;
}

export interface ResolveDisputePayload {
  decision: 'citizen' | 'lawyer';
  refundAmount?: number;
  reason: string;
}

export interface FlagConsultationPayload {
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ApproveRefundPayload {
  approved: boolean;
  adminNote?: string;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getRandomColor(): string {
  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#F97316'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export interface UploadDocumentInput {
  file: Buffer | Express.Multer.File | string;
  name: string;
  sizeBytes?: number;
  label?: string;
}

/**
 * Uploads a single document (PDF, image, Word doc, etc.) to Cloudinary as a raw asset
 * and returns the metadata shape stored on a match request.
 */
async function uploadMatchDocument(
  citizenId: string,
  input: UploadDocumentInput,
  source: 'citizen' | 'firm'
): Promise<IConsultationDocumentMeta> {
  const { url, publicId } = await CloudinaryService.uploadFile(
    input.file,
    `match-requests/${citizenId}`,
    'raw'
  );

  return {
    name: input.name,
    fileUrl: url,
    publicId,
    sizeBytes: input.sizeBytes || 0,
    label: input.label,
    source,
    uploadedAt: new Date(),
  };
}

/** Maps a lawyer profile document into the lightweight snapshot stored on recommendedLawyers/matched fields. */
function toRecommendedLawyerRef(profile: any): IRecommendedLawyer {
  console.log(profile)
  const user = profile.userId as any;
  const name = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown';
  return {
    lawyerId: user?._id || profile.userId,
    lawyerProfileId: profile._id,
    name,
    initials: getInitials(name),
    color: profile.colorA || getRandomColor(),
    nbaNumber: profile.nbaNumber || '',
    title: profile.title,
  };
}

/** Maps a raw LawyerRequest mongoose document into the DTO shape consumed by the frontend. */
function mapMatchRequestToDTO(req: any) {
  const citizen = req.citizenId;
  console.log({ law:req.matchedLawyerProfileId })
  const name = citizen?.fullName || `${citizen?.firstName || ''} ${citizen?.lastName || ''}`.trim() || 'Unknown';
  return {
    id: req._id,
    citizen: {
      id: citizen?._id?.toString(),
      name,
      initials: getInitials(name),
      color: getRandomColor(),
      email: citizen?.email,
      phone: citizen?.phone,
      state: citizen?.state,
    },
    specialism: req.specialism,
    urgency: req.urgency,
    mode: req.mode,
    topic: req.topic,
    budget: req.budget,
    description: req.description,
    notes: req.notes,
    documents: (req.documents || []).map((d: any) => ({
      name: d.name,
      fileUrl: d.fileUrl,
      sizeBytes: d.sizeBytes,
      label: d.label,
      source: d.source,
      uploadedAt: d.uploadedAt?.toISOString?.() || d.uploadedAt,
    })),
    caseBrief: req.caseBrief
      ? {
        name: req.caseBrief.name,
        fileUrl: req.caseBrief.fileUrl,
        sizeBytes: req.caseBrief.sizeBytes,
        label: req.caseBrief.label,
        source: req.caseBrief.source,
        uploadedAt: req.caseBrief.uploadedAt?.toISOString?.() || req.caseBrief.uploadedAt,
      }
      : undefined,
    adminMessage: req.adminMessage,
    adminMessageAt: req.adminMessageAt?.toISOString?.(),
    scheduledCall: req.scheduledCall
      ? {
        dateTime: req.scheduledCall.dateTime?.toISOString?.() || req.scheduledCall.dateTime,
        link: req.scheduledCall.link,
        note: req.scheduledCall.note,
      }
      : undefined,
    recommendedLawyers: req.recommendedLawyers,
    status: req.status,
    createdAt: req.createdAt?.toISOString(),
    expiresAt: req.expiresAt?.toISOString(),
    matchedLawyer: req.matchedLawyerProfileId,
    matchedLawyerId: req.matchedLawyerId?.toString(),
    consultationId: req.consultationId?.toString(),
  };
}


async function getCitizenInfo(citizenId: Types.ObjectId) {
  const user = await UserModel.findById(citizenId);
  if (!user) return null;
  const name = `${user.firstName} ${user.lastName}`.trim();
  return {
    id: user._id.toString(),
    name,
    initials: getInitials(name),
    color: getRandomColor(),
    email: user.email,
    phone: user.phone,
  };
}

async function getLawyerInfo(lawyerProfileId: Types.ObjectId, lawyerId: Types.ObjectId) {
  const profile = await LawyerProfileModel.findById(lawyerProfileId)
    .populate('userId', 'firstName lastName fullName email')
    .populate("specialisms", "displayName");
  if (!profile) return null;
  const user = profile.userId as any;
  const name = user?.fullName || `${user?.firstName} ${user?.lastName}` || 'Unknown';
  return {
    id: profile._id.toString(),
    name,
    initials: getInitials(name),
    color: profile.colorA || getRandomColor(),
    specialisms: profile.specialisms || [],
    nbaNumber: profile.nbaNumber || '',
    myPayout: profile.fees,
  };
}

/** Shared shape returned to both citizen and lawyer views */
export async function formatConsultation(consult: any) {
  const citizenInfo = await getCitizenInfo(consult.citizenId._id ?? consult.citizenId);
  const lawyerInfo = await getLawyerInfo(
    consult.lawyerProfileId._id ?? consult.lawyerProfileId,
    consult.lawyerId._id ?? consult.lawyerId,
  );

  return {
    id: consult._id,
    citizen: citizenInfo,
    lawyer: lawyerInfo,
    mode: consult.mode,
    conversationId: consult.conversationId,
    topic: consult.topic,
    detail: consult.detail || '',
    status: consult.status,
    fee: consult.feePaid,
    receiptId: consult.receiptId,
    platformFee: consult.platformFee || Math.round(consult.feePaid * 0.15),
    lawyerPayout: consult.lawyerPayout || Math.round(consult.feePaid * 0.85),
    createdAt: consult.createdAt?.toISOString(),
    scheduledAt: consult.scheduledAt?.toISOString(),
    completedAt: consult.completedAt?.toISOString(),
    rating: consult.citizenRating,
    ratingNote: consult.citizenReview,
    duration: consult.durationMins ? `${consult.durationMins} min` : undefined,
    disputed: consult.disputed || false,
    disputeReason: consult.disputeReason,
    transcript: consult.transcript || [],
    flagged: consult.flagged || false,
    flagReason: consult.flagReason,
    refundRequested: consult.refundRequested || false,
    refundApproved: consult.refundApproved,
    refundReason: consult.refundReason,
    paymentRef: consult.paymentRef,
    lawyerResponseAt: consult.lawyerResponseAt,
  };
}

// ─── CITIZEN SERVICES ─────────────────────────────────────────────────────────

/**
 * GET /consultations/citizen
 * All consultations belonging to the authenticated citizen.
 */
export async function getCitizenConsultations(citizenId: string, params: ListConsultationsParams = {}) {
  const { status, mode, search, page = 1, pageSize = 20, startDate, endDate } = params;

  const filter: Record<string, unknown> = { citizenId: new Types.ObjectId(citizenId) };
  if (status && status !== 'all') filter.status = status;
  if (mode && mode !== 'all') filter.mode = mode;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) (filter.createdAt as any).$gte = new Date(startDate);
    if (endDate) (filter.createdAt as any).$lte = new Date(endDate);
  }
  if (search?.trim()) {
    filter.topic = { $regex: search.trim(), $options: 'i' };
  }

  console.log({ filter })

  const skip = (page - 1) * pageSize;
  const [consultations, total] = await Promise.all([
    ConsultationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('citizenId', 'firstName lastName fullName email')
      .populate('lawyerId', 'firstName lastName fullName email')
      .populate('lawyerProfileId'),
    ConsultationModel.countDocuments(filter),
  ]);

  const data = await Promise.all(consultations.map(formatConsultation));
  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/**
 * GET /consultations/citizen/:id
 * Single consultation for the authenticated citizen (ownership check).
 */
export async function getCitizenConsultationById(consultationId: string, citizenId: string) {
  const consult = await ConsultationModel.findOne({
    _id: consultationId,
    citizenId: new Types.ObjectId(citizenId),
  })
    .populate('citizenId', 'firstName lastName fullName email')
    .populate('lawyerId', 'firstName lastName fullName email')
    .populate('lawyerProfileId');

  if (!consult) throw new AppError('Consultation not found', 404, 'NOT_FOUND');
  return formatConsultation(consult);
}

/**
 * GET /consultations/citizen/stats
 * Aggregate stats for the citizen dashboard.
 */
export async function getCitizenConsultationStats(citizenId: string): Promise<IConsultationStats> {
  const cid = new Types.ObjectId(citizenId);

  const [total, active, disputed, completed, pendingPayment, awaitingLawyer, cancelled, refunded] = await Promise.all([
    ConsultationModel.countDocuments({ citizenId: cid }),
    ConsultationModel.countDocuments({ citizenId: cid, status: { $in: ['active', 'awaiting_lawyer'] } }),
    ConsultationModel.countDocuments({ citizenId: cid, disputed: true }),
    ConsultationModel.countDocuments({ citizenId: cid, status: { $in: ['completed', 'disputed', 'refunded'] } }),
    ConsultationModel.countDocuments({ citizenId: cid, status: 'pending' }),
    ConsultationModel.countDocuments({ citizenId: cid, status: 'awaiting_lawyer' }),
    ConsultationModel.countDocuments({ citizenId: cid, status: 'cancelled' }),
    ConsultationModel.countDocuments({ citizenId: cid, status: 'refunded' }),
  ]);

  const revenueAgg = await ConsultationModel.aggregate([
    { $match: { citizenId: cid, status: { $ne: 'pending' } } },
    { $group: { _id: null, totalRevenue: { $sum: '$feePaid' } } },
  ]);

  return {
    total,
    active,
    disputed,
    completed,
    pendingPayment,
    awaitingLawyer,
    cancelled,
    refunded,
    totalRevenue: revenueAgg[0]?.totalRevenue || 0,
    platformRevenue: 0,
    lawyerPayoutTotal: 0,
  };
}

/**
 * POST /consultations/citizen/:id/dispute
 * Citizen raises a dispute on an active/completed consultation.
 */
export async function raiseDispute(consultationId: string, citizenId: string, reason: string) {
  const consult = await ConsultationModel.findOne({
    _id: consultationId,
    citizenId: new Types.ObjectId(citizenId),
  });
  if (!consult) throw new AppError('Consultation not found', 404, 'NOT_FOUND');

  const allowed: ConsultStatus[] = ['active', 'completed', 'awaiting_lawyer'];
  if (!allowed.includes(consult.status as ConsultStatus)) {
    throw new AppError('Disputes can only be raised on active or completed consultations', 400, 'INVALID_STATUS');
  }
  if (consult.disputed) throw new AppError('A dispute has already been raised on this consultation', 400, 'ALREADY_DISPUTED');

  consult.disputed = true;
  consult.disputeReason = reason;
  consult.disputeRaisedAt = new Date();
  consult.status = 'disputed';
  consult.timeline.push({ time: new Date(), label: 'Dispute raised', note: reason });
  await consult.save();

  return formatConsultation(consult);
}

/**
 * POST /consultations/citizen/:id/refund-request
 * Citizen requests a refund.
 */
export async function requestRefund(consultationId: string, citizenId: string, reason?: string) {
  const consult = await ConsultationModel.findOne({
    _id: consultationId,
    citizenId: new Types.ObjectId(citizenId),
  });
  if (!consult) throw new AppError('Consultation not found', 404, 'NOT_FOUND');
  if (consult.refundRequested) throw new AppError('A refund request already exists', 400, 'ALREADY_REQUESTED');

  consult.refundRequested = true;
  consult.refundReason = reason;
  consult.timeline.push({ time: new Date(), label: 'Refund requested', note: reason || '' });
  await consult.save();

  return formatConsultation(consult);
}

/**
 * POST /consultations/citizen/:id/rating
 * Citizen submits a rating/review after a completed consultation.
 */
export async function submitCitizenRating(
  consultationId: string,
  citizenId: string,
  rating: number,
  comment?: string,
) {
  const consult = await ConsultationModel.findOne({
    _id: consultationId,
    citizenId: new Types.ObjectId(citizenId),
    status: 'completed',
  });
  if (!consult) throw new AppError('Completed consultation not found', 404, 'NOT_FOUND');
  if (consult.citizenRating) throw new AppError('You have already rated this consultation', 400, 'ALREADY_RATED');

  consult.citizenRating = rating;
  consult.citizenReview = comment;
  consult.reviewedAt = new Date();
  consult.timeline.push({ time: new Date(), label: 'Review submitted', note: comment || '' });
  await consult.save();

  // Update lawyer profile aggregate rating
  const profile = await LawyerProfileModel.findById(consult.lawyerProfileId);
  if (profile) {
    const newTotal = profile.ratingAvg * profile.reviewCount + rating;
    const newCount = profile.reviewCount + 1;
    await profile.updateMetrics({ ratingAvg: newTotal / newCount, reviewCount: newCount });
  }

  return formatConsultation(consult);
}

/**
 * POST /consultations/citizen/:id/messages
 * Citizen sends a message inside an active consultation transcript.
 */
export async function sendCitizenMessage(consultationId: string, citizenId: string, text: string) {
  const consult = await ConsultationModel.findOne({
    _id: consultationId,
    citizenId: new Types.ObjectId(citizenId),
  });
  if (!consult) throw new AppError('Consultation not found', 404, 'NOT_FOUND');

  const user = await UserModel.findById(citizenId);
  const senderName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Citizen';

  const message: IMessage = {
    id: new Types.ObjectId().toString(),
    sender: 'citizen',
    senderName,
    senderId: citizenId,
    text,
    time: new Date(),
    read: false,
  };

  consult.transcript.push(message);
  await consult.save();

  return { message, consultationId };
}

// ─── LAWYER SERVICES ──────────────────────────────────────────────────────────

/**
 * GET /consultations/lawyer
 * All consultations belonging to the authenticated lawyer.
 */
export async function getLawyerConsultations(lawyerId: string, params: ListConsultationsParams = {}) {
  const { status, mode, search, page = 1, pageSize = 20, startDate, endDate } = params;

  const filter: Record<string, unknown> = { lawyerId: new Types.ObjectId(lawyerId) };
  if (status && status !== 'all') filter.status = status;
  if (mode && mode !== 'all') filter.mode = mode;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) (filter.createdAt as any).$gte = new Date(startDate);
    if (endDate) (filter.createdAt as any).$lte = new Date(endDate);
  }
  if (search?.trim()) {
    filter.topic = { $regex: search.trim(), $options: 'i' };
  }

  console.log({ filter })
  const skip = (page - 1) * pageSize;
  const [consultations, total] = await Promise.all([
    ConsultationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('citizenId', 'firstName lastName fullName email')
      .populate('lawyerId', 'firstName lastName fullName email')
      .populate('lawyerProfileId'),
    ConsultationModel.countDocuments(filter),
  ]);

  const data = await Promise.all(consultations.map(formatConsultation));
  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/**
 * GET /consultations/lawyer/:id
 * Single consultation for the authenticated lawyer (ownership check).
 */
export async function getLawyerConsultationById(consultationId: string, lawyerId: string) {
  const consult = await ConsultationModel.findOne({
    _id: consultationId,
    lawyerId: new Types.ObjectId(lawyerId),
  })
    .populate('citizenId', 'firstName lastName fullName email')
    .populate('lawyerId', 'firstName lastName fullName email')
    .populate('lawyerProfileId');

  if (!consult) throw new AppError('Consultation not found', 404, 'NOT_FOUND');
  return formatConsultation(consult);
}

/**
 * GET /consultations/lawyer/stats
 */
export async function getLawyerConsultationStats(lawyerId: string) {
  const lid = new Types.ObjectId(lawyerId);

  const [total, active, awaitingLawyer, completed, disputed, cancelled] = await Promise.all([
    ConsultationModel.countDocuments({ lawyerId: lid }),
    ConsultationModel.countDocuments({ lawyerId: lid, status: 'active' }),
    ConsultationModel.countDocuments({ lawyerId: lid, status: 'awaiting_lawyer' }),
    ConsultationModel.countDocuments({ lawyerId: lid, status: 'completed' }),
    ConsultationModel.countDocuments({ lawyerId: lid, disputed: true }),
    ConsultationModel.countDocuments({ lawyerId: lid, status: 'cancelled' }),
  ]);

  const earningsAgg = await ConsultationModel.aggregate([
    { $match: { lawyerId: lid, status: 'completed' } },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: { $multiply: ['$feePaid', 0.85] } },
        ratingSum: { $sum: { $ifNull: ['$citizenRating', 0] } },
        ratingCount: { $sum: { $cond: [{ $ne: ['$citizenRating', null] }, 1, 0] } },
      },
    },
  ]);

  const totalEarnings = earningsAgg[0]?.totalEarnings || 0;
  const ratingCount = earningsAgg[0]?.ratingCount || 0;
  const averageRating = ratingCount > 0 ? earningsAgg[0].ratingSum / ratingCount : 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, active, awaitingLawyer, completed, disputed, cancelled, totalEarnings, averageRating, completionRate };
}

/**
 * POST /consultations/lawyer/:id/accept
 * Lawyer accepts a consultation that is in `awaiting_lawyer` status.
 */
export async function acceptConsultation(consultationId: string, lawyerId: string) {
  const consult = await ConsultationModel.findOne({
    _id: consultationId,
    lawyerId: new Types.ObjectId(lawyerId),
  });
  if (!consult) throw new AppError('Consultation not found', 404, 'NOT_FOUND');
  if (consult.status !== 'awaiting_lawyer' && consult.status !== 'paid') {
    throw new AppError('Consultation is not in a state that can be accepted', 400, 'INVALID_STATUS');
  }

  consult.status = 'active';
  consult.lawyerResponseAt = new Date().toISOString();
  consult.timeline.push({ time: new Date(), label: 'Consultation accepted by lawyer' });
  await consult.save();

  return formatConsultation(consult);
}

/**
 * POST /consultations/lawyer/:id/reject
 * Lawyer rejects/declines a consultation request.
 */
export async function rejectConsultation(consultationId: string, lawyerId: string, reason: string) {
  const consult = await ConsultationModel.findOne({
    _id: consultationId,
    lawyerId: new Types.ObjectId(lawyerId),
  });
  if (!consult) throw new AppError('Consultation not found', 404, 'NOT_FOUND');
  if (!['awaiting_lawyer', 'paid', 'active'].includes(consult.status)) {
    throw new AppError('Consultation cannot be rejected at this stage', 400, 'INVALID_STATUS');
  }

  consult.status = 'cancelled';
  consult.declineReason = reason;
  consult.cancelledBy = 'lawyer';
  consult.timeline.push({ time: new Date(), label: 'Consultation rejected by lawyer', note: reason });
  await consult.save();

  return formatConsultation(consult);
}

/**
 * POST /consultations/lawyer/:id/messages
 * Lawyer sends a message inside the consultation transcript.
 */
export async function sendLawyerMessage(consultationId: string, lawyerId: string, text: string) {
  const consult = await ConsultationModel.findOne({
    _id: consultationId,
    lawyerId: new Types.ObjectId(lawyerId),
  });
  if (!consult) throw new AppError('Consultation not found', 404, 'NOT_FOUND');

  const user = await UserModel.findById(lawyerId);
  const senderName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Lawyer';

  const message: IMessage = {
    id: new Types.ObjectId().toString(),
    sender: 'lawyer',
    senderName,
    // store senderId as string to avoid ObjectId type conflicts
    senderId: new Types.ObjectId(lawyerId),
    text,
    time: new Date(),
    read: false,
  };

  consult.transcript.push(message);
  await consult.save();

  return { message, consultationId };
}

/**
 * POST /consultations/lawyer/:id/complete
 * Lawyer marks the consultation as completed.
 */
export async function completeConsultation(consultationId: string, lawyerId: string) {
  const consult = await ConsultationModel.findOne({
    _id: consultationId,
    lawyerId: new Types.ObjectId(lawyerId),
    status: 'active',
  });
  if (!consult) throw new AppError('Active consultation not found', 404, 'NOT_FOUND');

  consult.status = 'completed';
  consult.completedAt = new Date();
  consult.timeline.push({ time: new Date(), label: 'Consultation marked complete by lawyer' });
  await consult.save();

  // Increment lawyer consultation count
  await LawyerProfileModel.findByIdAndUpdate(consult.lawyerProfileId, {
    $inc: { consultationCount: 1 },
  });

  return formatConsultation(consult);
}

// ─── MATCH REQUEST SERVICES (Lawyer-facing) ───────────────────────────────────

/**
 * GET /consultations/matches
 * Match requests visible to a lawyer — only cases the firm has specifically
 * recommended them for (the old "browse the open pool" behaviour is retired
 * now that the firm reviews and shortlists cases before a lawyer ever sees them).
 */
export async function getMatchRequestsForLawyer(lawyerId: string, params: ListMatchRequestsParams = {}) {
  const { status, search, page = 1, pageSize = 20, urgency } = params;

  const profile = await LawyerProfileModel.findOne({ userId: new Types.ObjectId(lawyerId) });
  if (!profile) throw new AppError('Lawyer profile not found', 404, 'NOT_FOUND');

  const filter: Record<string, unknown> = {
    'recommendedLawyers.lawyerId': new Types.ObjectId(lawyerId),
    status: status && status !== 'all' ? status : { $in: ['recommended', 'matched'] },
  };

  if (urgency) filter.urgency = { $regex: urgency, $options: 'i' };
  if (search?.trim()) {
    filter.$or = [
      { specialism: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * pageSize;
  const [requests, total] = await Promise.all([
    LawyerRequestModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('citizenId', 'firstName lastName fullName email state')
      .populate('specialism'),
    LawyerRequestModel.countDocuments(filter),
  ]);

  const data = requests.map(mapMatchRequestToDTO);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/**
 * POST /consultations/matches/:id/accept
 * A lawyer confirms a case the firm recommended them for. Whoever gets there
 * first — the lawyer confirming, or the citizen picking from their shortlist —
 * finalizes the match and creates the consultation.
 */
export async function acceptMatchRequest(matchRequestId: string, lawyerId: string) {
  const request = await LawyerRequestModel.findById(matchRequestId).populate('citizenId');
  if (!request) throw new AppError('Match request not found', 404, 'NOT_FOUND');

  if (request.status === 'matched') {
    throw new AppError('This match request has already been claimed', 400, 'INVALID_STATUS');
  }
  if (request.status !== 'recommended') {
    throw new AppError('This match request is not yet available to lawyers', 400, 'INVALID_STATUS');
  }

  const wasRecommended = (request.recommendedLawyers || []).some((l: IRecommendedLawyer) => l.lawyerId.toString() === lawyerId);
  if (!wasRecommended) {
    throw new AppError('You were not recommended for this case', 403, 'FORBIDDEN');
  }

  const profile = await LawyerProfileModel.findOne({ userId: new Types.ObjectId(lawyerId) }).populate('userId');
  if (!profile) throw new AppError('Lawyer profile not found', 404, 'NOT_FOUND');

  const user = profile.userId as any;
  const lawyerName = user?.fullName || `${user?.firstName} ${user?.lastName}`.trim();
  const citizen = request.citizenId as any;
  const citizenName = citizen?.fullName || `${citizen?.firstName} ${citizen?.lastName}`.trim() || 'Unknown';

  request.status = 'matched';
  request.matchedLawyerId = new Types.ObjectId(lawyerId);
  request.matchedLawyerProfileId = profile._id;
  request.matchedLawyerName = lawyerName;
  request.matchedAt = new Date();
  request.timeline.push({ time: new Date(), label: `Confirmed by ${lawyerName}` });
  await request.save();

  const book = await bookConsultation(citizen._id.toString(), citizenName, {
    lawyerNbaNumber: profile.nbaNumber,
    mode: request.mode as any,
    topic: request.topic || request.specialism,
    description: [request.description, request.notes].filter(Boolean).join('\n\n'),
    preferredTimeSlot: request.scheduledAt ? request.scheduledAt.toISOString() : undefined,
  });

  request.consultationId = book.consultationId;
  await request.save();

  return { id: request._id, citizen: { name: citizenName }, specialism: request.specialism, status: request.status, matchedLawyer: lawyerName, consultation: book };
}

/**
 * POST /consultations/matches/:id/reject
 * A lawyer declines a case they were recommended for — they're simply removed
 * from the shortlist so the citizen can still pick from the rest.
 */
export async function rejectMatchRequest(matchRequestId: string, lawyerId: string, reason?: string) {
  const request = await LawyerRequestModel.findById(matchRequestId);
  if (!request) throw new AppError('Match request not found', 404, 'NOT_FOUND');

  request.recommendedLawyers = (request.recommendedLawyers || []).filter((l: IRecommendedLawyer) => l.lawyerId.toString() !== lawyerId);
  request.timeline.push({ time: new Date(), label: 'Lawyer declined the recommendation', note: reason || '' });
  await request.save();

  return { success: true };
}

// ─── CITIZEN MATCH REQUEST SERVICES ──────────────────────────────────────────

/**
 * GET /consultations/citizen/match-requests
 */
export async function getMatchRequestsForCitizen(citizenId: string, params: ListMatchRequestsParams = {}) {
  const { status, search, page = 1, pageSize = 20 } = params;
  const filter: Record<string, unknown> = { citizenId: new Types.ObjectId(citizenId) };
  if (status && status !== 'all') filter.status = status;
  if (search?.trim()) filter.$or = [{ specialism: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];

  const skip = (page - 1) * pageSize;
  const [requests, total] = await Promise.all([
    LawyerRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).populate('citizenId', 'firstName lastName fullName email phone state'),
    LawyerRequestModel.countDocuments(filter),
  ]);

  return { data: requests.map(mapMatchRequestToDTO), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/**
 * GET /consultations/citizen/match-requests/:id
 */
export async function getMatchRequestForCitizen(matchRequestId: string, citizenId: string) {
  const request = await LawyerRequestModel.findById(matchRequestId).populate('citizenId', 'firstName lastName fullName email phone state')
  if (!request) throw new AppError('Match request not found', 404, 'NOT_FOUND');
  const citizen = request.citizenId as any;
  if (citizen._id.toString() !== citizenId) throw new AppError('You do not have access to this request', 403, 'FORBIDDEN');
  return mapMatchRequestToDTO(request);
}

/**
 * POST /consultations/citizen/match-requests/:id/documents
 * A citizen attaching supporting documents, either at intake or afterwards.
 */
export async function addCitizenMatchDocument(matchRequestId: string, citizenId: string, input: UploadDocumentInput) {
  const request = await LawyerRequestModel.findById(matchRequestId);
  if (!request) throw new AppError('Match request not found', 404, 'NOT_FOUND');
  if (request.citizenId.toString() !== citizenId) throw new AppError('You do not have access to this request', 403, 'FORBIDDEN');

  const doc = await uploadMatchDocument(citizenId, input, 'citizen');
  request.documents.push(doc);
  request.timeline.push({ time: new Date(), label: 'Document attached by citizen', note: doc.name });
  await request.save();

  return mapMatchRequestToDTO(request);
}



/**
 * POST /consultations/citizen/match-requests/:id/select-lawyer
 * The citizen picks a lawyer from their recommended shortlist. This finalizes
 * the match and creates the paid consultation (mirroring the direct-booking flow).
 */
export async function citizenSelectRecommendedLawyer(matchRequestId: string, citizenId: string, citizenName: string, lawyerProfileId: string) {
  
  const request = await LawyerRequestModel.findById(matchRequestId);
  if (!request) throw new AppError('Match request not found', 404, 'NOT_FOUND');
  if (request.citizenId.toString() !== citizenId) throw new AppError('You do not have access to this request', 403, 'FORBIDDEN');
  if (request.status === 'matched') throw new AppError('This request has already been matched', 400, 'INVALID_STATUS');
  if (request.status !== 'recommended') throw new AppError('No recommendations are available to choose from yet', 400, 'INVALID_STATUS');

  console.log(request, request.recommendedLawyers, lawyerProfileId)

  const suggestions = await getAutoSuggestedLawyers(matchRequestId);
  const chosen = suggestions.find((l: any) => l?.id === lawyerProfileId);
  if (!chosen) throw new AppError('That lawyer is not part of your recommended shortlist', 400, 'INVALID_SELECTION');

  const profile = await LawyerProfileModel.findById(lawyerProfileId);
  if (!profile) throw new AppError('Lawyer not found', 404, 'NOT_FOUND');

  request.status = 'matched';
  request.matchedLawyerId = chosen.lawyerId as any;
  request.matchedLawyerProfileId = profile._id;
  request.matchedLawyerName = chosen.name;
  request.matchedAt = new Date();
  request.timeline.push({ time: new Date(), label: `Citizen selected ${chosen.name}` });
  await request.save();

  const book = await bookConsultation(citizenId, citizenName, {
    lawyerNbaNumber: profile.nbaNumber,
    mode: request.mode as any,
    topic: request.topic || request.specialism,
    description: [request.description, request.notes].filter(Boolean).join('\n\n'),
    preferredTimeSlot: request.scheduledAt ? request.scheduledAt.toISOString() : undefined,
  });

  request.consultationId = book.consultationId;
  await request.save();

  return { book, ...mapMatchRequestToDTO(request) };
}

// ─── UTILITY SERVICES ─────────────────────────────────────────────────────────

/**
 * GET /consultations/statuses/:role
 * Returns filterable status options with live counts.
 */
export async function getAvailableStatuses(role: 'citizen' | 'lawyer' | 'admin', userId?: string) {
  const statuses: ConsultStatus[] = ['pending', 'paid', 'processing', 'awaiting_lawyer', 'active', 'completed', 'disputed', 'cancelled', 'refunded'];

  const filter: Record<string, unknown> = {};
  if (role === 'citizen' && userId) filter.citizenId = new Types.ObjectId(userId);
  if (role === 'lawyer' && userId) filter.lawyerId = new Types.ObjectId(userId);

  const counts = await ConsultationModel.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(counts.map(c => [c._id, c.count]));

  const labelMap: Record<string, string> = {
    pending: 'Pending Payment',
    paid: 'Paid',
    processing: 'Processing',
    awaiting_lawyer: 'Awaiting Lawyer',
    active: 'Active',
    completed: 'Completed',
    disputed: 'Disputed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };

  return statuses.map(s => ({ value: s, label: labelMap[s] || s, count: countMap.get(s) || 0 }));
}

// ─── ADMIN SERVICES ───────────────────────────────────────────────────────────

/**
 * Admin: List consultations (all) with full filters.
 */
export async function listConsultations(params: ListConsultationsParams = {}) {
  const { status, mode, search, page = 1, pageSize = 20, startDate, endDate, citizenId, lawyerId, disputed, flagged } = params;

  const filter: Record<string, unknown> = {};
  if (status && status !== 'all') filter.status = status;
  if (mode && mode !== 'all') filter.mode = mode;
  if (citizenId) filter.citizenId = new Types.ObjectId(citizenId);
  if (lawyerId) filter.lawyerId = new Types.ObjectId(lawyerId);
  if (disputed !== undefined) filter.disputed = disputed;
  if (flagged !== undefined) filter.flagged = flagged;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) (filter.createdAt as any).$gte = new Date(startDate);
    if (endDate) (filter.createdAt as any).$lte = new Date(endDate);
  }

  if (search?.trim()) {
    const citizenUsers = await UserModel.find({ $text: { $search: search.trim() }, role: 'citizen' }, { _id: 1 });
    const citizenIds = citizenUsers.map(u => u._id as Types.ObjectId);
    const lawyerProfiles = await LawyerProfileModel.find({ $text: { $search: search.trim() } }, { userId: 1 });
    const lawyerIds = lawyerProfiles.map(p => p.userId as Types.ObjectId);

    const orConditions: any[] = [{ topic: { $regex: search, $options: 'i' } }];
    if (citizenIds.length) orConditions.push({ citizenId: { $in: citizenIds } });
    if (lawyerIds.length) orConditions.push({ lawyerId: { $in: lawyerIds } });
    filter.$or = orConditions;
  }

  const skip = (page - 1) * pageSize;
  const [consultations, total] = await Promise.all([
    ConsultationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('citizenId', 'firstName lastName fullName email state')
      .populate('lawyerId', 'firstName lastName fullName email')
      .populate('lawyerProfileId'),
    ConsultationModel.countDocuments(filter),
  ]);

  const data = await Promise.all(consultations.map(formatConsultation));
  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/**
 * Admin: Get single consultation by ID (no ownership check).
 */
export async function getConsultationById(consultationId: string) {
  const consult = await ConsultationModel.findById(consultationId)
    .populate('citizenId', '_id firstName lastName fullName email state phone')
    .populate('lawyerId', 'firstName lastName fullName email')
    .populate('lawyerProfileId');

  if (!consult) throw new AppError('Consultation not found', 404, 'NOT_FOUND');
  return formatConsultation(consult);
}

/**
 * Admin: Aggregate consultation statistics.
 */
export async function getConsultationStats(): Promise<IConsultationStats> {
  const [total, active, disputed, completed, pendingPayment, awaitingLawyer, cancelled, refunded] = await Promise.all([
    ConsultationModel.countDocuments(),
    ConsultationModel.countDocuments({ status: { $in: ['active', 'awaiting_lawyer'] } }),
    ConsultationModel.countDocuments({ disputed: true }),
    ConsultationModel.countDocuments({ status: 'completed' }),
    ConsultationModel.countDocuments({ status: 'pending' }),
    ConsultationModel.countDocuments({ status: 'awaiting_lawyer' }),
    ConsultationModel.countDocuments({ status: 'cancelled' }),
    ConsultationModel.countDocuments({ status: 'refunded' }),
  ]);

  const revenueAgg = await ConsultationModel.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, totalRevenue: { $sum: '$feePaid' }, platformRevenue: { $sum: { $multiply: ['$feePaid', 0.15] } }, lawyerPayout: { $sum: { $multiply: ['$feePaid', 0.85] } } } },
  ]);

  return {
    total, active, disputed, completed, pendingPayment, awaitingLawyer, cancelled, refunded,
    totalRevenue: revenueAgg[0]?.totalRevenue || 0,
    platformRevenue: revenueAgg[0]?.platformRevenue || 0,
    lawyerPayoutTotal: revenueAgg[0]?.lawyerPayout || 0,
  };
}

/**
 * Admin: List all disputed consultations.
 */
export async function listDisputes(params: { status?: 'pending' | 'resolved'; page?: number; pageSize?: number } = {}) {
  const { status, page = 1, pageSize = 20 } = params;
  const filter: Record<string, unknown> = { disputed: true };
  if (status === 'pending') filter.disputeResolvedAt = { $exists: false };
  if (status === 'resolved') filter.disputeResolvedAt = { $exists: true };

  const skip = (page - 1) * pageSize;
  const [consultations, total] = await Promise.all([
    ConsultationModel.find(filter)
      .sort({ disputeRaisedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('citizenId', 'firstName lastName fullName email')
      .populate('lawyerId', 'firstName lastName fullName email')
      .populate('lawyerProfileId'),
    ConsultationModel.countDocuments(filter),
  ]);

  const data = await Promise.all(consultations.map(formatConsultation));
  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/**
 * Admin: List all refund requests.
 */
export async function listRefundRequests(params: { status?: 'pending' | 'approved' | 'rejected'; page?: number; pageSize?: number } = {}) {
  const { status, page = 1, pageSize = 20 } = params;
  const filter: Record<string, unknown> = { refundRequested: true };
  if (status === 'pending') filter.refundApproved = { $exists: false };
  if (status === 'approved') filter.refundApproved = true;
  if (status === 'rejected') filter.refundApproved = false;

  const skip = (page - 1) * pageSize;
  const [consultations, total] = await Promise.all([
    ConsultationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('citizenId', 'firstName lastName fullName email')
      .populate('lawyerId', 'firstName lastName fullName email')
      .populate('lawyerProfileId'),
    ConsultationModel.countDocuments(filter),
  ]);

  const data = await Promise.all(consultations.map(formatConsultation));
  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/**
 * Admin: List all flagged consultations.
 */
export async function listFlaggedConsultations(params: { severity?: 'low' | 'medium' | 'high'; resolved?: boolean; page?: number; pageSize?: number } = {}) {
  const { severity, resolved, page = 1, pageSize = 20 } = params;
  const filter: Record<string, unknown> = { flagged: true };
  if (severity) filter.flagSeverity = severity;
  if (resolved !== undefined) filter.flagResolved = resolved;

  const skip = (page - 1) * pageSize;
  const [consultations, total] = await Promise.all([
    ConsultationModel.find(filter)
      .sort({ flaggedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('citizenId', 'firstName lastName fullName email')
      .populate('lawyerId', 'firstName lastName fullName email')
      .populate('lawyerProfileId'),
    ConsultationModel.countDocuments(filter),
  ]);

  const data = await Promise.all(consultations.map(formatConsultation));
  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/**
 * Admin: Update consultation status.
 */
export async function updateConsultationStatus(consultationId: string, payload: UpdateConsultationStatusPayload, admin: AdminCtx) {
  const consultation = await ConsultationModel.findById(consultationId);
  if (!consultation) throw new AppError('Consultation not found', 404, 'NOT_FOUND');

  const oldStatus = consultation.status;
  consultation.status = payload.status;
  if (payload.status === 'completed') consultation.completedAt = new Date();

  consultation.timeline.push({ time: new Date(), label: `Status changed to ${payload.status}`, note: payload.note || `Changed by admin: ${admin.adminName}` });
  await consultation.save();

  AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: AuditAction.CONSULTATION_STATUS_CHANGED, targetType: 'consultation', targetId: consultation._id, meta: { from: oldStatus, to: payload.status, note: payload.note } }).catch(() => null);

  return getConsultationById(consultationId);
}

/**
 * Admin: Resolve a dispute.
 */
export async function resolveDispute(consultationId: string, payload: ResolveDisputePayload, admin: AdminCtx) {
  const consultation = await ConsultationModel.findById(consultationId);
  if (!consultation) throw new AppError('Consultation not found', 404, 'NOT_FOUND');
  if (!consultation.disputed) throw new AppError('This consultation is not disputed', 400, 'NOT_DISPUTED');

  consultation.disputed = false;
  consultation.disputeResolvedAt = new Date();
  consultation.disputeResolution = payload.reason;

  if (payload.decision === 'citizen' && payload.refundAmount) {
    consultation.status = 'refunded';
    consultation.refundApproved = true;
    consultation.refundedAt = new Date();
  }

  consultation.timeline.push({ time: new Date(), label: `Dispute resolved in favor of ${payload.decision}`, note: payload.reason });
  await consultation.save();

  AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: AuditAction.DISPUTE_RESOLVED, targetType: 'consultation', targetId: consultation._id, meta: { decision: payload.decision, reason: payload.reason } }).catch(() => null);

  return getConsultationById(consultationId);
}

/**
 * Admin: Flag consultation for review.
 */
export async function flagConsultation(consultationId: string, payload: FlagConsultationPayload, admin: AdminCtx) {
  const consultation = await ConsultationModel.findById(consultationId);
  if (!consultation) throw new AppError('Consultation not found', 404, 'NOT_FOUND');

  consultation.flagged = true;
  consultation.flagReason = payload.reason;
  consultation.flaggedAt = new Date();
  consultation.flaggedBy = new Types.ObjectId(admin.adminId);
  (consultation as any).flagSeverity = payload.severity;

  consultation.timeline.push({ time: new Date(), label: 'Flagged for quality review', note: payload.reason });
  await consultation.save();

  AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: AuditAction.CONSULTATION_FLAGGED, targetType: 'consultation', targetId: consultation._id, meta: { reason: payload.reason, severity: payload.severity } }).catch(() => null);

  return getConsultationById(consultationId);
}

/**
 * Admin: Approve or reject a refund request.
 */
export async function approveRefund(consultationId: string, payload: ApproveRefundPayload, admin: AdminCtx) {
  const consultation = await ConsultationModel.findById(consultationId);
  if (!consultation) throw new AppError('Consultation not found', 404, 'NOT_FOUND');
  if (!consultation.refundRequested) throw new AppError('No refund requested for this consultation', 400, 'NO_REFUND_REQUESTED');

  consultation.refundApproved = payload.approved;
  if (payload.approved) {
    consultation.status = 'refunded';
    consultation.refundedAt = new Date();
  }

  consultation.timeline.push({ time: new Date(), label: payload.approved ? 'Refund approved' : 'Refund rejected', note: payload.adminNote });
  await consultation.save();

  AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: payload.approved ? AuditAction.REFUND_APPROVED : AuditAction.REFUND_REJECTED, targetType: 'consultation', targetId: consultation._id, meta: { approved: payload.approved, note: payload.adminNote } }).catch(() => null);

  return getConsultationById(consultationId);
}

/**
 * Admin: Send warning to lawyer.
 */
export async function sendLawyerWarning(consultationId: string, lawyerId: string, reason: string, admin: AdminCtx) {
  const consultation = await ConsultationModel.findById(consultationId);
  if (!consultation) throw new AppError('Consultation not found', 404, 'NOT_FOUND');

  AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: AuditAction.LAWYER_WARNING_SENT, targetType: 'lawyer', targetId: lawyerId, meta: { consultationId, reason } }).catch(() => null);
  console.log(`[WARNING] Lawyer ${lawyerId} warned for consultation ${consultationId}: ${reason}`);

  return { message: 'Warning sent successfully' };
}

/**
 * Admin: Bulk action on consultations.
 */
export async function bulkAction(consultationIds: string[], action: 'flag' | 'refund' | 'cancel', reason: string, admin: AdminCtx) {
  const results: string[] = [];

  for (const id of consultationIds) {
    try {
      const consultation = await ConsultationModel.findById(id);
      if (!consultation) continue;

      switch (action) {
        case 'flag':
          consultation.flagged = true;
          consultation.flagReason = reason;
          consultation.flaggedAt = new Date();
          consultation.flaggedBy = new Types.ObjectId(admin.adminId);
          break;
        case 'refund':
          consultation.refundRequested = true;
          consultation.refundReason = reason;
          break;
        case 'cancel':
          consultation.status = 'cancelled';
          consultation.cancelReason = reason;
          consultation.cancelledBy = 'system';
          break;
      }

      consultation.timeline.push({ time: new Date(), label: `Bulk action: ${action}`, note: reason });
      await consultation.save();
      results.push(id);
    } catch (err) {
      console.error(`Failed to process consultation ${id}:`, err);
    }
  }

  AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: AuditAction.BULK_ACTION, targetType: 'consultation', targetId: null, meta: { action, reason, count: results.length, ids: consultationIds } }).catch(() => null);

  return { success: true, message: `${results.length} consultations processed`, affectedCount: results.length, consultationIds: results };
}

/**
 * Admin: Export consultations.
 */
export async function exportConsultations(params: ListConsultationsParams) {
  const { data } = await listConsultations({ ...params, pageSize: 10000 });
  const headers = ['ID', 'Citizen', 'Lawyer', 'Topic', 'Mode', 'Status', 'Fee', 'Created At', 'Completed At', 'Rating', 'Disputed', 'Flagged'];
  const rows = data.map((c: any) => [c.id, c.citizen?.name, c.lawyer?.name, c.topic, c.mode, c.status, c.fee, c.createdAt, c.completedAt || '', c.rating || '', c.disputed ? 'Yes' : 'No', c.flagged ? 'Yes' : 'No']);
  return { headers, rows };
}

// ─── ADMIN MATCH REQUEST SERVICES ────────────────────────────────────────────

/**
 * GET /admin/consultations/match-requests
 */
export async function listMatchRequests(params: ListMatchRequestsParams = {}) {
  const { status, search, page = 1, pageSize = 20, urgency } = params;
  const filter: Record<string, unknown> = {};
  if (status && status !== 'all') filter.status = status;
  if (urgency) filter.urgency = { $regex: urgency, $options: 'i' };
  if (search?.trim()) filter.$or = [{ specialism: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];

  const skip = (page - 1) * pageSize;
  const [requests, total] = await Promise.all([
    LawyerRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).populate('citizenId', 'firstName lastName fullName email phone state').populate('specialism'),
    LawyerRequestModel.countDocuments(filter),
  ]);

  return { data: requests.map(mapMatchRequestToDTO), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/**
 * GET /admin/consultations/match-requests/:id
 */
export async function getMatchRequestById(matchRequestId: string) {
  const request = await LawyerRequestModel.findById(matchRequestId).populate('citizenId', 'firstName lastName fullName email phone state').populate('specialism');
  if (!request) throw new AppError('Match request not found', 404, 'NOT_FOUND');
  return mapMatchRequestToDTO(request);
}

/**
 * POST /admin/consultations/match-requests/:id/accept
 * Admin picks up a request and begins reviewing it. This is the entry point into
 * the firm-assisted flow: pending/unassigned -> in_review.
 */
export async function adminAcceptMatchRequest(matchRequestId: string, admin: AdminCtx) {
  const request = await LawyerRequestModel.findById(matchRequestId);
  if (!request) throw new AppError('Match request not found', 404, 'NOT_FOUND');
  if (!['pending', 'unassigned'].includes(request.status)) {
    throw new AppError('This request has already been picked up', 400, 'INVALID_STATUS');
  }

  request.status = 'in_review';
  request.handledByAdminId = new Types.ObjectId(admin.adminId);
  request.handledByAdminName = admin.adminName;
  request.timeline.push({ time: new Date(), label: 'Accepted for review', note: `By ${admin.adminName}` });
  await request.save();

  AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: AuditAction.MATCH_ACCEPTED, targetType: 'match_request', targetId: request._id }).catch(() => null);

  return getMatchRequestById(matchRequestId);
}

/* POST /admin/consultations/match-requests/:id/message */
export async function updateCitizenMatchStatus(matchRequestId: string, newStatus: MatchStatus, admin: AdminCtx) {
  const request = await LawyerRequestModel.findById(matchRequestId);
  if (!request) throw new AppError('Match request not found', 404, 'NOT_FOUND');

  request.status = newStatus;
  request.handledByAdminId = new Types.ObjectId(admin.adminId);
  request.handledByAdminName = admin.adminName;
  request.timeline.push({ time: new Date(), label: `Status updated to ${newStatus}`, note: `By ${admin.adminName}` });

  await request.save();
  AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: AuditAction.MATCH_UPDATED, targetType: 'match_request', targetId: request._id }).catch(() => null);


  await autoSuggestAndRecommend(matchRequestId, admin, 30);

  return mapMatchRequestToDTO(request);
}

/**
 * POST /admin/consultations/match-requests/:id/message
 * Admin conducts the initial (message-mode) consultation themselves, before
 * recommending lawyers.
 */
export async function sendAdminMatchMessage(matchRequestId: string, admin: AdminCtx, message: string) {
  const request = await LawyerRequestModel.findById(matchRequestId);
  if (!request) throw new AppError('Match request not found', 404, 'NOT_FOUND');
  if (request.status === 'matched') throw new AppError('This request has already been matched', 400, 'INVALID_STATUS');

  request.adminMessage = message;
  request.adminMessageAt = new Date();
  if (['pending', 'unassigned'].includes(request.status)) {
    request.status = 'in_review';
    request.handledByAdminId = new Types.ObjectId(admin.adminId);
    request.handledByAdminName = admin.adminName;
  }
  request.timeline.push({ time: new Date(), label: 'Consultation message sent', note: `By ${admin.adminName}` });
  await request.save();

  AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: AuditAction.MATCH_MESSAGE_SENT, targetType: 'match_request', targetId: request._id }).catch(() => null);

  return getMatchRequestById(matchRequestId);
}

/**
 * POST /admin/consultations/match-requests/:id/schedule-call
 * Admin organizes a call/video consultation on the firm's behalf.
 */
export async function scheduleAdminMatchCall(
  matchRequestId: string,
  admin: AdminCtx,
  payload: { dateTime: string; link?: string; note?: string }
) {
  const request = await LawyerRequestModel.findById(matchRequestId);
  if (!request) throw new AppError('Match request not found', 404, 'NOT_FOUND');
  if (request.status === 'matched') throw new AppError('This request has already been matched', 400, 'INVALID_STATUS');

  request.scheduledCall = { dateTime: new Date(payload.dateTime), link: payload.link, note: payload.note };
  if (['pending', 'unassigned'].includes(request.status)) {
    request.status = 'in_review';
    request.handledByAdminId = new Types.ObjectId(admin.adminId);
    request.handledByAdminName = admin.adminName;
  }
  request.timeline.push({ time: new Date(), label: 'Call scheduled', note: `By ${admin.adminName} for ${new Date(payload.dateTime).toLocaleString()}` });
  await request.save();

  AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: AuditAction.MATCH_CALL_SCHEDULED, targetType: 'match_request', targetId: request._id }).catch(() => null);

  return getMatchRequestById(matchRequestId);
}

/**
 * POST /admin/consultations/match-requests/:id/documents
 * Admin attaches a document — a supporting file, or (with isCaseBrief) the firm's
 * refined case brief, stored on its own field as a single link.
 */

export async function adminAddMatchDocument(
  matchRequestId: string,
  admin: AdminCtx,
  input: UploadDocumentInput & { isCaseBrief?: boolean }
): Promise<ReturnType<typeof mapMatchRequestToDTO>> {
  const request = await LawyerRequestModel.findById(matchRequestId);
  if (!request) throw new AppError('Match request not found', 404, 'NOT_FOUND');

  const doc = await uploadMatchDocument(request.citizenId.toString(), input, 'firm');

  if (input.isCaseBrief) {
    if (request.caseBrief?.publicId) {
      CloudinaryService.deleteFile(request.caseBrief.fileUrl, 'raw').catch(() => null);
    }
    request.caseBrief = doc;
  } else {
    request.documents.push(doc);
  }

  if (['pending', 'unassigned'].includes(request.status)) {
    request.status = 'in_review';
    request.handledByAdminId = new Types.ObjectId(admin.adminId);
    request.handledByAdminName = admin.adminName;
  }
  request.timeline.push({
    time: new Date(),
    label: input.isCaseBrief ? 'Refined case brief attached' : 'Document attached',
    note: `By ${admin.adminName}: ${doc.name}`,
  });
  await request.save();

  AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: AuditAction.MATCH_DOCUMENT_ADDED, targetType: 'match_request', targetId: request._id, meta: { isCaseBrief: !!input.isCaseBrief } }).catch(() => null);

  return getMatchRequestById(matchRequestId);
}

/**
 * GET /admin/consultations/match-requests/:id/suggestions
 * "Auto-suggest" — ranks verified, available lawyers who fit the case, WITHOUT
 * assigning anyone. The admin reviews this list (or picks manually) and then
 * calls recommendLawyersForMatch to actually send a shortlist to the citizen.
 * This replaces the old "auto-match" behaviour, which used to book a
 * consultation with the top match automatically — the citizen no longer gets
 * skipped over.
 */

export async function getAutoSuggestedLawyers(matchRequestId: string, limit = 5) {
  const request = await LawyerRequestModel.findById(matchRequestId);
  if (!request) throw new AppError('Match request not found', 404, 'NOT_FOUND');

  const recommendedLawyerIds = (request.recommendedLawyers ?? [])
  .map((id:string) => new Types.ObjectId(id));

const candidates = await LawyerProfileModel.find({
  verificationStatus: VerificationStatus.VERIFIED,
  isAvailable: true,
  specialisms: { $in: [request.specialism] },
})
  .sort({ ratingAvg: -1 })
  .limit(limit * 3)
  .populate('userId', 'firstName lastName fullName'); 

const recommendedCandidates = await LawyerProfileModel.find({ _id: { $in: recommendedLawyerIds }})
  .sort({ ratingAvg: -1 })
  .limit(limit * 3)
  .populate('userId', 'firstName lastName fullName'); 

  const fitting = candidates
  .filter(l => isWithinBudget(request.budget, l.fees?.[request.mode as keyof typeof l.fees] as number))
  .slice(0, limit);
  
  const finalCandidates = [...recommendedCandidates, ...fitting.filter(c => !recommendedCandidates.some(rc => rc._id.equals(c._id)))];
  
  console.log({ recommendedCandidates, recommendedLawyerIds })
  
  return finalCandidates.map(profile => {
    const ref = toRecommendedLawyerRef(profile);
    console.log(ref)
    return {
      ...ref,
      id: ref.lawyerProfileId.toString(),
      lawyerId: ref.lawyerId.toString(),
      ratingAvg: profile.ratingAvg,
      responseTimeLabel: profile.responseTimeLabel,
      fee: profile.fees?.[request.mode as keyof typeof profile.fees],
    };
  });
}

/**
 * POST /admin/consultations/match-requests/:id/recommend
 * Admin sends a shortlist of lawyers to the citizen — whether hand-picked or
 * taken from the auto-suggested list. The citizen then picks who to work with.
 */
export async function recommendLawyersForMatch(matchRequestId: string, admin: AdminCtx, lawyerProfileIds: string[]) {
  if (!lawyerProfileIds?.length) throw new AppError('Select at least one lawyer to recommend', 400, 'VALIDATION_ERROR');

  const request = await LawyerRequestModel.findById(matchRequestId);
  if (!request) throw new AppError('Match request not found', 404, 'NOT_FOUND');
  if (request.status === 'matched') throw new AppError('This request has already been matched', 400, 'INVALID_STATUS');

  console.log({lawyerProfileIds})
 
  request.recommendedLawyers = lawyerProfileIds
  request.status = 'recommended';
  if (!request.handledByAdminId) {
    request.handledByAdminId = new Types.ObjectId(admin.adminId);
    request.handledByAdminName = admin.adminName;
  }
  request.timeline.push({ time: new Date(), label: `Recommended ${lawyerProfileIds.length} lawyer(s) to citizen`, note: `By ${admin.adminName}` });
  await request.save();

  AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: AuditAction.MATCH_RECOMMENDED, targetType: 'match_request', targetId: request._id, meta: { lawyerProfileIds } }).catch(() => null);

  return getMatchRequestById(matchRequestId);
}

/**
 * POST /admin/consultations/match-requests/:id/assign
 * Admin directly assigns one specific lawyer, skipping the citizen's choice —
 * an override for edge cases (e.g. handling things over the phone).
 */
export async function assignLawyerToMatch(matchRequestId: string, lawyerId: string, admin: AdminCtx) {
  const request = await LawyerRequestModel.findById(matchRequestId).populate('citizenId');
  if (!request) throw new AppError('Match request not found', 404, 'NOT_FOUND');
  if (request.status === 'matched') throw new AppError('This request has already been matched', 400, 'INVALID_STATUS');

  const profile = await LawyerProfileModel.findById(lawyerId).populate('userId', 'firstName lastName fullName');
  if (!profile) throw new AppError('Lawyer not found', 404, 'NOT_FOUND');

  const user = profile.userId as any;
  const lawyerName = user?.fullName || `${user?.firstName} ${user?.lastName}`;
  const citizen = request.citizenId as any;
  const citizenName = citizen?.fullName || `${citizen?.firstName} ${citizen?.lastName}` || 'Unknown';

  request.status = 'matched';
  request.matchedLawyerId = profile.userId;
  request.matchedLawyerProfileId = profile._id;
  request.matchedLawyerName = lawyerName;
  request.matchedAt = new Date();
  request.timeline.push({ time: new Date(), label: `Matched with ${lawyerName}`, note: `Assigned by admin: ${admin.adminName}` });
  await request.save();

  AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: AuditAction.MATCH_ASSIGNED, targetType: 'match_request', targetId: request._id, meta: { lawyerId, lawyerName } }).catch(() => null);

  const book = await bookConsultation(citizen._id.toString(), citizenName, {
    lawyerNbaNumber: profile.nbaNumber,
    mode: request.mode as any,
    topic: request.topic || request.specialism,
    description: [request.description, request.notes].filter(Boolean).join('\n\n'),
    preferredTimeSlot: request.scheduledAt ? request.scheduledAt.toISOString() : undefined,
  });

  request.consultationId = book.consultationId;
  await request.save();

  return { book, ...(await getMatchRequestById(matchRequestId)) };
}

/**
 * POST /admin/consultations/match-requests/bulk-auto-match (kept for backward compatibility;
 * now performs a bulk AUTO-SUGGEST + recommend instead of an immediate auto-booking).
 * For every unreviewed request, computes the best-fit lawyers and sends that
 * shortlist straight to the citizen — nobody gets booked without the citizen choosing.
 */
export async function bulkAutoSuggestAndRecommend(admin: AdminCtx, limitPerRequest = 3) {
  const pending = await LawyerRequestModel.find({ status: { $in: ['pending', 'unassigned'] }, expiresAt: { $gt: new Date() } });
  const results = { recommended: 0, failed: [] as string[] };

  for (const req of pending) {
    try {
      const suggestions = await getAutoSuggestedLawyers(req._id.toString(), limitPerRequest);
      if (!suggestions.length) throw new Error('No matching lawyers found');
      await recommendLawyersForMatch(req._id.toString(), admin, suggestions.map(s => s.id));
      results.recommended++;
    } catch {
      results.failed.push(req._id.toString());
    }
  }

  return { success: true, recommendedCount: results.recommended, failedIds: results.failed };
}

/**
 * POST /admin/consultations/match-requests/:id/auto-suggest
 * Quick action for a single request: computes best-fit lawyers and immediately
 * sends that shortlist to the citizen (combines getAutoSuggestedLawyers +
 * recommendLawyersForMatch). This is the direct replacement for the old
 * "auto-match" quick action — the citizen still picks who to work with.
 */
export async function autoSuggestAndRecommend(matchRequestId: string, admin: AdminCtx, limit = 3) {
  const suggestions = await getAutoSuggestedLawyers(matchRequestId, limit);
  if (!suggestions.length) {
    throw new AppError("We couldn't find any lawyers that fit this case right now.", 404, 'NO_LAWYER_AVAILABLE');
  }
  return recommendLawyersForMatch(matchRequestId, admin, suggestions.map(s => s.id));
}

export async function expireMatchRequest(matchRequestId: string, admin: AdminCtx) {
  const request = await LawyerRequestModel.findById(matchRequestId);
  if (!request) throw new AppError('Match request not found', 404, 'NOT_FOUND');

  request.status = 'expired';
  request.timeline.push({ time: new Date(), label: 'Request expired', note: `Expired by admin: ${admin.adminName}` });
  await request.save();

  AuditLogModel.create({ adminId: admin.adminId, adminName: admin.adminName, action: AuditAction.MATCH_EXPIRED, targetType: 'match_request', targetId: request._id }).catch(() => null);

  return getMatchRequestById(matchRequestId);
}


export async function consultationPayment(consultationId: string): Promise<any> {

  const consultation = await getConsultationById(consultationId) || {}

  const paymentGateway = new PaymentGateway();
  const paymentReference = paymentGateway.generatePaymentReference(receiptId);

  if (!consultation) throw new AppError('Consultation not found', 404, 'NOT_FOUND');

  const paymentData = {
    email: consultation.citizen?.email || "",
    amount: consultation.lawyer?.myPayout[consultation.mode] || 0,
    reference: paymentReference,
    coreId: consultationId.toString(),
    userId: consultation.id,
    description: 'Order Payment',
    phone: consultation.citizen?.phone || '',
    metadata: {
      type: 'purchase',
      coreId: consultationId.toString(),
      orderSlug: receiptId,
      redirect: "consultations",
    }
  }

  const paymentResult = await paymentGateway.initializePayment("paystack", paymentData);
  return paymentResult
}

// ─── LAWYER PERFORMANCE & DASHBOARD ──────────────────────────────────────────

export async function getLawyerPerformance(params: { startDate?: string; endDate?: string } = {}) {
  const matchFilter: Record<string, unknown> = {};
  if (params.startDate) matchFilter.createdAt = { $gte: new Date(params.startDate) };
  if (params.endDate) matchFilter.createdAt = { ...(matchFilter.createdAt || {}), $lte: new Date(params.endDate) };

  return ConsultationModel.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$lawyerProfileId',
        totalSessions: { $sum: 1 },
        completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        disputedSessions: { $sum: { $cond: ['$disputed', 1, 0] } },
        totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, { $multiply: ['$feePaid', 0.85] }, 0] } },
        ratingSum: { $sum: { $ifNull: ['$citizenRating', 0] } },
        ratingCount: { $sum: { $cond: [{ $ne: ['$citizenRating', null] }, 1, 0] } },
      },
    },
    { $lookup: { from: 'lawyerprofiles', localField: '_id', foreignField: '_id', as: 'profile' } },
    { $unwind: '$profile' },
    { $lookup: { from: 'users', localField: 'profile.userId', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    {
      $project: {
        lawyerId: '$_id',
        lawyerName: { $ifNull: ['$user.fullName', { $concat: ['$user.firstName', ' ', '$user.lastName'] }] },
        lawyerInitials: { $substrCP: [{ $concat: [{ $substrCP: ['$user.firstName', 0, 1] }, { $substrCP: ['$user.lastName', 0, 1] }] }, 0, 2] },
        lawyerColor: { $ifNull: ['$profile.colorA', '#3B82F6'] },
        nbaNumber: '$profile.nbaNumber',
        totalSessions: 1,
        completedSessions: 1,
        disputedSessions: 1,
        totalRevenue: 1,
        averageRating: { $cond: [{ $eq: ['$ratingCount', 0] }, 0, { $divide: ['$ratingSum', '$ratingCount'] }] },
      },
    },
    { $addFields: { completionRate: { $cond: [{ $eq: ['$totalSessions', 0] }, 0, { $multiply: [{ $divide: ['$completedSessions', '$totalSessions'] }, 100] }] } } },
    { $sort: { totalSessions: -1 } },
  ]);
}

export async function getTopLawyers(limit: number = 10, sortBy: 'revenue' | 'rating' | 'sessions' = 'sessions') {
  const all = await getLawyerPerformance();
  const sorted = [...all].sort((a, b) =>
    sortBy === 'revenue' ? b.totalRevenue - a.totalRevenue :
      sortBy === 'rating' ? b.averageRating - a.averageRating :
        b.totalSessions - a.totalSessions
  );
  return sorted.slice(0, limit);
}

export async function getDashboardStats() {
  const [consultationStats, matchAgg, recentActivity] = await Promise.all([
    getConsultationStats(),
    LawyerRequestModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ConsultationModel.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('citizenId', 'firstName lastName fullName')
      .populate('lawyerId', 'firstName lastName fullName'),
  ]);

  const matchStats = { total: 0, unassigned: 0, matching: 0, matched: 0, expired: 0 };
  for (const item of matchAgg) {
    matchStats.total += item.count;
    const key = item._id as keyof typeof matchStats;
    if (key in matchStats) (matchStats as any)[key] = item.count;
  }

  const activities = recentActivity.map((c: any) => ({
    id: c._id,
    type: c.status === 'completed' ? 'consultation_completed' : 'consultation_started',
    description: `${c.citizenId?.fullName || 'A citizen'} ${c.status === 'completed' ? 'completed' : 'started'} a consultation`,
    timestamp: c.createdAt,
  }));

  return { consultations: consultationStats, matchRequests: matchStats, recentActivity: activities };
}

export async function getRecentActivity(limit: number = 20) {
  const consultations = await ConsultationModel.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('citizenId', 'firstName lastName fullName')
    .populate('lawyerId', 'firstName lastName fullName');

  return consultations.map((c: any) => ({
    id: c._id,
    type: c.status === 'completed' ? 'consultation_completed' : c.disputed ? 'dispute_raised' : 'consultation_started',
    description: `${c.citizenId?.fullName || 'A citizen'} ${c.disputed ? 'raised a dispute' : c.status === 'completed' ? 'completed a consultation' : 'started a consultation'}`,
    timestamp: c.createdAt,
  }));
}