/**
 * LawTicha — Model Index
 * 
 * All Mongoose models exported from one place for clean imports:
 *
 *   import { UserModel, LawyerProfileModel, ConsultationModel } from '@/models';
 *
 * ENTITY MAP (who links to what):
 *
 *   User ┐
 *     ├ CitizenProfile (1-to-1)          │
 *     └ LawyerProfile  (1-to-1)          │
 *                                          │
 *   LegalTopic ┬ LegalModule ┤
 *                │     ├ Enrollment ┤ (citizen ↔ module)
 *                │     ├ UserProgress    │ (per-lesson)
 *                │     ├ Certificate     │
 *                │     └ StudySession    │
 *                └ DailyChallenge        │
 *                                          │
 *   LegalAct  Bookmark -┤ (citizen ↔ act / module)
 *                                          │
 *   LawyerProfile ┬ Consultation ┤ (citizen ↔ lawyer)
 *                   │     ├ Conversation  │
 *                   │     │     └ Message │
 *                   │     └ LawyerReview  │
 *                   └ LawyerRequest ┘ (citizen posts, platform matches)
 *
 *   CommunityPost  (citizen authored, admin approved)
 *   Notification   (any recipient)
 */

export { UserModel }                                   from './User.model';
export { CitizenProfileModel }                         from './CitizenProfile.model';
export { LawyerProfileModel }                          from './LawyerProfile.model';
export { LegalTopicModel, LegalModuleModel }           from './LegalModule.model';
export { EnrollmentModel, UserProgressModel }          from './Enrollment.model';
export { ConsultationModel, LawyerRequestModel }       from './Consultation.model';
export { ConversationModel, MessageModel }             from './Message.model';
export { LegalActModel, BookmarkModel }                from './LegalAct.model';
export {
  CertificateModel,
  DailyChallengeModel,
  DailyChallengeAttemptModel,
  CommunityPostModel,
}                                                      from './Certificate.model';
export { LawyerReviewModel, NotificationModel }        from './Notification.model';
export { StudySessionModel }                           from './StudySession.model';

// Types & enums
export * from './types';
