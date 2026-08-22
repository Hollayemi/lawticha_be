//  Email template registry types 
// Every transactional/templated email the platform can send is declared here.
// Add a new type to the enum + its param shape to EmailTemplateParams, then
// add a matching renderer in ./templates and register it in ./templates/index.ts.
// TypeScript will then force callers of EmailService.send() to pass the right params.

export enum EmailTemplateType {
    WELCOME = 'welcome',
    VERIFY_EMAIL = 'verify_email',
    FORGOT_PASSWORD = 'forgot_password',
    PASSWORD_CHANGED = 'password_changed',
    GENERIC_NOTIFICATION = 'generic_notification',
}

export interface WelcomeEmailParams {
    name: string;
    dashboardUrl?: string;
}

export interface VerifyEmailParams {
    name: string;
    verifyUrl: string;
    expiresInHours?: number;
}

export interface ForgotPasswordParams {
    name: string;
    resetUrl: string;
    expiresInMinutes?: number;
}

export interface PasswordChangedParams {
    name: string;
    supportEmail?: string;
}

export interface GenericNotificationParams {
    name?: string;
    title: string;
    body: string;
    clickUrl?: string;
}

//  Maps each template type to the params it requires 

export interface EmailTemplateParams {
    [EmailTemplateType.WELCOME]: WelcomeEmailParams;
    [EmailTemplateType.VERIFY_EMAIL]: VerifyEmailParams;
    [EmailTemplateType.FORGOT_PASSWORD]: ForgotPasswordParams;
    [EmailTemplateType.PASSWORD_CHANGED]: PasswordChangedParams;
    [EmailTemplateType.GENERIC_NOTIFICATION]: GenericNotificationParams;
}

export interface RenderedEmail {
    subject: string;
    html: string;
    text?: string;
}

export type EmailTemplateRenderer<T extends EmailTemplateType> = (
    params: EmailTemplateParams[T]
) => RenderedEmail;

// A single "envelope" describing what to send and to whom.
// This is what gets passed around by NotificationController / any service.
export interface EmailJob<T extends EmailTemplateType = EmailTemplateType> {
    to: string;
    template: T;
    params: EmailTemplateParams[T];
}
