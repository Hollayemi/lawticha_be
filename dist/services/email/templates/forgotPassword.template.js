"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderForgotPasswordEmail = renderForgotPasswordEmail;
const layout_1 = require("./layout");
function renderForgotPasswordEmail(params) {
    const { name, resetUrl, expiresInMinutes = 30 } = params;
    const html = (0, layout_1.baseLayout)({
        preheader: 'Reset your LawTicha password.',
        heading: `Reset your password, ${name}`,
        bodyHtml: `
            <p>We received a request to reset your password. Click the button below to choose a new one.</p>
            <p>This link expires in ${expiresInMinutes} minutes. If you didn't request this, you can ignore this email — your password won't change.</p>
        `,
        ctaLabel: 'Reset Password',
        ctaUrl: resetUrl,
    });
    return {
        subject: 'Reset your LawTicha password',
        html,
        text: `Hi ${name}, reset your password: ${resetUrl} (expires in ${expiresInMinutes} minutes)`,
    };
}
//# sourceMappingURL=forgotPassword.template.js.map