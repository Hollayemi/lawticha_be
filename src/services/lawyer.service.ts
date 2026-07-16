import { Types } from 'mongoose';
import { LawyerProfileModel, ILawyerProfileDocument } from '../models/LawyerProfile.model';
import { UserModel } from '../models/User.model';
import { AuditLogModel } from '../models/Admin.model';
import { awardXP } from './citizen.service';
import { ConsultationModel, LawyerRequestModel } from '../models/Consultation.model';
import { AuditAction, VerificationStatus, IVerificationDocument } from '../models/types';
import { AppError } from '../middleware/error';
import { lawyerObject } from '../helpers/formatReturn';
import { updateProfile } from '../controllers/auth.controller';
import { chatService } from '../server';
import CloudinaryService from '../utils/cloudinary';

//  Types 

interface AdminCtx {
  adminId: string;
  adminName: string;
}

export interface SubmitVerificationInput {
  nbaNumber: string;
  yearOfCall: number;
  calledAt: string;
  specialisms?: string[];
  title?: string;
  bio?: string;
  location?: string;
  state?: string;
  stateCode?: string;
  languages?: string[];
  fees?: {
    message: number;
    call: number;
    video: number;
  };
  documents?: IVerificationDocument[];
}

export interface UpdateLawyerProfileInput {
  title?: string;
  bio?: string;
  specialisms?: string[];
  languages?: string[];
  location?: string;
  state?: string;
  stateCode?: string;
  fees?: {
    message?: number;
    call?: number;
    video?: number;
  };
}

export interface LawyerProfile {
  id: string;
  nbaNumber: string;

  firstName: string;
  lastName: string;

  title: string;
  specialisms: string[];

  location: string;
  state: string;

  rating: number;
  reviewCount: number;
  consultationCount: number;

  responseTime: number;

  feeMessage: number;
  feeCall: number;
  feeVideo: number;

  isAvailable: boolean;
  verificationStatus: string;

  bio: string;

  yearsCall?: number;
  yearCalled?: string | Date;

  languages: string[];
  badges: string[];

  colorA?: string;
  colorB?: string;
}



//  Get lawyer profile (with user) 

export async function getLawyerProfile(userId: string) {
  const [user, profile] = await Promise.all([
    UserModel.findById(userId),
    LawyerProfileModel.findOne({ userId }),
  ]);

  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');
  if (!profile) throw new AppError('Lawyer profile not found.', 404, 'NOT_FOUND');

  return { user: user.toSafeObject(), profile };
}

//  Submit / resubmit verification 
export async function submitVerification(
  userId: string,
  input: SubmitVerificationInput
) {
  let profile = await LawyerProfileModel.findOne({ userId });

  // Create profile if it doesn't exist
  if (!profile) {
    profile = new LawyerProfileModel({
      userId,
      fees: {},
      verificationStatus: VerificationStatus.PENDING
    });
  }

  // Block resubmission if already in progress beyond credential_check
  const blocked: VerificationStatus[] = [
    VerificationStatus.TRAINING,
    VerificationStatus.ASSESSMENT,
    VerificationStatus.VERIFIED,
  ];

  if (blocked.includes(profile.verificationStatus)) {
    throw new AppError(
      'Your verification is already in progress and cannot be resubmitted at this stage.',
      400,
      'VERIFICATION_IN_PROGRESS'
    );
  }

  // Update fields
  if (input.title) profile.title = input.title;
  if (input.bio) profile.bio = input.bio;
  if (input.location) profile.location = input.location;
  if (input.state) profile.state = input.state;
  if (input.stateCode) profile.stateCode = input.stateCode;
  if (input.languages) profile.languages = input.languages;
  if (input.fees) {
    profile.fees = {
      message: input.fees.message ?? profile.fees?.message,
      call: input.fees.call ?? profile.fees?.call,
      video: input.fees.video ?? profile.fees?.video,
    };
  }

  // Submit verification (handles both create and update internally)
  await profile.submitVerification({
    nbaNumber: input.nbaNumber,
    yearOfCall: input.yearOfCall,
    calledAt: input.calledAt,
    specialisms: input.specialisms,
    documents: input.documents,
  });

  await profile.save();

  return { message: 'Verification submitted successfully.', profile };
}

//  Update lawyer profile (non-verification fields) 

