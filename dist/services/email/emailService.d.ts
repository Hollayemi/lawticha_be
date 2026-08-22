import { EmailTemplateType, EmailTemplateParams } from './types';
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
declare class EmailService {
    static send<T extends EmailTemplateType>(to: string, template: T, params: EmailTemplateParams[T]): Promise<void>;
    /**
     * Compatibility entry point used by NotificationController for
     * notification-driven emails (in-app notification that should also
     * go out as an email). If a specific template + params were resolved
     * by the caller, use those; otherwise fall back to a generic template
     * that mirrors the notification's title/body.
     */
    static sendForNotification(opts: {
        to: string;
        emailTemplate?: {
            type: EmailTemplateType;
            params: Record<string, any>;
        };
        fallback: {
            name?: string;
            title: string;
            body: string;
            clickUrl?: string;
        };
    }): Promise<void>;
}
export default EmailService;
export { EmailTemplateType };
//# sourceMappingURL=emailService.d.ts.map