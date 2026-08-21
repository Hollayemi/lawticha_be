import { Request, Response, NextFunction } from 'express';
import { LawTichaRole } from '../models/types/lawticha.types';
declare global {
    namespace Express {
        interface Request {
            admin?: {
                id: string;
                name: string;
                email: string;
                role: LawTichaRole.SUPER_ADMIN | LawTichaRole.ADMIN;
            };
        }
    }
}
export declare const protectAdmin: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const requireSuperAdmin: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=adminAuth.d.ts.map