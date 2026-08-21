import { Request, Response, NextFunction } from 'express';
import { IUserDocument } from '../models/User.model';
import { UserRole } from '../models/types';
declare global {
    namespace Express {
        interface Request {
            user?: IUserDocument;
        }
    }
}
export declare const protect: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const protectBoth: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const authorizeRoles: (...roles: UserRole[]) => (req: Request, _res: Response, next: NextFunction) => void;
/** Admin only */
export declare const adminOnly: (req: Request, _res: Response, next: NextFunction) => void;
/** Admin or Lawyer */
export declare const adminOrLawyer: (req: Request, _res: Response, next: NextFunction) => void;
/** Verified lawyer only,  also checks lawyerProfile.verificationStatus */
export declare const verifiedLawyerOnly: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/** Citizen only */
export declare const citizenOnly: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map