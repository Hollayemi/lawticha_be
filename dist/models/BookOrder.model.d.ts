import { Types, Document } from 'mongoose';
import { IBookOrder, OrderStatus } from './types/library.types';
export interface IBookOrderDocument extends Omit<IBookOrder, '_id'>, Document {
    _id: Types.ObjectId;
    updateStatus(status: OrderStatus, trackingNumber?: string): Promise<void>;
}
export declare const BookOrderModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=BookOrder.model.d.ts.map