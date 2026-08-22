"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateRegistry = void 0;
exports.renderTemplate = renderTemplate;
const types_1 = require("../types");
const welcome_template_1 = require("./welcome.template");
const verifyEmail_template_1 = require("./verifyEmail.template");
const forgotPassword_template_1 = require("./forgotPassword.template");
const passwordChanged_template_1 = require("./passwordChanged.template");
const genericNotification_template_1 = require("./genericNotification.template");
// Every entry here must exist for every value in EmailTemplateType -
// TypeScript enforces that below via the `satisfies`-style check.
exports.templateRegistry = {
    [types_1.EmailTemplateType.WELCOME]: welcome_template_1.renderWelcomeEmail,
    [types_1.EmailTemplateType.VERIFY_EMAIL]: verifyEmail_template_1.renderVerifyEmail,
    [types_1.EmailTemplateType.FORGOT_PASSWORD]: forgotPassword_template_1.renderForgotPasswordEmail,
    [types_1.EmailTemplateType.PASSWORD_CHANGED]: passwordChanged_template_1.renderPasswordChangedEmail,
    [types_1.EmailTemplateType.GENERIC_NOTIFICATION]: genericNotification_template_1.renderGenericNotificationEmail,
};
function renderTemplate(type, params) {
    const renderer = exports.templateRegistry[type];
    return renderer(params);
}
//# sourceMappingURL=index.js.map