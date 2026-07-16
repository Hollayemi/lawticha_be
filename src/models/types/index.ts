import { Document, ObjectId, Types } from 'mongoose';

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

export type ConsultStatus = 
  | "pending"
  | "paid"
  | "processing"
  | "awaiting_lawyer" 
  | "active" 
  | "completed" 
  | "disputed" 
  | "cancelled" 
  | "refunded";


export enum VerificationStatus {
  PENDING          = 'pending',
  INFO_NEEDED      = 'info_requested',
  CREDENTIAL_CHECK = 'credential_check',
  TRAINING         = 'training',
  ASSESSMENT       = 'assessment',
  VERIFIED         = 'approved',
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
  CITIZEN_STATUS_CHANGED = "citizen_status_changed",
  CITIZEN_EMAIL_SENT = "email_sent",

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

  // lawyer actions
  VERIFICATION_APPROVED = "verification_approved",
  VERIFICATION_INFO_REQUEST = "verification_info_request",
  VERIFICATION_REJECTED = "verification_rejected",
  DOCUMENT_VERIFIED  = "document_verified",
  LAWYER_STATUS_CHANGED  = "lawyer_status_changed",

  // library
   BOOK_CREATED = 'book_created',
  BOOK_UPDATED = 'book_updated',
  BOOK_DELETED = 'book_deleted',
  ORDER_UPDATED = 'order_updated',

  // consultation
  CONSULTATION_STATUS_CHANGED = 'consultation_status_changed',
  DISPUTE_RESOLVED = 'dispute_resolved',
  CONSULTATION_FLAGGED = 'consultation_flagged',
  REFUND_APPROVED = 'refund_approved',
  REFUND_REJECTED = 'refund_rejected',
  LAWYER_WARNING_SENT = 'lawyer_warning_sent',
  BULK_ACTION = 'bulk_action',
  MATCH_ASSIGNED = 'match_assigned',
  MATCH_AUTO_ASSIGNED = 'match_auto_assigned',
  MATCH_UPDATED = 'match_updated',
  MATCH_ACCEPTED = 'match_accepted',
  MATCH_MESSAGE_SENT = 'match_message_sent',
  MATCH_CALL_SCHEDULED = 'match_call_scheduled',
  MATCH_DOCUMENT_ADDED = 'match_document_added',
  MATCH_RECOMMENDED = 'match_recommended',
  MATCH_LAWYER_SELECTED = 'match_lawyer_selected',
  MATCH_EXPIRED = 'match_expired',
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
  email: string;
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
  conversationId: ObjectId;
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
  disputed?: boolean;
  disputeReason?:string;
  disputeRaisedAt?: Date;
  citizenRating?: number;
  citizenReview?: string;
  reviewedAt?: Date;
  timeline: ITimelineEvent[];
  declineReason?: string;
  cancelledBy?: 'citizen' | 'lawyer' | 'system';
}

// Lawyer Request 

/** A document attached to a match request — either uploaded by the citizen at intake,
 *  or added by the firm's admin team (e.g. the refined case brief). Stored on Cloudinary. */
export interface IConsultationDocumentMeta {
  name: string;
  fileUrl: string;
  publicId?: string;
  sizeBytes: number;
  label?: string;
  source: 'citizen' | 'firm';
  uploadedAt: Date;
}

/** When the admin organizes a call/video consultation on the citizen's behalf. */
export interface IScheduledCall {
  dateTime: Date;
  link?: string;
  note?: string;
}

/** A lightweight snapshot of a lawyer recommended to a citizen for a given match request. */
export interface IRecommendedLawyer {
  lawyerId: ObjectId;
  lawyerProfileId: ObjectId;
  name: string;
  initials: string;
  color: string;
  nbaNumber: string;
  title?: string;
}

export type MatchRequestStatus =
  | 'pending'       // just submitted, not yet reviewed
  | 'unassigned'    // legacy alias of "pending"
  | 'in_review'     // an admin has accepted it and is working the case
  | 'ready_for_call' // admin has scheduled a call/video consultation with the citizen
  | 'matching'      // legacy: auto-match was running
  | 'recommended'   // admin sent the citizen a shortlist of lawyers to choose from
  | 'matched'       // citizen picked a lawyer (or admin assigned one directly) — a Consultation exists
  | 'accepted'       // legacy: lawyer self-accepted from the open pool
  | 'completed'
  | 'cancelled'
  | 'expired';

