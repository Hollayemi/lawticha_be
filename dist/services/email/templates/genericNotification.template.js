"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderGenericNotificationEmail = renderGenericNotificationEmail;
const layout_1 = require("./layout");
// Fallback used when NotificationController sends an email for a notification
// that has no dedicated template (options.emailTemplate not provided) -
// it just mirrors the in-app title/body.
function renderGenericNotificationEmail(params) {
    const { name, title, body, clickUrl } = params;
    const html = (0, layout_1.baseLayout)({
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
//# sourceMappingURL=genericNotification.template.js.map