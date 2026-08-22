"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderWelcomeEmail = renderWelcomeEmail;
const layout_1 = require("./layout");
function renderWelcomeEmail(params) {
    const { name, dashboardUrl } = params;
    const html = (0, layout_1.baseLayout)({
        preheader: `Welcome to LawTicha, ${name}!`,
        heading: `Welcome, ${name} 🎉`,
        bodyHtml: `
            <p>We're glad to have you on LawTicha. Your account is ready to go.</p>
            <p>Explore legal resources, book consultations, and start learning whenever you're ready.</p>
        `,
        ctaLabel: dashboardUrl ? 'Go to Dashboard' : undefined,
        ctaUrl: dashboardUrl,
    });
    return {
        subject: `Welcome to LawTicha, ${name}!`,
        html,
        text: `Welcome, ${name}! Your LawTicha account is ready.${dashboardUrl ? ` Go to your dashboard: ${dashboardUrl}` : ''}`,
    };
}
//# sourceMappingURL=welcome.template.js.map