import { ForgotPasswordParams, RenderedEmail } from '../types';
import { baseLayout } from './layout';

export function renderForgotPasswordEmail(params: ForgotPasswordParams): RenderedEmail {
    const { name, resetUrl, expiresInMinutes = 30 } = params;

    const html = baseLayout({
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
