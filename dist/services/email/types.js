"use strict";
//  Email template registry types 
// Every transactional/templated email the platform can send is declared here.
// Add a new type to the enum + its param shape to EmailTemplateParams, then
// add a matching renderer in ./templates and register it in ./templates/index.ts.
// TypeScript will then force callers of EmailService.send() to pass the right params.
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailTemplateType = void 0;
var EmailTemplateType;
(function (EmailTemplateType) {
    EmailTemplateType["WELCOME"] = "welcome";
    EmailTemplateType["VERIFY_EMAIL"] = "verify_email";
    EmailTemplateType["FORGOT_PASSWORD"] = "forgot_password";
    EmailTemplateType["PASSWORD_CHANGED"] = "password_changed";
    EmailTemplateType["GENERIC_NOTIFICATION"] = "generic_notification";
})(EmailTemplateType || (exports.EmailTemplateType = EmailTemplateType = {}));
//# sourceMappingURL=types.js.map