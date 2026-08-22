// EmailService.ts
import { createZeptoMailTransporter, getTransporter } from './transporter';
import { renderTemplate } from './templates';
import { EmailTemplateType, EmailTemplateParams } from './types';
import logger from '../../utils/logger';

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
    static async send<T extends EmailTemplateType>(
        to: string,
        template: T,
        params: EmailTemplateParams[T]
    ): Promise<void> {
        if (!to) {
            throw new Error('EmailService.send: recipient email is required');
        }

        const { subject, html, text } = renderTemplate(template, params);

        logger.info(`Sending email to ${to} with subject "${subject}" and template "${template}"`);

        const transporter = getTransporter();
        
        // Use the ZeptoMail wrapper
        const zeptoMailTransporter = createZeptoMailTransporter();

        await zeptoMailTransporter.sendMail({
            from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
            to,
            subject,
            html,
            text,
        });

        logger.info(`Email sent: template="${template}" to="${to}"`);
    }

    /**
     * Compatibility entry point used by NotificationController for
     * notification-driven emails (in-app notification that should also
     * go out as an email). If a specific template + params were resolved
     * by the caller, use those; otherwise fall back to a generic template
     * that mirrors the notification's title/body.
     */
    static async sendForNotification(opts: {
        to: string;
        emailTemplate?: { type: EmailTemplateType; params: Record<string, any> };
        fallback: { name?: string; title: string; body: string; clickUrl?: string };
    }): Promise<void> {
        const { to, emailTemplate, fallback } = opts;

        if (emailTemplate) {
            return this.send(to, emailTemplate.type, emailTemplate.params as any);
        }

        return this.send(to, EmailTemplateType.GENERIC_NOTIFICATION, fallback);
    }
}

export default EmailService;
export { EmailTemplateType };