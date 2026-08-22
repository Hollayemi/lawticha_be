import { VerifyEmailParams, RenderedEmail } from '../types';
import { baseLayout } from './layout';

export function renderVerifyEmail(params: VerifyEmailParams): RenderedEmail {
    const { name, verifyUrl, expiresInHours = 24 } = params;

    const html = baseLayout({
        preheader: 'Confirm your email address to activate your LawTicha account.',
        heading: `Verify your email, ${name}`,
        bodyHtml: `
            <p>Thanks for signing up. Please confirm this is your email address so we can activate your account.</p>
            <p>This link expires in ${expiresInHours} hour${expiresInHours === 1 ? '' : 's'}.</p>
        `,
        ctaLabel: 'Verify Email',
        ctaUrl: verifyUrl,
    });

    return {
        subject: 'Verify your LawTicha email address',
        html,
        text: `Hi ${name}, verify your email: ${verifyUrl} (expires in ${expiresInHours}h)`,
    };
}
