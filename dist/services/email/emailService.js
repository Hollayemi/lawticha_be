"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailTemplateType = void 0;
// EmailService.ts
const transporter_1 = require("./transporter");
const templates_1 = require("./templates");
const types_1 = require("./types");
Object.defineProperty(exports, "EmailTemplateType", { enumerable: true, get: function () { return types_1.EmailTemplateType; } });
const logger_1 = __importDefault(require("../../utils/logger"));
const FROM_ADDRESS = process.env.SMTP_EMAIL;
const FROM_NAME = process.env.SMTP_FROM_NAME || 'LawTicha';
/**
 * EmailService
 * -------------
 * Single place responsible for actually delivering an email. It knows
 * nothing about notifications, users, or in-app delivery - it just takes
 * a recipient, a template type, and that template's params, renders the
 * markup, and sends it.
 *
 * Delivery itself goes through Zoho ZeptoMail's HTTPS API (see
 * ./transporter.ts) rather than raw SMTP, since the droplet this runs on
 * blocks outbound SMTP ports 25/465/587.
 *
 * Usage:
 *   await EmailService.send(user.email, EmailTemplateType.FORGOT_PASSWORD, {
 *     name: user.firstName,
 *     resetUrl,
 *   });
 *
 * Because `send` is generic over EmailTemplateType, TypeScript enforces
 * that the `params` you pass match the template you picked - you can't
 * send WELCOME with FORGOT_PASSWORD's params by mistake.
 */
class EmailService {
    static async send(to, template, params) {
        if (!to) {
            throw new Error('EmailService.send: recipient email is required');
        }
        const { subject, html, text } = (0, templates_1.renderTemplate)(template, params);
        logger_1.default.info(`Sending email to ${to} with subject "${subject}" and template "${template}"`);
        const transporter = (0, transporter_1.getTransporter)();
        // Use the ZeptoMail wrapper
        const zeptoMailTransporter = (0, transporter_1.createZeptoMailTransporter)();
        await zeptoMailTransporter.sendMail({
            from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
            to,
            subject,
            html,
            text,
        });
        logger_1.default.info(`Email sent: template="${template}" to="${to}"`);
    }
    /**
     * Compatibility entry point used by NotificationController for
     * notification-driven emails (in-app notification that should also
     * go out as an email). If a specific template + params were resolved
     * by the caller, use those; otherwise fall back to a generic template
     * that mirrors the notification's title/body.
     */
    static async sendForNotification(opts) {
        const { to, emailTemplate, fallback } = opts;
        if (emailTemplate) {
            return this.send(to, emailTemplate.type, emailTemplate.params);
        }
        return this.send(to, types_1.EmailTemplateType.GENERIC_NOTIFICATION, fallback);
    }
}
exports.default = EmailService;
//# sourceMappingURL=emailService.js.map