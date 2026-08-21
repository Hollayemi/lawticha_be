import { Document, Model, Types } from 'mongoose';
import { IUser } from './types';
export interface IUserDocument extends Omit<IUser, '_id'>, Document {
    _id: Types.ObjectId;
    password?: string;
    refreshToken?: string;
    passwordChangedAt?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    fullName: string;
    matchPassword(entered: string): Promise<boolean>;
    signAccessToken(): string;
    signRefreshToken(): string;
    getPasswordResetToken(): string;
    getEmailVerificationToken(): string;
    changedPasswordAfter(jwtIat: number): boolean;
    toSafeObject(): Record<string, unknown>;
    awardXP(points: number): Promise<import('./CitizenProfile.model').ICitizenProfileDocument | null>;
}
export interface IUserModel extends Model<IUserDocument> {
    findByEmail(email: string): Promise<IUserDocument | null>;
    findByEmailWithPassword(email: string): Promise<IUserDocument | null>;
}
export declare const UserModel: IUserModel;
//# sourceMappingURL=User.model.d.ts.map