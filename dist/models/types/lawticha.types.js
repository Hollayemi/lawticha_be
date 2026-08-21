"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditAction = exports.ConsultationType = exports.LawyerBadge = exports.VerificationStatus = exports.LawyerStatus = exports.CitizenStatus = exports.LawTichaRole = void 0;
//  Enums 
var LawTichaRole;
(function (LawTichaRole) {
    LawTichaRole["SUPER_ADMIN"] = "super_admin";
    LawTichaRole["ADMIN"] = "admin";
    LawTichaRole["LAWYER"] = "lawyer";
    LawTichaRole["CITIZEN"] = "citizen";
})(LawTichaRole || (exports.LawTichaRole = LawTichaRole = {}));
var CitizenStatus;
(function (CitizenStatus) {
    CitizenStatus["ACTIVE"] = "active";
    CitizenStatus["INACTIVE"] = "inactive";
    CitizenStatus["WARNING"] = "warning";
})(CitizenStatus || (exports.CitizenStatus = CitizenStatus = {}));
var LawyerStatus;
(function (LawyerStatus) {
    LawyerStatus["ACTIVE"] = "active";
    LawyerStatus["INACTIVE"] = "inactive";
    LawyerStatus["PENDING"] = "pending";
})(LawyerStatus || (exports.LawyerStatus = LawyerStatus = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "pending";
    VerificationStatus["APPROVED"] = "approved";
    VerificationStatus["REJECTED"] = "rejected";
    VerificationStatus["INFO_REQUESTED"] = "info_requested";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
var LawyerBadge;
(function (LawyerBadge) {
    LawyerBadge["VERIFIED"] = "Verified";
    LawyerBadge["TOP_RATED"] = "Top Rated";
    LawyerBadge["RESPONSIVE"] = "Responsive";
})(LawyerBadge || (exports.LawyerBadge = LawyerBadge = {}));
var ConsultationType;
(function (ConsultationType) {
    ConsultationType["MESSAGE"] = "message";
    ConsultationType["CALL"] = "call";
    ConsultationType["VIDEO"] = "video";
})(ConsultationType || (exports.ConsultationType = ConsultationType = {}));
//  Audit Log 
var AuditAction;
(function (AuditAction) {
    AuditAction["CITIZEN_STATUS_CHANGED"] = "citizen_status_changed";
    AuditAction["CITIZEN_EMAIL_SENT"] = "citizen_email_sent";
    AuditAction["LAWYER_STATUS_CHANGED"] = "lawyer_status_changed";
    AuditAction["LAWYER_EMAIL_SENT"] = "lawyer_email_sent";
    AuditAction["VERIFICATION_APPROVED"] = "verification_approved";
    AuditAction["VERIFICATION_REJECTED"] = "verification_rejected";
    AuditAction["VERIFICATION_INFO_REQUEST"] = "verification_info_request";
    AuditAction["DOCUMENT_VERIFIED"] = "document_verified";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
//# sourceMappingURL=lawticha.types.js.map