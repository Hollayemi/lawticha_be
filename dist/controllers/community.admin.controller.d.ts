import { Request, Response, NextFunction } from 'express';
export declare const listAllPostsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const getPostDetailsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const approvePostHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const rejectPostHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const pinPostHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const promotePostHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const demotePostHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const listCommentsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const removeCommentHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const restoreCommentHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const listReportsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const resolveReportHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const getCommunityStatsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const getActivityReportHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const bulkModeratePostsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
//# sourceMappingURL=community.admin.controller.d.ts.map