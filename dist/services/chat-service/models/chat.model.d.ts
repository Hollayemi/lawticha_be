import { Types, Document } from 'mongoose';
import { IMessage, IConversation } from '../types/chat.types';
export interface IMessageDocument extends Omit<IMessage, '_id'>, Document {
    _id: Types.ObjectId;
}
export declare const ChatMessageModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
export interface IConversationDocument extends Omit<IConversation, '_id'>, Document {
    _id: Types.ObjectId;
}
export declare const ChatConversationModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=chat.model.d.ts.map