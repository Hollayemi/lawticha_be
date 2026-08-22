import { WelcomeEmailParams, RenderedEmail } from '../types';
import { baseLayout } from './layout';

export function renderWelcomeEmail(params: WelcomeEmailParams): RenderedEmail {
    const { name, dashboardUrl } = params;

    const html = baseLayout({
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
