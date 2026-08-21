import { Response } from 'express';
import { Types } from 'mongoose';
import { UserRole } from '../models/types';
export interface JwtPayload {
    id: string;
    role: UserRole;
}
export declare const signAccessToken: (id: Types.ObjectId, role: UserRole) => string;
export declare const signRefreshToken: (id: Types.ObjectId, role: UserRole) => string;
export declare const verifyToken: (token: string, secret: string) => JwtPayload;
export declare const sendTokenResponse: (res: Response, userId: Types.ObjectId, role: UserRole, payload: Record<string, unknown>, statusCode?: number) => Response;
//# sourceMappingURL=jwt.helper.d.ts.map