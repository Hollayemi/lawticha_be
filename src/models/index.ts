
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
  // CommunityPostModel,
}                                              from './Certificate.model';

// Consultations 
export { ConsultationModel, LawyerRequestModel }  from './Consultation.model';
export { ConversationModel, MessageModel }        from './Message.model';
export { LawyerReviewModel, NotificationModel }   from './Notification.model';

// Activity 
export { StudySessionModel }  from './StudySession.model';
export { OtpModel }           from './Otp.model';

// Billing / Subscriptions 
export { SubscriptionPlanModel }   from './SubscriptionPlan.model';
export type { ISubscriptionPlanDocument } from './SubscriptionPlan.model';

export { SubscriptionModel }       from './Subscription.model';
export type { ISubscriptionDocument, ISubscriptionModel } from './Subscription.model';

export { BillingHistoryModel }     from './BillingHistory.model';
export type { IBillingHistoryDocument } from './BillingHistory.model';

export * from './types/billing.types';

// Types & enums (re-exported for convenience) 
export * from './types';