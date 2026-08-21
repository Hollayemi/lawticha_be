import { Router } from 'express';
import { ChatService } from '../services/ChatService';
import { IConversation } from '../types/chat.types';
export interface ChatRouterOptions {
    /**
     * App-specific hook to enrich a list of conversations before they're sent
     * to the client — e.g. attaching consultation/case info so the frontend
     * can render "Open <topic> case" instead of a generic participant name.
     * Left undefined, conversations are returned as-is (fully decoupled).
     */
    enrichConversations?: (conversations: IConversation[]) => Promise<any[]>;
}
export declare function createChatRouter(chat: ChatService, options?: ChatRouterOptions): Router;
//# sourceMappingURL=chat.router.d.ts.map