export async function updateLawyerProfile(
  userId: string,
  input: UpdateLawyerProfileInput
): Promise<ILawyerProfileDocument> {
  const profile = await LawyerProfileModel.findOne({ userId });
  if (!profile) throw new AppError('Lawyer profile not found.', 404, 'NOT_FOUND');

  if (input.title !== undefined) profile.title = input.title;
  if (input.bio !== undefined) profile.bio = input.bio;
  if (input.specialisms !== undefined) profile.specialisms = input.specialisms;
  if (input.languages !== undefined) profile.languages = input.languages;
  if (input.location !== undefined) profile.location = input.location;
  if (input.state !== undefined) profile.state = input.state;
  if (input.stateCode !== undefined) profile.stateCode = input.stateCode;

  if (input.fees) {
    if (input.fees.message !== undefined) profile.fees.message = input.fees.message;
    if (input.fees.call !== undefined) profile.fees.call = input.fees.call;
    if (input.fees.video !== undefined) profile.fees.video = input.fees.video;
  }

  return profile.save();
}

//  Toggle availability 

export async function toggleAvailability(
  userId: string,
  available: boolean
): Promise<ILawyerProfileDocument> {
  const profile = await LawyerProfileModel.findOne({ userId });
  if (!profile) throw new AppError('Lawyer profile not found.', 404, 'NOT_FOUND');
  return profile.setAvailability(available);
}

//  Admin: advance verification 

export async function advanceVerification(
  profileId: string,
  admin: AdminCtx,
  note?: string
) {
  const profile = await LawyerProfileModel.findById(profileId);
  if (!profile) throw new AppError('Lawyer profile not found.', 404, 'NOT_FOUND');

  const prevStatus = profile.verificationStatus;
  await profile.advanceVerification(new Types.ObjectId(admin.adminId), note);

  AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: profile.verificationStatus === VerificationStatus.VERIFIED
      ? AuditAction.VERIFICATION_APPROVED
      : AuditAction.VERIFICATION_INFO_REQUEST,
    targetType: 'verification',
    targetId: profile._id,
    meta: { from: prevStatus, to: profile.verificationStatus, note },
  }).catch(() => null);

  return { message: `Verification advanced to ${profile.verificationStatus}`, profile };
}

//  Admin: reject verification 

export async function rejectVerification(
  profileId: string,
  admin: AdminCtx,
  reason: string,
  infoNeeded: boolean
) {
  const profile = await LawyerProfileModel.findById(profileId);
  if (!profile) throw new AppError('Lawyer profile not found.', 404, 'NOT_FOUND');

  if (infoNeeded) {

  } else {
    await profile.rejectVerification(new Types.ObjectId(admin.adminId), reason);
  }
  AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.VERIFICATION_REJECTED,
    targetType: 'verification',
    targetId: profile._id,
    meta: { reason },
  }).catch(() => null);

  return { message: 'Verification rejected.', profile };
}

//  Admin: verify a document 

export async function verifyDocument(
  profileId: string,
  documentId: string,
  verified: boolean,
  admin: AdminCtx
) {
  const profile = await LawyerProfileModel.findById(profileId);
  if (!profile) throw new AppError('Lawyer profile not found.', 404, 'NOT_FOUND');

  await profile.verifyDocument(new Types.ObjectId(documentId), verified);

  AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.DOCUMENT_VERIFIED,
    targetType: 'document',
    targetId: documentId,
    meta: { profileId, verified },
  }).catch(() => null);

  return { message: `Document marked as ${verified ? 'verified' : 'failed'}.` };
}

//  List lawyers (admin) 

export interface ListLawyersParams {
  verificationStatus?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  isAvailable?: boolean;
}

