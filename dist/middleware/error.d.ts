import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    status: string;
    code: string;
    isOperational: boolean;
    constructor(message: string, statusCode: number, code?: string);
}
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => Promise<any>;
export interface AppResponse extends Response {
    data: (data: unknown, message?: string, statusCode?: number) => Response;
    success: (message?: string, statusCode?: number) => Response;
    fail: (message: string, statusCode?: number) => Response;
}
export declare const extendResponse: (_req: Request, res: Response, next: NextFunction) => void;
export declare const errorHandler: (err: any, _req: Request, res: Response, _next: NextFunction) => void;
export declare const handle404: (req: Request, res: Response) => void;
//# sourceMappingURL=error.d.ts.map