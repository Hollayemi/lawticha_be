import { Types } from 'mongoose';
import { LawyerProfileModel, ILawyerProfileDocument } from '../models/LawyerProfile.model';
import { UserModel } from '../models/User.model';
import { AuditLogModel } from '../models/Admin.model';
import { AuditAction, VerificationStatus, IVerificationDocument } from '../models/types';
import { AppError } from '../middleware/error';

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
      .populate('userId', 'firstName fullName lastName email avatarUrl isActive lastLoginAt'),
    LawyerProfileModel.countDocuments(filter),
  ]);

  return {
    data: profiles,
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
  return profile;
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