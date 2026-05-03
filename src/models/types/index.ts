import { ObjectId } from 'mongoose';

//  Enums 

export enum UserRole {
  CITIZEN = 'citizen',
  LAWYER  = 'lawyer',
  ADMIN   = 'admin',
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

export enum LawyerVerificationStatus {
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

//  Base 

export interface BaseModel {
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

//  User 

export interface IUser extends BaseModel {
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  authProvider: 'email' | 'google' | 'phone';
  googleId?: string;
  avatarUrl?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;
}

//  Citizen Profile 

export interface ICitizenProfile extends BaseModel {
  userId: ObjectId;
  phone?: string;
  stateCode?: string;
  bio?: string;

  xpTotal: number;
  xpLevel: number;
  streakDays: number;
  streakLastAt?: Date;
  joinedDays: number;

  topicsCompletedCount: number;
  certificatesCount: number;
  totalStudyMinutes: number;

  preferredLanguage: string;
  jurisdictionCode: string;
  legalInterestAreas: string[];

  // Privacy
  showActivityPublic: boolean;
  allowAnonymousAnalytics: boolean;
  personalizedRecommend: boolean;
  showProfileInCommunity: boolean;

  // Notification flags
  notifEmail: boolean;
  notifSms: boolean;
  notifPush: boolean;
  notifInAppBadge: boolean;
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

//  Lawyer Profile 

export interface IFeeSchedule {
  message: number;
  call: number;
  video: number;
}

export interface ILawyerProfile extends BaseModel {
  userId: ObjectId;
  nbaNumber: string;
  yearOfCall: number;
  title?: string;
  bio?: string;
  initials?: string;
  specialisms: string[];
  location?: string;
  state?: string;
  stateCode?: string;
  languages: string[];
  verificationStatus: LawyerVerificationStatus;
  verificationRejectedReason?: string;
  verifiedAt?: Date;
  badges: LawyerBadge[];
  isAvailable: boolean;
  fees: IFeeSchedule;
  ratingAvg: number;
  reviewCount: number;
  consultationCount: number;
  responseTimeLabel: string;
  subscriptionTier: 'basic' | 'pro';
  colorA: string;
  colorB: string;
}

//  Legal Topic 

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

//  Legal Module 

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

//  Enrollment 

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
  lastReadLabel?: string;
  xpEarned: number;
  isSaved: boolean;
  ratingGiven?: number;
}

//  User Progress 

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

//  Consultation 

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

//  Lawyer Request 

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

//  Conversation & Message 

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

//  Legal Act & Bookmark 

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

//  Certificate 

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

//  Daily Challenge 

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

//  Community Post 

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

//  Lawyer Review 

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

//  Notification 

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

//  Study Session 

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
