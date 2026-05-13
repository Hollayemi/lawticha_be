import { ObjectId, Types } from 'mongoose';

// Enums 

export enum UserRole {
  CITIZEN = 'citizen',
  LAWYER  = 'lawyer',
  ADMIN   = 'admin',
  SUPER_ADMIN   = 'admin',
}

export enum ConsultMode {
  MESSAGE = 'message',
  CALL    = 'call',
  VIDEO   = 'video',
}

export enum ConsultStatus {
  PENDING   = 'pending',
  ACCEPTED  = 'accepted',
  COMPLETED = 'completed',
  DECLINED  = 'declined',
  CANCELLED = 'cancelled',
}

export enum VerificationStatus {
  PENDING          = 'pending',
  CREDENTIAL_CHECK = 'credential_check',
  TRAINING         = 'training',
  ASSESSMENT       = 'assessment',
  VERIFIED         = 'verified',
  REJECTED         = 'rejected',
}

export enum LawyerBadge {
  VERIFIED   = 'Verified Lawyer',
  TOP_RATED  = 'Top Rated',
  RESPONSIVE = 'Responsive',
}

export enum AuditAction {
  LOGIN = "login",
  LOGOUT = "logout",
  PASSWORD_CHANGE = "password_change",

  // Admin management
  ADMIN_CREATED = "admin_created",
  ADMIN_UPDATED = "admin_updated",
  ADMIN_ACTIVATED = "admin_activated",
  ADMIN_DEACTIVATED = "admin_deactivated",
  ADMIN_REMOVED = "admin_removed",
  ROLE_CHANGED = "role_changed",

  // Module actions
  MODULE_CREATED = "module_created",
  MODULE_UPDATED = "module_updated",
  MODULE_DELETED = "module_deleted",
  MODULE_PUBLISHED = "module_published",

  // Topic actions
  TOPIC_CREATED = "topic_created",
  TOPIC_UPDATED = "topic_updated",
  TOPIC_DELETED = "topic_deleted",

  // Content actions
  CONTENT_UPLOADED = "content_uploaded",
  CONTENT_DELETED = "content_deleted",

  // User actions
  CITIZEN_SUSPENDED = "citizen_suspended",
  CITIZEN_ACTIVATED = "citizen_activated",
  LAWYER_VERIFIED = "lawyer_verified",
  LAWYER_REJECTED = "lawyer_rejected",

  // Comment actions
  COMMENT_RESOLVED = "comment_resolved",
  COMMENT_DELETED = "comment_deleted",
}

export type OnboardingStep =
  | "welcome"
  | "accept_terms"
  | "profile"
  | "training"
  | "complete";

export interface IAdminOnboardingState {
  currentStep: OnboardingStep;
  acceptedTerms: boolean;
  profileCompleted: boolean;
  trainingCompleted: boolean;
  hasCompletedOnboarding: boolean;
  onboardingData: {
    name?: string;
    email?: string;
    role?: AdminRole;
  };
}

export enum AdminRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  INSTRUCTOR = "instructor",
  MODERATOR = "moderator",
  ANALYST = "analyst",
  SUPPORT = "support",
}

// Base 

export interface BaseModel {
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// User 
export type UserStatusVariant = "active" | "inactive" | "pending" | "suspended" | "approved" | "rejected" | "warning";
export interface IUser extends BaseModel {
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatusVariant;
  authProvider: 'email' | 'google' | 'phone';
  googleId?: string;
  avatarUrl?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;
  // select: false fields (not returned by default)
  password?: string;
  refreshToken?: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
}

// Citizen Profile 

export interface ICitizenProfile extends BaseModel {
  userId: ObjectId;

  // Contact & location
  phone?: string;
  stateCode?: string;
  bio?: string;

  // Gamification
  xpTotal: number;
  xpLevel: number;
  streakDays: number;
  streakLastAt?: Date;

  // Learning stats
  topicsCompletedCount: number;
  certificatesCount: number;
  totalStudyMinutes: number;

  // Preferences
  preferredLanguage: string;
  jurisdictionCode: string;
  legalInterestAreas: string[];

  // Privacy toggles
  showActivityPublic: boolean;
  allowAnonymousAnalytics: boolean;
  personalizedRecommend: boolean;
  showProfileInCommunity: boolean;

  // Notification channels
  notifEmail: boolean;
  notifSms: boolean;
  notifPush: boolean;
  notifInAppBadge: boolean;

  // Notification types
  notifLawyerResponse: boolean;
  notifConsultReminder: boolean;
  notifMatchAlert: boolean;
  notifMessages: boolean;
  notifReviewReminder: boolean;
  notifWeeklyDigest: boolean;
  notifStreakReminder: boolean;
  notifPlatformUpdates: boolean;
  notifLegalNews: boolean;
  notifPromotional: boolean;

