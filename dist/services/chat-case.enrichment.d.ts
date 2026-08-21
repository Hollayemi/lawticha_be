import { Types } from 'mongoose';
export interface CaseInfo {
    consultationId: string;
    title: string;
    status: string;
    mode: string;
    receiptId?: string;
    detail?: string;
}
type ConversationLike = {
    contextType?: string;
    contextId?: Types.ObjectId | string;
};
export declare function attachCaseInfo<T extends ConversationLike>(conversations: T[]): Promise<(T & {
    caseInfo: CaseInfo | null;
})[]>;
export declare function attachCaseInfoSingle<T extends ConversationLike>(conversation: T): Promise<T & {
    caseInfo: CaseInfo | null;
}>;
export {};
//# sourceMappingURL=chat-case.enrichment.d.ts.map