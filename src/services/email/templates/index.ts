import { EmailTemplateType, EmailTemplateParams, RenderedEmail } from '../types';
import { renderWelcomeEmail } from './welcome.template';
import { renderVerifyEmail } from './verifyEmail.template';
import { renderForgotPasswordEmail } from './forgotPassword.template';
import { renderPasswordChangedEmail } from './passwordChanged.template';
import { renderGenericNotificationEmail } from './genericNotification.template';

// Every entry here must exist for every value in EmailTemplateType -
// TypeScript enforces that below via the `satisfies`-style check.
export const templateRegistry: {
    [K in EmailTemplateType]: (params: EmailTemplateParams[K]) => RenderedEmail;
} = {
    [EmailTemplateType.WELCOME]: renderWelcomeEmail,
    [EmailTemplateType.VERIFY_EMAIL]: renderVerifyEmail,
    [EmailTemplateType.FORGOT_PASSWORD]: renderForgotPasswordEmail,
    [EmailTemplateType.PASSWORD_CHANGED]: renderPasswordChangedEmail,
    [EmailTemplateType.GENERIC_NOTIFICATION]: renderGenericNotificationEmail,
};

export function renderTemplate<T extends EmailTemplateType>(
    type: T,
    params: EmailTemplateParams[T]
): RenderedEmail {
    const renderer = templateRegistry[type];
    return renderer(params);
}
