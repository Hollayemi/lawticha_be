export declare enum EmailTemplateType {
    WELCOME = "welcome",
    VERIFY_EMAIL = "verify_email",
    FORGOT_PASSWORD = "forgot_password",
    PASSWORD_CHANGED = "password_changed",
    GENERIC_NOTIFICATION = "generic_notification"
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
export type EmailTemplateRenderer<T extends EmailTemplateType> = (params: EmailTemplateParams[T]) => RenderedEmail;
export interface EmailJob<T extends EmailTemplateType = EmailTemplateType> {
    to: string;
    template: T;
    params: EmailTemplateParams[T];
}
//# sourceMappingURL=types.d.ts.map