  // Appearance
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  accentColor: string;
  reducedMotion: boolean;
  highContrast: boolean;
  dyslexicFont: boolean;

  twoFaEnabled: boolean;
  acceptedTermsAt?: Date;
}

// Lawyer Profile 

export interface IFeeSchedule {
  message: number;
  call: number;
  video: number;
}

export interface IVerificationDocument {
  label: string;
  filename: string;
  fileUrl: string;
  uploadedAt: Date;
  sizeBytes: number;
  verified: boolean | null;
}

export interface ILawyerProfile extends BaseModel {
  userId: ObjectId;
  // NBA & professional identity
  nbaNumber?: string;
  yearOfCall?: number;
  calledAt?: string;        // "2019"
  title?: string;           // "Employment & Labour Lawyer"
  bio?: string;
  specialisms: string[];    // ['criminal', 'employment', 'property', ...]
  languages: string[];      // ['English', 'Igbo', 'Yoruba']

  // Location
  location?: string;
  state?: string;
  stateCode?: string;

  // Verification workflow (embedded,  no separate model needed for simple cases)
  verificationStatus: VerificationStatus;
  verificationRejectedReason?: string;
  verifiedAt?: Date;
  verificationDocuments: IVerificationDocument[];
  verificationAdminNote?: string;
  verificationReviewedBy?: Types.ObjectId;
  verificationReviewedAt?: Date;

  // Badges (assigned after verification)
  badges: LawyerBadge[];

  // Availability & fees
  isAvailable: boolean;
  fees: IFeeSchedule;

  // Performance metrics (denormalised for fast rendering)
  ratingAvg: number;
  reviewCount: number;
  consultationCount: number;
  responseTimeLabel: string;

  // Platform
  subscriptionTier: 'basic' | 'pro';

