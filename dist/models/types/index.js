"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRole = exports.AuditAction = exports.LawyerBadge = exports.VerificationStatus = exports.ConsultMode = exports.UserRole = void 0;
// Enums 
var UserRole;
(function (UserRole) {
    UserRole["CITIZEN"] = "citizen";
    UserRole["LAWYER"] = "lawyer";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var ConsultMode;
(function (ConsultMode) {
    ConsultMode["MESSAGE"] = "message";
    ConsultMode["CALL"] = "call";
    ConsultMode["VIDEO"] = "video";
})(ConsultMode || (exports.ConsultMode = ConsultMode = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "pending";
    VerificationStatus["INFO_NEEDED"] = "info_requested";
    VerificationStatus["CREDENTIAL_CHECK"] = "credential_check";
    VerificationStatus["TRAINING"] = "training";
    VerificationStatus["ASSESSMENT"] = "assessment";
    VerificationStatus["VERIFIED"] = "approved";
    VerificationStatus["REJECTED"] = "rejected";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
var LawyerBadge;
(function (LawyerBadge) {
    LawyerBadge["VERIFIED"] = "Verified Lawyer";
    LawyerBadge["TOP_RATED"] = "Top Rated";
    LawyerBadge["RESPONSIVE"] = "Responsive";
})(LawyerBadge || (exports.LawyerBadge = LawyerBadge = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction["LOGIN"] = "login";
    AuditAction["LOGOUT"] = "logout";
    AuditAction["PASSWORD_CHANGE"] = "password_change";
    AuditAction["CITIZEN_STATUS_CHANGED"] = "citizen_status_changed";
    AuditAction["CITIZEN_EMAIL_SENT"] = "email_sent";
    // Admin management
    AuditAction["ADMIN_CREATED"] = "admin_created";
    AuditAction["ADMIN_UPDATED"] = "admin_updated";
    AuditAction["ADMIN_ACTIVATED"] = "admin_activated";
    AuditAction["ADMIN_DEACTIVATED"] = "admin_deactivated";
    AuditAction["ADMIN_REMOVED"] = "admin_removed";
    AuditAction["ROLE_CHANGED"] = "role_changed";
    // Module actions
    AuditAction["MODULE_CREATED"] = "module_created";
    AuditAction["MODULE_UPDATED"] = "module_updated";
    AuditAction["MODULE_DELETED"] = "module_deleted";
    AuditAction["MODULE_PUBLISHED"] = "module_published";
    // Topic actions
    AuditAction["TOPIC_CREATED"] = "topic_created";
    AuditAction["TOPIC_UPDATED"] = "topic_updated";
    AuditAction["TOPIC_DELETED"] = "topic_deleted";
    // Content actions
    AuditAction["CONTENT_UPLOADED"] = "content_uploaded";
    AuditAction["CONTENT_DELETED"] = "content_deleted";
    // User actions
    AuditAction["CITIZEN_SUSPENDED"] = "citizen_suspended";
    AuditAction["CITIZEN_ACTIVATED"] = "citizen_activated";
    AuditAction["LAWYER_VERIFIED"] = "lawyer_verified";
    AuditAction["LAWYER_REJECTED"] = "lawyer_rejected";
    // Comment actions
    AuditAction["COMMENT_RESOLVED"] = "comment_resolved";
    AuditAction["COMMENT_DELETED"] = "comment_deleted";
    // Subscription / billing actions
    AuditAction["PLAN_CREATED"] = "plan_created";
    AuditAction["PLAN_UPDATED"] = "plan_updated";
    AuditAction["PLAN_DELETED"] = "plan_deleted";
    AuditAction["SUBSCRIPTION_STATUS_CHANGED"] = "subscription_status_changed";
    // lawyer actions
    AuditAction["VERIFICATION_APPROVED"] = "verification_approved";
    AuditAction["VERIFICATION_INFO_REQUEST"] = "verification_info_request";
    AuditAction["VERIFICATION_REJECTED"] = "verification_rejected";
    AuditAction["DOCUMENT_VERIFIED"] = "document_verified";
    AuditAction["LAWYER_STATUS_CHANGED"] = "lawyer_status_changed";
    // library
    AuditAction["BOOK_CREATED"] = "book_created";
    AuditAction["BOOK_UPDATED"] = "book_updated";
    AuditAction["BOOK_DELETED"] = "book_deleted";
    AuditAction["ORDER_UPDATED"] = "order_updated";
    // consultation
    AuditAction["CONSULTATION_STATUS_CHANGED"] = "consultation_status_changed";
    AuditAction["DISPUTE_RESOLVED"] = "dispute_resolved";
    AuditAction["CONSULTATION_FLAGGED"] = "consultation_flagged";
    AuditAction["REFUND_APPROVED"] = "refund_approved";
    AuditAction["REFUND_REJECTED"] = "refund_rejected";
    AuditAction["LAWYER_WARNING_SENT"] = "lawyer_warning_sent";
    AuditAction["BULK_ACTION"] = "bulk_action";
    AuditAction["MATCH_ASSIGNED"] = "match_assigned";
    AuditAction["MATCH_AUTO_ASSIGNED"] = "match_auto_assigned";
    AuditAction["MATCH_UPDATED"] = "match_updated";
    AuditAction["MATCH_ACCEPTED"] = "match_accepted";
    AuditAction["MATCH_MESSAGE_SENT"] = "match_message_sent";
    AuditAction["MATCH_CALL_SCHEDULED"] = "match_call_scheduled";
    AuditAction["MATCH_DOCUMENT_ADDED"] = "match_document_added";
    AuditAction["MATCH_RECOMMENDED"] = "match_recommended";
    AuditAction["MATCH_LAWYER_SELECTED"] = "match_lawyer_selected";
    AuditAction["MATCH_EXPIRED"] = "match_expired";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var AdminRole;
(function (AdminRole) {
    AdminRole["SUPER_ADMIN"] = "super_admin";
    AdminRole["ADMIN"] = "admin";
    AdminRole["INSTRUCTOR"] = "instructor";
    AdminRole["MODERATOR"] = "moderator";
    AdminRole["ANALYST"] = "analyst";
    AdminRole["SUPPORT"] = "support";
})(AdminRole || (exports.AdminRole = AdminRole = {}));
//# sourceMappingURL=index.js.map