import { CitizenProfileModel, ICitizenProfileDocument } from '../models/CitizenProfile.model';
import { IUser } from '../models/types';
import { UserModel } from '../models/User.model';
import { AuditLogModel } from '../models/Admin.model';
import { AuditAction, UserStatusVariant } from '../models/types';
import { AppError } from '../middleware/error';
import cloudinary from '../utils/cloudinary';
import { LawyerProfileModel } from '../models';

//  Types 

interface AdminCtx {
  adminId: string;
  adminName: string;
}

export interface UpdateCitizenProfileInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  state?: string;
  bio?: string;
  avatarUrl?: string;
  stateCode?: string;
  preferredLanguage?: string;
  jurisdictionCode?: string;
  legalInterestAreas?: string[];
  // Appearance
  theme?: 'light' | 'dark' | 'system';
  fontSize?: 'small' | 'medium' | 'large';
  accentColor?: string;
  reducedMotion?: boolean;
  highContrast?: boolean;
  dyslexicFont?: boolean;
  notifEmail?: boolean;
  notifSms?: boolean;
  notifPush?: boolean;
  notifInAppBadge?: boolean;
  notifLawyerResponse?: boolean;
  notifConsultReminder?: boolean;
  notifMatchAlert?: boolean;
  notifMessages?: boolean;
  notifReviewReminder?: boolean;
  notifWeeklyDigest?: boolean;
  notifStreakReminder?: boolean;
  notifPlatformUpdates?: boolean;
  notifLegalNews?: boolean;
  notifPromotional?: boolean;
  showActivityPublic?: boolean;
  allowAnonymousAnalytics?: boolean;
  personalizedRecommend?: boolean;
  showProfileInCommunity?: boolean;
}

//  Get citizen profile 

export async function getCitizenProfile(userId: string) {
  const [user, profile] = await Promise.all([
    UserModel.findById(userId),
    CitizenProfileModel.findOne({ userId }),
  ]);

  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');
  if (!profile) throw new AppError('Citizen profile not found.', 404, 'NOT_FOUND');

  return { user: user.toSafeObject(), profile };
}

//  Update citizen profile 

export async function updateCitizenProfile(
  userId: string,
  input: UpdateCitizenProfileInput,
): Promise<any> {

  const user = await UserModel.findById(userId);
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');


  const USER_FIELDS = [
    'lastName', 'email', 'state', 'firstName',
    // Preferences
    'phone', 'stateCode', 'bio', 'preferredLanguage', 'jurisdictionCode',
    'legalInterestAreas', 'theme', 'fontSize', 'accentColor',
    'reducedMotion', 'highContrast', 'dyslexicFont',
    // notification
    'notifEmail', 'notifSms', 'notifPush', 'notifInAppBadge',
    'notifLawyerResponse', 'notifConsultReminder', 'notifMatchAlert',
    'notifMessages', 'notifReviewReminder', 'notifWeeklyDigest',
    'notifStreakReminder', 'notifPlatformUpdates', 'notifLegalNews', 'notifPromotional',
    // privacy
    'showActivityPublic', 'allowAnonymousAnalytics', 'personalizedRecommend', 'showProfileInCommunity',
  ] as const;

  if (input.avatarUrl) {
    user.avatarUrl = (await cloudinary.uploadFile(input.avatarUrl, "user", "image")).url
  }

  console.log(user)
  for (const key of USER_FIELDS) {
    if (input[key] !== undefined) {
      (user as any)[key] = input[key];
    }
  }
  return user.save();
}

export async function awardXP(
  userId: string,
  points: number,
  reason?: string
): Promise<ICitizenProfileDocument> {
  const profile = await CitizenProfileModel.findOne({ userId });
  if (!profile) throw new AppError('Citizen profile not found.', 404, 'NOT_FOUND');

  await profile.addXP(points);
  await profile.markActivity();

  return profile;
}

//  List citizens (admin) 

export interface ListCitizensParams {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  isActive?: boolean;
}

export async function listCitizens(params: ListCitizensParams = {}) {
  const { search, page = 1, pageSize = 20, isActive, status } = params;

  const userFilter: Record<string, unknown> = { role: 'citizen' };
  if (isActive !== undefined) userFilter.isActive = isActive;
  if (search?.trim()) userFilter.$text = { $search: search.trim() };
  if (status !== undefined) userFilter.status = status;

  const skip = (page - 1) * pageSize;

  const [users, total] = await Promise.all([
    UserModel.find(userFilter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    UserModel.countDocuments(userFilter),
  ]);

  const userIds = users.map((u) => u._id);
  const profiles = await CitizenProfileModel.find({ userId: { $in: userIds } });
  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

  const data = users.map((u) => ({
    user: u.toSafeObject(),
    profile: profileMap.get((u._id as any).toString()) ?? null,
  }));

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

//  Get citizen by id (admin) 

export async function getCitizenById(userId: string) {
  const [user, profile] = await Promise.all([
    UserModel.findOne({ _id: userId, role: 'citizen' }),
    CitizenProfileModel.findOne({ userId }),
  ]);
  if (!user) throw new AppError('Citizen not found.', 404, 'NOT_FOUND');
  return { user: user.toSafeObject(), profile };
}

//  Admin: suspend / reactivate citizen 

export async function updateCitizenStatus(
  userId: string,
  action: UserStatusVariant,
  reason: string,
  admin: AdminCtx
) {
  const user = await UserModel.findOne({ _id: userId, role: 'citizen' });
  if (!user) throw new AppError('Citizen not found.', 404, 'NOT_FOUND');

  user.isActive = action === 'active';
  await user.save({ validateBeforeSave: false });

  AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.CITIZEN_STATUS_CHANGED,
    targetType: 'citizen',
    targetId: user._id,
    meta: { action, reason },
  }).catch(() => null);

  return {
    message: `Citizen ${action === 'suspended' ? 'suspended' : 'reactivated'}.`,
    userId,
    isActive: user.isActive,
  };
}

//  Admin: send email to citizen (stub) 

export async function emailCitizen(
  userId: string,
  subject: string,
  body: string,
  admin: AdminCtx
) {
  const user = await UserModel.findOne({ _id: userId, role: 'citizen' });
  if (!user) throw new AppError('Citizen not found.', 404, 'NOT_FOUND');

  // TODO: wire up email provider (SendGrid / Nodemailer)
  console.log(`[EMAIL] To: ${user.email} | Subject: ${subject}`);

  AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.CITIZEN_EMAIL_SENT,
    targetType: 'citizen',
    targetId: user._id,
    meta: { subject },
  }).catch(() => null);

  return { message: 'Email sent successfully.' };
}

//  Dashboard stats 

export async function getCitizenStats() {
  const [total, active, inactive] = await Promise.all([
    UserModel.countDocuments({ role: 'citizen' }),
    UserModel.countDocuments({ role: 'citizen', isActive: true }),
    UserModel.countDocuments({ role: 'citizen', isActive: false }),
  ]);

  const xpAgg = await CitizenProfileModel.aggregate([
    { $group: { _id: null, avgXP: { $avg: '$xpTotal' }, totalStudyMins: { $sum: '$totalStudyMinutes' } } },
  ]);

  return {
    total,
    active,
    inactive,
    avgXP: xpAgg[0]?.avgXP ? Math.round(xpAgg[0].avgXP) : 0,
    totalStudyHours: xpAgg[0]?.totalStudyMins ? Math.round(xpAgg[0].totalStudyMins / 60) : 0,
  };
}