import { Request, Response, NextFunction } from 'express';
export declare const getAllNotifications: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const getNotificationById: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const createNotification: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const updateNotification: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const sendNotification: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const testNotification: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const estimateRecipients: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const deleteNotification: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const trackDelivered: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const trackClicked: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const getStatistics: (req: Request, res: Response, next: NextFunction) => Promise<any>;
//# sourceMappingURL=pushNotificationController.d.ts.map