  // UI avatar colours
  colorA: string;
  colorB: string;
}

// Admin User 

export interface IAdminUser extends BaseModel  {
  name: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  removedAt: Date | null;
  removedBy: Types.ObjectId | null;
  onboardingCompleted: boolean;
  onboardingStep: OnboardingStep;
  acceptedTermsAt: Date | null;
  profileCompletedAt: Date | null;
  trainingCompletedAt: Date | null;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

// Audit Log 

export interface IAuditLog extends BaseModel {
  adminId: ObjectId;
  adminName: string;
  action: AuditAction;
  targetType: 'citizen' | 'lawyer' | 'verification' | 'document';
  targetId: ObjectId | string;
  meta?: any;
}

// OTP 

export interface IOtp extends BaseModel {
  phone: string;
  code: string;
  expiresAt: Date;
  used: boolean;
  attempts: number;
}

// Consultation 

export interface ITimelineEvent {
  time: Date;
  label: string;
  note?: string;
}

export interface IConsultation extends BaseModel {
  citizenId: ObjectId;
  lawyerId: ObjectId;
  lawyerProfileId: ObjectId;
  mode: ConsultMode;
  topic: string;
  detail?: string;
  status: ConsultStatus;
  scheduledAt?: Date;
  completedAt?: Date;
  durationMins?: number;
  feePaid: number;
  isCharged: boolean;
  receiptId?: string;
  paymentRef?: string;
  citizenRating?: number;
  citizenReview?: string;
  reviewedAt?: Date;
  timeline: ITimelineEvent[];
  declineReason?: string;
  cancelledBy?: 'citizen' | 'lawyer' | 'system';
}

// Lawyer Request 

export interface ILawyerRequest extends BaseModel {
  citizenId: ObjectId;
  specialism: string;
  urgency: string;
  location?: string;
  budget: string;
  description: string;
  status: 'pending' | 'matched' | 'accepted' | 'completed' | 'cancelled';
  matchedLawyerId?: ObjectId;
  matchedLawyerProfileId?: ObjectId;
  matchedAt?: Date;
  consultationId?: ObjectId;
  timeline: ITimelineEvent[];
}

// Conversation & Message 

export interface IConversation extends BaseModel {
  consultationId: ObjectId;
  participantIds: ObjectId[];
  citizenId: ObjectId;
  lawyerId: ObjectId;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  isArchivedByCitizen: boolean;
  isArchivedByLawyer: boolean;
}

export interface IMessage extends BaseModel {
  conversationId: ObjectId;
  senderId: ObjectId;
  senderRole: 'citizen' | 'lawyer';
  body: string;
  attachments?: { url: string; name: string; mimeType: string; sizeBytes: number }[];
  isRead: boolean;
  readAt?: Date;
  isDeleted: boolean;
}

// Legal Content 

export interface ILegalTopic extends BaseModel {
  slug: string;
  title: string;
  icon?: string;
  accentColor?: string;
  bgColor?: string;
  gradientFrom?: string;
  description?: string;
  articleCount: number;
  subtopics: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface IModuleLesson {
  _id?: ObjectId;
  title: string;
  order: number;
  durationSeconds: number;
  videoUrl?: string;
  content?: string;
  isPublished: boolean;
}

export interface ILegalModule extends BaseModel {
  slug: string;
  topicId: ObjectId;
  title: string;
  description?: string;
  tag?: string;
  tagColor?: string;
  gradient?: string;
  thumbnailUrl?: string;
  iconEmoji?: string;
  lessons: IModuleLesson[];
  lessonCount: number;
  totalWeeks: number;
  totalDurationLabel?: string;
  instructorId?: ObjectId;
  instructorName?: string;
  instructorEmail?: string;
  instructorInitials?: string;
  instructorColor?: string;
  price: string;
  isPremium: boolean;
  isPublished: boolean;
  ratingAvg: number;
  ratingCount: number;
  enrolledCount: number;
  xpReward: number;
}

export interface IEnrollment extends BaseModel {
  citizenId: ObjectId;
  moduleId: ObjectId;
  status: 'active' | 'complete' | 'saved' | 'dropped';
  progressPercent: number;
  lessonsCompleted: ObjectId[];
  currentLessonId?: ObjectId;
  currentLessonTitle?: string;
  startedAt: Date;
  completedAt?: Date;
  lastActivityAt: Date;
  xpEarned: number;
  isSaved: boolean;
  ratingGiven?: number;
}

export interface IUserProgress extends BaseModel {
  citizenId: ObjectId;
  moduleId: ObjectId;
  lessonId: ObjectId;
  enrollmentId: ObjectId;
  status: 'locked' | 'active' | 'done';
  videoPositionSeconds: number;
  completedAt?: Date;
  xpAwarded: number;
}

export interface ILegalActSection {
  _id?: ObjectId;
  number?: string;
  title?: string;
  plainText?: string;
  statutoryText?: string;
}

export interface ILegalAct extends BaseModel {
  slug: string;
  title: string;
  chapter?: string;
  year?: string;
  category: string;
  accentColor?: string;
  summary?: string;
  sections: ILegalActSection[];
  sectionCount: number;
  tags: string[];
  jurisdiction: 'federal' | 'state';
  stateCode?: string;
  isPublished: boolean;
  viewCount: number;
  lastAmendedAt?: Date;
}

export interface IBookmark extends BaseModel {
  citizenId: ObjectId;
  refType: 'legal_act' | 'module' | 'lesson';
  refId: ObjectId;
  sectionId?: ObjectId;
  title: string;
  sourceName?: string;
  accentColor?: string;
}

export interface ICertificate extends BaseModel {
  citizenId: ObjectId;
  moduleId: ObjectId;
  enrollmentId: ObjectId;
  certificateNumber: string;
  issuedAt: Date;
  pdfUrl?: string;
  moduleTitle?: string;
  citizenName?: string;
  instructorName?: string;
}

export interface IDailyChallenge extends BaseModel {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  topicId?: ObjectId;
  xpReward: number;
  activeDate: Date;
  isActive: boolean;
}

export interface ICommunityPost extends BaseModel {
  authorId: ObjectId;
  body: string;
  topicTag?: string;
  topicId?: ObjectId;
  isApproved: boolean;
  isFeatured: boolean;
  likeCount: number;
  replyCount: number;
  authorName?: string;
  authorRole?: string;
  authorInitials?: string;
  authorColor?: string;
}

export interface ILawyerReview extends BaseModel {
  lawyerId: ObjectId;
  lawyerProfileId: ObjectId;
  citizenId: ObjectId;
  consultationId: ObjectId;
  rating: number;
  body?: string;
  citizenInitials?: string;
  citizenName?: string;
  citizenColor?: string;
  isVisible: boolean;
}

export type NotificationType =
  | 'lawyer_response'
  | 'consult_reminder'
  | 'match_alert'
  | 'new_message'
  | 'review_reminder'
  | 'weekly_digest'
  | 'streak_reminder'
  | 'platform_update'
  | 'legal_news'
  | 'certificate_issued';

export interface INotification extends BaseModel {
  recipientId: ObjectId;
  type: NotificationType;
  title: string;
  body?: string;
  linkPath?: string;
  refId?: ObjectId;
  refType?: string;
  isRead: boolean;
  readAt?: Date;
}

export interface IStudySession extends BaseModel {
  citizenId: ObjectId;
  moduleId?: ObjectId;
  lessonId?: ObjectId;
  enrollmentId?: ObjectId;
  sessionType: 'study' | 'assessment';
  durationMinutes: number;
  startedAt: Date;
  endedAt: Date;
  year: number;
  month: number;
}