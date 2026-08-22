import { PasswordChangedParams, RenderedEmail } from '../types';
import { baseLayout } from './layout';

export function renderPasswordChangedEmail(params: PasswordChangedParams): RenderedEmail {
    const { name, supportEmail } = params;

    const html = baseLayout({
        preheader: 'Your LawTicha password was changed.',
        heading: `Password changed, ${name}`,
        bodyHtml: `
            <p>This is a confirmation that your LawTicha account password was just changed.</p>
            <p>If you made this change, no action is needed.${supportEmail ? ` If you didn't, please contact us immediately at <a href="mailto:${supportEmail}">${supportEmail}</a>.` : ` If you didn't, please contact support immediately.`}</p>
        `,
    });

    return {
        subject: 'Your LawTicha password was changed',
        html,
        text: `Hi ${name}, your password was just changed. If this wasn't you, contact support${supportEmail ? ` at ${supportEmail}` : ''} immediately.`,
    };
}
