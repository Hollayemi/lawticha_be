import { Document, Types } from 'mongoose';
import { ISubscriptionPlan } from './types/billing.types';
export interface ISubscriptionPlanDocument extends Omit<ISubscriptionPlan, '_id'>, Document {
    _id: Types.ObjectId;
}
export declare const SubscriptionPlanModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=SubscriptionPlan.model.d.ts.map