export async function listLawyers(params: ListLawyersParams = {}) {
  const {
    verificationStatus,
    search,
    page = 1,
    pageSize = 20,
    isAvailable,
  } = params;

  const filter: Record<string, unknown> = {};

  if (verificationStatus && Object.values(VerificationStatus).includes(verificationStatus as VerificationStatus)) {
    filter.verificationStatus = verificationStatus;
  }
  if (isAvailable !== undefined) filter.isAvailable = isAvailable;

  const skip = (page - 1) * pageSize;

  let userIds: Types.ObjectId[] | undefined;
  if (search?.trim()) {
    const users = await UserModel.find(
      { $text: { $search: search.trim() }, role: 'lawyer' },
      { _id: 1 }
    );
    userIds = users.map((u) => u._id as Types.ObjectId);
    if (userIds.length) filter.userId = { $in: userIds };
    else return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const [profiles, total] = await Promise.all([
    LawyerProfileModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('userId', 'firstName fullName lastName email avatarUrl isActive lastLoginAt')
      .populate('specialisms', 'name displayName'),
    LawyerProfileModel.countDocuments(filter),
  ]);

  return {
    data: profiles.map((profile) => lawyerObject(profile)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

//  Get single lawyer profile (admin) 

export async function getLawyerById(profileId: string) {
  const profile = await LawyerProfileModel.findById(profileId).populate(
    'userId',
    'firstName lastName email avatarUrl isActive lastLoginAt createdAt'
  );
  if (!profile) throw new AppError('Lawyer profile not found.', 404, 'NOT_FOUND');
  return lawyerObject(profile);
}

//  Admin: update lawyer status (active / inactive) 
// Note: actual verification is handled by advanceVerification / rejectVerification.
// This is for admin suspend / reactivate.

export async function updateLawyerStatus(
  profileId: string,
  action: 'suspend' | 'reactivate',
  reason: string,
  admin: AdminCtx
) {
  const profile = await LawyerProfileModel.findById(profileId).populate<{
    userId: InstanceType<typeof UserModel>
  }>('userId');
  if (!profile) throw new AppError('Lawyer profile not found.', 404, 'NOT_FOUND');

  const user = await UserModel.findById(profile.userId);
  if (!user) throw new AppError('Associated user not found.', 404, 'NOT_FOUND');

  if (action === 'suspend') {
    user.isActive = false;
    profile.isAvailable = false;
  } else {
    user.isActive = true;
  }

  await Promise.all([user.save({ validateBeforeSave: false }), profile.save()]);

  AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.LAWYER_STATUS_CHANGED,
    targetType: 'lawyer',
    targetId: profile._id,
    meta: { action, reason },
  }).catch(() => null);

  return { message: `Lawyer ${action === 'suspend' ? 'suspended' : 'reactivated'}.` };
}

//  Dashboard stats 

export async function getLawyerStats() {
  const statuses = Object.values(VerificationStatus);

  const counts = await LawyerProfileModel.aggregate([
    { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
  ]);

  const byStatus: Record<string, number> = {};
  for (const s of statuses) byStatus[s] = 0;
  for (const { _id, count } of counts) byStatus[_id] = count;

  const ratingAgg = await LawyerProfileModel.aggregate([
    { $match: { reviewCount: { $gt: 0 } } },
    { $group: { _id: null, avg: { $avg: '$ratingAvg' } } },
  ]);

  const avgRating = ratingAgg[0]?.avg
    ? Number(ratingAgg[0].avg.toFixed(1))
    : 0;

  return {
    total: Object.values(byStatus).reduce((a, b) => a + b, 0),
    byStatus,
    avgRating,
  };
}


// ========== NEW MARKETPLACE FUNCTIONS ==========

/**
 * Get marketplace stats for hero section
 * GET /marketplace/stats
 */
export async function getMarketplaceStats() {
  const totalLawyers = await LawyerProfileModel.countDocuments({
    verificationStatus: VerificationStatus.VERIFIED,
    isAvailable: true,
  });

  const ratingAgg = await LawyerProfileModel.aggregate([
    { $match: { verificationStatus: VerificationStatus.VERIFIED, reviewCount: { $gt: 0 } } },
    { $group: { _id: null, avg: { $avg: '$ratingAvg' } } },
  ]);

  const avgRating = ratingAgg[0]?.avg ? Number(ratingAgg[0].avg.toFixed(1)) : 4.7;

  const consultationAgg = await ConsultationModel.aggregate([
    { $match: { status: 'completed' } },
    { $count: 'total' },
  ]);

  const totalConsultations = consultationAgg[0]?.total || 0;

  return {
    totalLawyers,
    averageRating: avgRating,
    totalConsultations,
    verifiedLawyers: totalLawyers,
    responseRate: 98, // This would come from analytics
    averageResponseTime: 2, // hours
  };
}

/**
 * Get unique states for filter dropdown
 * GET /marketplace/states
 */
export async function getMarketplaceStates(): Promise<string[]> {
  const states = await LawyerProfileModel.distinct('state', {
    verificationStatus: VerificationStatus.VERIFIED,
    state: { $exists: true, $ne: '' },
  });
  return states.filter(s => s).sort();
}

/**
 * Get specialisms with counts for filter
 * GET /marketplace/specialisms
 */
export async function getMarketplaceSpecialisms() {
  const specialismsMap: Record<string, { label: string; iconName: string; count: number }> = {
    criminal: { label: 'Criminal Law', iconName: 'Shield', count: 0 },
    property: { label: 'Property & Tenancy', iconName: 'Home', count: 0 },
    employment: { label: 'Employment & Labour', iconName: 'Briefcase', count: 0 },
    business: { label: 'Business & CAC', iconName: 'Building2', count: 0 },
    family: { label: 'Family Law', iconName: 'Heart', count: 0 },
    consumer: { label: 'Consumer Rights', iconName: 'Globe', count: 0 },
    road: { label: 'Road Traffic', iconName: 'Car', count: 0 },
  };

  const result = await LawyerProfileModel.aggregate([
    { $match: { verificationStatus: VerificationStatus.VERIFIED } },
    { $unwind: { path: '$specialisms', preserveNullAndEmptyArrays: true } },
    { $group: { _id: '$specialisms', count: { $sum: 1 } } },
  ]);

  for (const item of result) {
    if (specialismsMap[item._id]) {
      specialismsMap[item._id].count = item.count;
    }
  }

  return Object.entries(specialismsMap).map(([id, data]) => ({
    id,
    label: data.label,
    iconName: data.iconName,
    count: data.count,
  }));
}

/**
 * Get filter counts for sidebar
 * GET /marketplace/filter-counts
 */
export async function getFilterCounts(params: { specialism?: string; state?: string; search?: string }) {
  const baseFilter: any = { verificationStatus: VerificationStatus.VERIFIED };

  if (params.specialism && params.specialism !== 'all') {
    baseFilter.specialisms = params.specialism;
  }
  if (params.state && params.state !== 'all') {
    baseFilter.state = params.state;
  }

  // Search filter if provided
  let userIds: Types.ObjectId[] | undefined;
  if (params.search?.trim()) {
    const users = await UserModel.find(
      { $text: { $search: params.search.trim() }, role: 'lawyer' },
      { _id: 1 }
    );
    userIds = users.map((u) => u._id as Types.ObjectId);
    if (userIds.length) baseFilter.userId = { $in: userIds };
    else return { specialisms: {}, states: {} };
  }

  // Get specialism counts
  const specialismAgg = await LawyerProfileModel.aggregate([
    { $match: baseFilter },
    { $unwind: { path: '$specialisms', preserveNullAndEmptyArrays: true } },
    { $group: { _id: '$specialisms', count: { $sum: 1 } } },
  ]);

  const specialisms: Record<string, number> = {};
  for (const item of specialismAgg) {
    if (item._id) specialisms[item._id] = item.count;
  }

  // Get state counts
  const stateAgg = await LawyerProfileModel.aggregate([
    { $match: baseFilter },
    { $match: { state: { $exists: true, $ne: '' } } },
    { $group: { _id: '$state', count: { $sum: 1 } } },
  ]);

  const states: Record<string, number> = {};
  for (const item of stateAgg) {
    if (item._id) states[item._id] = item.count;
  }

  return { specialisms, states };
}

/**
 * Get marketplace lawyers (public listing)
 * GET /marketplace/lawyers
 */
export interface MarketplaceLawyersParams {
  specialism?: string;
  state?: string;
  search?: string;
  sortBy?: 'rating' | 'reviews' | 'response' | 'fee';
  page?: number;
  pageSize?: number;
  /** Only show lawyers on a paid subscription — used for the citizen's direct-booking flow. */
  subscribedOnly?: boolean;
}

export async function getMarketplaceLawyers(params: MarketplaceLawyersParams = {}) {
  const {
    specialism,
    state,
    search,
    sortBy = 'rating',
    page = 1,
    pageSize = 20,
    subscribedOnly,
  } = params;

  const filter: any = {
    verificationStatus: VerificationStatus.VERIFIED,
  };

  if (subscribedOnly) {
    filter.subscriptionTier = { $ne: 'basic' };
  }

  if (specialism && specialism !== 'all') {
    filter.specialisms = specialism;
  }
  if (state && state !== 'all') {
    filter.state = state;
  }

  // Handle search across user names
  let userIds: Types.ObjectId[] | undefined;
  if (search?.trim()) {
    const users = await UserModel.find(
      { $text: { $search: search.trim() }, role: 'lawyer' },
      { _id: 1 }
    );
    userIds = users.map((u) => u._id as Types.ObjectId);
    if (userIds.length) {
      filter.userId = { $in: userIds };
    } else {
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }
  }

  // Build sort object
  let sortObj: any = {};
  switch (sortBy) {
    case 'rating':
      sortObj = { ratingAvg: -1 };
      break;
    case 'reviews':
      sortObj = { reviewCount: -1 };
      break;
    case 'response':
      sortObj = { responseTimeLabel: 1 };
      break;
    case 'fee':
      sortObj = { 'fees.message': 1 };
      break;
    default:
      sortObj = { ratingAvg: -1 };
  }

  const skip = (page - 1) * pageSize;

  const [profiles, total] = await Promise.all([
    LawyerProfileModel.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(pageSize)
      .populate('userId', 'firstName lastName email avatarUrl')
      .populate('specialisms', 'name displayName'),
    LawyerProfileModel.countDocuments(filter),
  ]);

  const data = profiles.map((profile) => lawyerObject(profile));

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get lawyer by NBA number (public)
 * GET /marketplace/lawyers/:nbaNumber
 */
export async function getLawyerByNbaNumber(nbaNumber: string) {
  const profile = await LawyerProfileModel.findOne({ nbaNumber: nbaNumber.replace(/-/g, "/") })
    .populate('userId', 'firstName lastName email avatarUrl')
    .populate('specialisms');

  if (!profile) {
    throw new AppError('Lawyer not found', 404, 'NOT_FOUND');
  }


  // Transform to marketplace format
  return lawyerObject(profile)
}

/**
 * Book a consultation (create new consultation)
 * POST /marketplace/consultations
 */
export interface BookConsultationInput {
  lawyerNbaNumber: string;
  mode: 'message' | 'call' | 'video';
  topic: string;
  description?: string;
  preferredTimeSlot?: string;
}

export const receiptId = `CST-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export async function bookConsultation(citizenId: string, citizenName:string, input: BookConsultationInput) {
  const { lawyerNbaNumber, mode, topic, description, preferredTimeSlot } = input;

  // Find lawyer by NBA number
  const profile = await LawyerProfileModel.findOne({ nbaNumber: lawyerNbaNumber })
    .populate('userId', 'firstName lastName email avatarUrl')
    .populate('specialisms', 'name displayName');
  if (!profile) {
    throw new AppError('Lawyer not found', 404, 'NOT_FOUND');
  }

  if (!profile.isAvailable) {
    throw new AppError('Lawyer is not available for consultations', 400, 'LAWYER_UNAVAILABLE');
  }

  // Get fee based on mode
  let feePaid = 0;
  switch (mode) {
    case 'message':
      feePaid = profile.fees?.message || 5000;
      break;
    case 'call':
      feePaid = profile.fees?.call || 12000;
      break;
    case 'video':
      feePaid = profile.fees?.video || 18000;
      break;
  }

  // Create consultation
  const consultation = await ConsultationModel.create({
    citizenId,
    lawyerId: profile.userId,
    lawyerProfileId: profile._id,
    mode,
    topic,
    detail: description,
    status: 'pending',
    scheduledAt: preferredTimeSlot ? new Date(preferredTimeSlot) : undefined,
    feePaid,
    receiptId,
    timeline: [
      { time: new Date(), label: 'Request sent', note: `Consultation requested via ${mode}` },
    ],
  });

  const lawyerUser = profile.userId as any;

  const conversation = await chatService.findOrCreateConversation({
    contextType: 'consultation',
    contextId: consultation._id.toString(),
    participants: [
      {
        userId: new Types.ObjectId(citizenId),
        role: 'citizen',
        name: citizenName,
      },
      {
        userId: lawyerUser._id.toString(),
        role: 'lawyer',
        name: `${lawyerUser.firstName} ${lawyerUser.lastName}`.trim(),
        avatarUrl: lawyerUser.avatarUrl,
      },
    ],
    metadata: {
      consultationId: consultation._id.toString(),
      mode: input.mode,
      feePaid: feePaid,
    },
  });

  await ConsultationModel.updateOne({_id: consultation._id }, { $set: { conversationId: conversation.conversation._id  }})

  return {
    consultationId: consultation._id,
    receiptId,
    status: consultation.status,
    fee: feePaid,
    lawyerResponseTime: profile.responseTimeLabel || 'Under 2 hours',
    estimatedResponseAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
  };
}

/**
 * Request a lawyer match (create match request)
 * POST /marketplace/match-requests
 */
export interface RequestMatchDocumentInput {
  name: string;
  /** Base64 data URI, e.g. "data:application/pdf;base64,...". */
  base64: string;
  sizeBytes?: number;
}

export interface RequestMatchInput {
  specialism: string;
  urgency: 'today' | 'this_week' | 'within_two_weeks' | 'no_rush';
  topic: string;
  mode: 'message' | 'call' | 'video';
  preferredTimeSlot: string;
  location?: string;
  budgetRange: string;
  description: string;
  notes?: string;
  documents?: RequestMatchDocumentInput[];
}

export async function requestLawyerMatch(citizenId: string, input: RequestMatchInput) {
  const documents = [];
  for (const doc of input.documents || []) {
    const { url, publicId } = await CloudinaryService.uploadFile(doc.base64, `match-requests/${citizenId}`, 'raw');
    documents.push({
      name: doc.name,
      fileUrl: url,
      publicId,
      sizeBytes: doc.sizeBytes || 0,
      source: 'citizen' as const,
      uploadedAt: new Date(),
    });
  }

  const request = await LawyerRequestModel.create({
    citizenId,
    specialism: input.specialism,
    urgency: input.urgency,
    location: input.location,
    topic: input.topic,
    mode: input.mode,
    budget: input.budgetRange,
    description: input.description,
    notes: input.notes,
    documents,
    scheduledAt: input.preferredTimeSlot ? new Date(input.preferredTimeSlot) : undefined,
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    timeline: [
      { time: new Date(), label: 'Request submitted', note: 'Awaiting review from our team' },
    ],
  });

  return {
    requestId: request._id,
    status: request.status,
    documentsAttached: documents.length,
  };
}

/**
 * Get lawyer availability slots
 * GET /marketplace/lawyers/:nbaNumber/availability
 */
export async function getLawyerAvailability(nbaNumber: string, date?: string) {
  const profile = await LawyerProfileModel.findOne({ nbaNumber: nbaNumber.replace(/-/g, "/") });
  if (!profile) {
    throw new AppError('Lawyer not found', 404, 'NOT_FOUND');
  }

  // Generate time slots for the next 7 days (9 AM - 5 PM, hourly)
  const startDate = date ? new Date(date) : new Date();
  startDate.setHours(0, 0, 0, 0);

  const slots = [];
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);

    for (let hour = 9; hour <= 17; hour++) {
      const slotTime = new Date(currentDate);
      slotTime.setHours(hour, 0, 0, 0);

      // Skip past times
      if (slotTime < new Date()) continue;

      // Check if already booked (simplified - would check existing consultations)
      const existingBooking = await ConsultationModel.findOne({
        lawyerId: profile.userId,
        scheduledAt: slotTime,
        status: { $in: ['pending', 'accepted'] },
      });

      slots.push({
        id: `${slotTime.toISOString()}`,
        startTime: slotTime.toISOString(),
        endTime: new Date(slotTime.getTime() + 60 * 60 * 1000).toISOString(),
        isAvailable: !existingBooking,
        timezone: 'Africa/Lagos',
      });
    }
  }

  return slots;
}

/**
 * Submit a review for a lawyer after consultation
 * POST /marketplace/lawyers/:nbaNumber/reviews
 */
export interface SubmitReviewInput {
  consultationId: string;
  rating: number;
  comment: string;
  tags?: string[];
}

export async function submitReview(citizenId: string, nbaNumber: string, input: SubmitReviewInput) {
  const { consultationId, rating, comment, tags } = input;

  // Find the consultation
  const consultation = await ConsultationModel.findOne({
    _id: consultationId,
    citizenId,
    status: 'completed',
  });

  if (!consultation) {
    throw new AppError('Consultation not found or not completed', 404, 'NOT_FOUND');
  }

  // Check if already reviewed
  if (consultation.citizenRating) {
    throw new AppError('You have already reviewed this consultation', 400, 'ALREADY_REVIEWED');
  }

  // Update consultation with review
  consultation.citizenRating = rating;
  consultation.citizenReview = comment;
  consultation.reviewedAt = new Date();
  await consultation.save();

  // Update lawyer's ratings
  const lawyerProfile = await LawyerProfileModel.findById(consultation.lawyerProfileId);
  if (lawyerProfile) {
    const newTotalRating = (lawyerProfile.ratingAvg * lawyerProfile.reviewCount) + rating;
    const newReviewCount = lawyerProfile.reviewCount + 1;
    const newRatingAvg = newTotalRating / newReviewCount;

    await lawyerProfile.updateMetrics({
      ratingAvg: newRatingAvg,
      reviewCount: newReviewCount,
    });

    await awardXP(citizenId, 25); // 25 XP for leaving a review
  }

  return {
    reviewId: consultation._id,
    status: 'published',
    createdAt: new Date(),
  };
}
