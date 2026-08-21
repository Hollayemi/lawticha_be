import { Document, Types } from 'mongoose';
import { IAdminUser, IAuditLog } from './types';
export interface IAdminUserDocument extends Omit<IAdminUser, '_id'>, Document {
    _id: Types.ObjectId;
}
export declare const AdminUserModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
export interface IAuditLogDocument extends Omit<IAuditLog, '_id'>, Document {
    _id: Types.ObjectId;
}
export declare const AuditLogModel: import("mongoose").Model<any, {}, {}, {}, any, any>;
//# sourceMappingURL=Admin.model.d.ts.map