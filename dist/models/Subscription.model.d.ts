import { Document, Model, Types } from 'mongoose';
import { ISubscription } from './types/billing.types';
export interface ISubscriptionDocument extends Omit<ISubscription, '_id'>, Document {
    _id: Types.ObjectId;
    isCurrentlyActive(): boolean;
}
export interface ISubscriptionModel extends Model<ISubscriptionDocument> {
    findActiveForUser(userId: Types.ObjectId | string): Promise<ISubscriptionDocument | null>;
}
export declare const SubscriptionModel: ISubscriptionModel;
//# sourceMappingURL=Subscription.model.d.ts.map