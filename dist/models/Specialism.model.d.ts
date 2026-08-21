import mongoose, { Document } from 'mongoose';
export interface ISpecialism extends Document {
    name: string;
    displayName: string;
    group: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ISpecialism, {}, {}, {}, mongoose.Document<unknown, {}, ISpecialism, {}, {}> & ISpecialism & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Specialism.model.d.ts.map