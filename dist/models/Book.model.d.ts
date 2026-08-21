import { Types, Document } from 'mongoose';
import { IBook } from './types/library.types';
export interface IBookDocument extends Omit<IBook, '_id'>, Document {
    _id: Types.ObjectId;
    incrementDownloadCount(): Promise<void>;
    incrementOrderCount(quantity: number): Promise<void>;
    updateRating(newRating: number): Promise<void>;
}
export declare const BookModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=Book.model.d.ts.map