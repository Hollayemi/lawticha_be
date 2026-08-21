import { Request, Response, NextFunction } from 'express';
export declare const getMyProfileHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const updateMyProfileHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const submitVerificationHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const setAvailabilityHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const listLawyersHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const getLawyerStatsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const getLawyerHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const advanceVerificationHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const rejectVerificationHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const verifyDocumentHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const updateLawyerStatusHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const emailLawyerHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /api/v1/marketplace/stats
 * Get marketplace statistics for hero section
 */
export declare const getMarketplaceStatsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /api/v1/marketplace/states
 * Get unique states for filter dropdown
 */
export declare const getMarketplaceStatesHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /api/v1/marketplace/specialisms
 * Get specialisms with counts for filter
 */
export declare const getMarketplaceSpecialismsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /api/v1/marketplace/filter-counts
 * Get filter counts for sidebar
 */
export declare const getFilterCountsHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /api/v1/marketplace/lawyers
 * Get paginated list of marketplace lawyers with filters
 */
export declare const getMarketplaceLawyersHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /api/v1/marketplace/lawyers/:scnNumber
 * Get lawyer by SCN number
 */
export declare const getLawyerByScnNumberHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * POST /api/v1/marketplace/consultations
 * Book a consultation with a lawyer
 */
export declare const bookConsultationHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * POST /api/v1/marketplace/match-requests
 * Request a lawyer match
 */
export declare const requestLawyerMatchHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /api/v1/marketplace/lawyers/:scnNumber/availability
 * Get lawyer availability slots
 */
export declare const getLawyerAvailabilityHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * POST /api/v1/marketplace/lawyers/:scnNumber/reviews
 * Submit a review for a lawyer
 */
export declare const submitReviewHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>;
//# sourceMappingURL=lawyer.controller.d.ts.map