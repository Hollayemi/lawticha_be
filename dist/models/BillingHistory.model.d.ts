import { Document, Types } from 'mongoose';
import { IBillingHistory } from './types/billing.types';
export interface IBillingHistoryDocument extends Omit<IBillingHistory, '_id'>, Document {
    _id: Types.ObjectId;
}
export declare const BillingHistoryModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=BillingHistory.model.d.ts.map