export interface ILawyerRequest extends BaseModel {
  citizenId: ObjectId;
  specialism: string;
  urgency: string;
  location?: string;
  topic: string;
  mode: ConsultMode;
  budget: string;
  description: string;
  /** Additional context the citizen shared for whoever ends up handling the case. */
  notes?: string;
  scheduledAt?: Date;
  status: MatchRequestStatus;

  //  Documents 
  documents: IConsultationDocumentMeta[];
  /** The firm's refined case brief — stored as a single reference, separate from raw uploads. */
  caseBrief?: IConsultationDocumentMeta;

  //  Admin handling (message-mode / call-mode consultations conducted by the firm) 
  handledByAdminId?: ObjectId;
  handledByAdminName?: string;
  adminMessage?: string;
  adminMessageAt?: Date;
  scheduledCall?: IScheduledCall;

  //  Recommendation & final match 
  recommendedLawyers: string[];
  matchedLawyerId?: ObjectId;
  matchedLawyerProfileId?: ObjectId;
  matchedLawyerName?: string;
  matchedAt?: Date;

  //  After match, may convert to a Consultation 
  consultationId?: ObjectId;

  expiresAt: Date;

  //  Activity timeline 
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

// export type ConsultStatus = 
//   | "pending" 
//   | "awaiting_lawyer" 
//   | "active" 
//   | "completed" 
//   | "disputed" 
//   | "cancelled" 
//   | "refunded";

// export type ConsultMode = "message" | "call" | "video";
export type MatchStatus = "unassigned" | "matching" | "matched" | "expired";

export interface IConsultationDocument extends Document {
  id: string;
  citizenId: Types.ObjectId;
  lawyerId: Types.ObjectId;
  lawyerProfileId: Types.ObjectId;
  mode: ConsultMode;
  topic: string;
  detail?: string;
  status: ConsultStatus;
  scheduledAt?: Date;
  completedAt?: Date;
  durationMins?: number;
  feePaid: number;
  platformFee: number;
  lawyerPayout: number;
  paymentRef?: string;
  receiptId?: string;
  isCharged: boolean;
  citizenRating?: number;
  citizenReview?: string;
  reviewedAt?: Date;
  disputed: boolean;
  disputeReason?: string;
  disputeRaisedAt?: Date;
  disputeResolvedAt?: Date;
  disputeResolution?: string;
  flagged: boolean;
  flagReason?: string;
  flaggedAt?: Date;
  flaggedBy?: Types.ObjectId;
  refundRequested: boolean;
  refundApproved?: boolean;
  refundReason?: string;
  refundedAt?: Date;
  transcript: IMessage[];
  timeline: ITimelineEvent[];
  cancelledBy?: "citizen" | "lawyer" | "system";
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  id: string;
  sender: "citizen" | "lawyer";
  senderName: string;
  senderId: ObjectId;
  text: string;
  time: Date;
  read: boolean;
  readAt?: Date;
}

export interface ITimelineEvent {
  time: Date;
  label: string;
  note?: string;
}

export interface IMatchRequestDocument extends Document {
  id: string;
  citizenId: Types.ObjectId;
  specialism: string;
  urgency: string;
  location?: string;
  budget: string;
  description: string;
  status: MatchStatus;
  matchedLawyerId?: Types.ObjectId;
  matchedLawyerProfileId?: Types.ObjectId;
  matchedLawyerName?: string;
  matchedAt?: Date;
  consultationId?: Types.ObjectId;
  expiresAt: Date;
  timeline: ITimelineEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IConsultationStats {
  total: number;
  active: number;
  disputed: number;
  completed: number;
  pendingPayment: number;
  awaitingLawyer: number;
  cancelled: number;
  refunded: number;
  totalRevenue: number;
  platformRevenue: number;
  lawyerPayoutTotal: number;
}

export interface ILawyerPerformanceStats {
  lawyerId: string;
  lawyerName: string;
  lawyerInitials: string;
  lawyerColor: string;
  nbaNumber: string;
  totalSessions: number;
  completedSessions: number;
  disputedSessions: number;
  averageRating: number;
  totalRevenue: number;
  completionRate: number;
}