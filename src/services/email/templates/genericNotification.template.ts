import { GenericNotificationParams, RenderedEmail } from '../types';
import { baseLayout } from './layout';

// Fallback used when NotificationController sends an email for a notification
// that has no dedicated template (options.emailTemplate not provided) -
// it just mirrors the in-app title/body.
export function renderGenericNotificationEmail(params: GenericNotificationParams): RenderedEmail {
    const { name, title, body, clickUrl } = params;

    const html = baseLayout({
        preheader: title,
        heading: title,
        bodyHtml: `<p>${name ? `Hi ${name},` : ''} ${body}</p>`,
        ctaLabel: clickUrl ? 'View Details' : undefined,
        ctaUrl: clickUrl,
    });

    return {
        subject: title,
        html,
        text: `${body}${clickUrl ? ` ${clickUrl}` : ''}`,
    };
}
