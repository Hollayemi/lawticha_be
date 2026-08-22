import { EmailTemplateType, EmailTemplateParams, RenderedEmail } from '../types';
export declare const templateRegistry: {
    [K in EmailTemplateType]: (params: EmailTemplateParams[K]) => RenderedEmail;
};
export declare function renderTemplate<T extends EmailTemplateType>(type: T, params: EmailTemplateParams[T]): RenderedEmail;
//# sourceMappingURL=index.d.ts.map