"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingHistoryModel = exports.SubscriptionModel = exports.SubscriptionPlanModel = exports.OtpModel = exports.StudySessionModel = exports.MessageModel = exports.ConversationModel = exports.LawyerRequestModel = exports.ConsultationModel = exports.DailyChallengeAttemptModel = exports.DailyChallengeModel = exports.CertificateModel = exports.BookmarkModel = exports.LegalActModel = exports.UserProgressModel = exports.EnrollmentModel = exports.LegalModuleModel = exports.LegalTopicModel = exports.AuditLogModel = exports.AdminUserModel = exports.LawyerProfileModel = exports.CitizenProfileModel = exports.UserModel = void 0;
var User_model_1 = require("./User.model");
Object.defineProperty(exports, "UserModel", { enumerable: true, get: function () { return User_model_1.UserModel; } });
var CitizenProfile_model_1 = require("./CitizenProfile.model");
Object.defineProperty(exports, "CitizenProfileModel", { enumerable: true, get: function () { return CitizenProfile_model_1.CitizenProfileModel; } });
var LawyerProfile_model_1 = require("./LawyerProfile.model");
Object.defineProperty(exports, "LawyerProfileModel", { enumerable: true, get: function () { return LawyerProfile_model_1.LawyerProfileModel; } });
// Admin 
var Admin_model_1 = require("./Admin.model");
Object.defineProperty(exports, "AdminUserModel", { enumerable: true, get: function () { return Admin_model_1.AdminUserModel; } });
Object.defineProperty(exports, "AuditLogModel", { enumerable: true, get: function () { return Admin_model_1.AuditLogModel; } });
// Legal content 
var LegalModule_model_1 = require("./LegalModule.model");
Object.defineProperty(exports, "LegalTopicModel", { enumerable: true, get: function () { return LegalModule_model_1.LegalTopicModel; } });
Object.defineProperty(exports, "LegalModuleModel", { enumerable: true, get: function () { return LegalModule_model_1.LegalModuleModel; } });
var Enrollment_model_1 = require("./Enrollment.model");
Object.defineProperty(exports, "EnrollmentModel", { enumerable: true, get: function () { return Enrollment_model_1.EnrollmentModel; } });
Object.defineProperty(exports, "UserProgressModel", { enumerable: true, get: function () { return Enrollment_model_1.UserProgressModel; } });
var LegalAct_model_1 = require("./LegalAct.model");
Object.defineProperty(exports, "LegalActModel", { enumerable: true, get: function () { return LegalAct_model_1.LegalActModel; } });
Object.defineProperty(exports, "BookmarkModel", { enumerable: true, get: function () { return LegalAct_model_1.BookmarkModel; } });
var Certificate_model_1 = require("./Certificate.model");
Object.defineProperty(exports, "CertificateModel", { enumerable: true, get: function () { return Certificate_model_1.CertificateModel; } });
Object.defineProperty(exports, "DailyChallengeModel", { enumerable: true, get: function () { return Certificate_model_1.DailyChallengeModel; } });
Object.defineProperty(exports, "DailyChallengeAttemptModel", { enumerable: true, get: function () { return Certificate_model_1.DailyChallengeAttemptModel; } });
// Consultations 
var Consultation_model_1 = require("./Consultation.model");
Object.defineProperty(exports, "ConsultationModel", { enumerable: true, get: function () { return Consultation_model_1.ConsultationModel; } });
Object.defineProperty(exports, "LawyerRequestModel", { enumerable: true, get: function () { return Consultation_model_1.LawyerRequestModel; } });
var Message_model_1 = require("./Message.model");
Object.defineProperty(exports, "ConversationModel", { enumerable: true, get: function () { return Message_model_1.ConversationModel; } });
Object.defineProperty(exports, "MessageModel", { enumerable: true, get: function () { return Message_model_1.MessageModel; } });
// export { LawyerReviewModel, NotificationModel }   from './Notification.model';
// Activity 
var StudySession_model_1 = require("./StudySession.model");
Object.defineProperty(exports, "StudySessionModel", { enumerable: true, get: function () { return StudySession_model_1.StudySessionModel; } });
var Otp_model_1 = require("./Otp.model");
Object.defineProperty(exports, "OtpModel", { enumerable: true, get: function () { return Otp_model_1.OtpModel; } });
// Billing / Subscriptions 
var SubscriptionPlan_model_1 = require("./SubscriptionPlan.model");
Object.defineProperty(exports, "SubscriptionPlanModel", { enumerable: true, get: function () { return SubscriptionPlan_model_1.SubscriptionPlanModel; } });
var Subscription_model_1 = require("./Subscription.model");
Object.defineProperty(exports, "SubscriptionModel", { enumerable: true, get: function () { return Subscription_model_1.SubscriptionModel; } });
var BillingHistory_model_1 = require("./BillingHistory.model");
Object.defineProperty(exports, "BillingHistoryModel", { enumerable: true, get: function () { return BillingHistory_model_1.BillingHistoryModel; } });
__exportStar(require("./types/billing.types"), exports);
// Types & enums (re-exported for convenience) 
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map