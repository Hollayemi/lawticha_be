/**
 * LawTicha — Model Index
 *
 * All Mongoose models and types exported from one place:
 *
 *   import { UserModel, LawyerProfileModel, ConsultationModel } from '@/models';
 *
 * ENTITY MAP 
 *
 *  User (role: citizen | lawyer | admin)
 *    ├ CitizenProfile   1-to-1  (XP, streak, prefs, notifications)
 *    └ LawyerProfile    1-to-1  (NBA, specialisms, fees, verification embedded)
 *
 *  LegalTopic → LegalModule
 *    ├ Enrollment     (citizen ↔ module)
 *    ├ UserProgress   (per-lesson)
 *    ├ Certificate
 *    └ StudySession
 *
 *  LawyerProfile
 *    ├ Consultation   (citizen ↔ lawyer booking)
 *    │     ├ Conversation → Message
 *    │     └ LawyerReview
 *    └ LawyerRequest  (citizen posts a request, platform matches)
 *
 *  LegalAct  ← Bookmark (citizen ↔ act/module)
 *  DailyChallenge ← DailyChallengeAttempt
 *  CommunityPost
 *  Notification
 *  AdminUser  ← AuditLog
 *  Otp
 */

// Core user models 
export { UserModel }                from './User.model';
export type { IUserDocument, IUserModel } from './User.model';

export { CitizenProfileModel }      from './CitizenProfile.model';
export type { ICitizenProfileDocument }  from './CitizenProfile.model';

export { LawyerProfileModel }       from './LawyerProfile.model';
export type { ILawyerProfileDocument }   from './LawyerProfile.model';

// Admin 
export { AdminUserModel, AuditLogModel } from './Admin.model';
export type { IAdminUserDocument }       from './Admin.model';

// Legal content 
export { LegalTopicModel, LegalModuleModel }   from './LegalModule.model';
export { EnrollmentModel, UserProgressModel }  from './Enrollment.model';
export { LegalActModel, BookmarkModel }        from './LegalAct.model';
export {
  CertificateModel,
  DailyChallengeModel,
  DailyChallengeAttemptModel,
  CommunityPostModel,
}                                              from './Certificate.model';

// Consultations 
export { ConsultationModel, LawyerRequestModel }  from './Consultation.model';
export { ConversationModel, MessageModel }        from './Message.model';
export { LawyerReviewModel, NotificationModel }   from './Notification.model';

// Activity 
export { StudySessionModel }  from './StudySession.model';
export { OtpModel }           from './Otp.model';

// Types & enums (re-exported for convenience) 
export * from './types';