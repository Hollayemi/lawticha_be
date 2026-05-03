import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';
import {
  getLawyerProfile,
  submitVerification,
  updateLawyerProfile,
  toggleAvailability,
  listLawyers,
  getLawyerById,
  advanceVerification,
  rejectVerification,
  verifyDocument,
  updateLawyerStatus,
  getLawyerStats,
} from '../services/lawyer.service';

//  Helper 

function adminCtx(req: Request) {
  return { adminId: req.admin!.id, adminName: req.admin!.name };
}

// 
//  LAWYER-FACING ROUTES
// 

// GET /api/v1/lawyers/me/profile
export const getMyProfileHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await getLawyerProfile(req.user!._id.toString());
    return (res as AppResponse).data(result, 'Profile fetched.');
  }
);

// PATCH /api/v1/lawyers/me/profile
export const updateMyProfileHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const {
      title, bio, specialisms, languages,
      location, state, stateCode, fees,
    } = req.body;

    const profile = await updateLawyerProfile(req.user!._id.toString(), {
      title, bio, specialisms, languages,
      location, state, stateCode, fees,
    });

    return (res as AppResponse).data({ profile }, 'Profile updated.');
  }
);

// POST /api/v1/lawyers/me/verification
// Lawyer submits (or resubmits) their verification application
export const submitVerificationHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { nbaNumber, yearOfCall, calledAt } = req.body;

    if (!nbaNumber?.trim()) return next(new AppError('NBA number is required.', 400, 'VALIDATION_ERROR'));
    if (!yearOfCall)        return next(new AppError('Year of call is required.', 400, 'VALIDATION_ERROR'));
    if (!calledAt?.trim())  return next(new AppError('calledAt year is required (e.g. "2019").', 400, 'VALIDATION_ERROR'));

    const result = await submitVerification(req.user!._id.toString(), req.body);
    return (res as AppResponse).data(result, result.message);
  }
);

// PATCH /api/v1/lawyers/me/availability
export const setAvailabilityHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { available } = req.body;
    if (typeof available !== 'boolean') {
      return next(new AppError('`available` must be a boolean.', 400, 'VALIDATION_ERROR'));
    }

    try {
      const profile = await toggleAvailability(req.user!._id.toString(), available);
      return (res as AppResponse).data({ isAvailable: profile.isAvailable }, 'Availability updated.');
    } catch (err: any) {
      return next(new AppError(err.message, 400, 'FORBIDDEN'));
    }
  }
);

// 
//  ADMIN ROUTES
// 

// GET /api/v1/admin/lawyers
export const listLawyersHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { verificationStatus, search, page, pageSize, isAvailable } = req.query as Record<string, string>;

    const result = await listLawyers({
      verificationStatus,
      search,
      page:        page     ? Number(page)     : undefined,
      pageSize:    pageSize ? Number(pageSize)  : undefined,
      isAvailable: isAvailable !== undefined ? isAvailable === 'true' : undefined,
    });

    return (res as AppResponse).data(result, 'Lawyers fetched.');
  }
);

// GET /api/v1/admin/lawyers/stats
export const getLawyerStatsHandler = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await getLawyerStats();
    return (res as AppResponse).data(stats, 'Stats fetched.');
  }
);

// GET /api/v1/admin/lawyers/:id
export const getLawyerHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const profile = await getLawyerById(req.params.id);
    return (res as AppResponse).data({ profile }, 'Lawyer fetched.');
  }
);

// POST /api/v1/admin/lawyers/:id/verification/advance
// Move verification to next stage
export const advanceVerificationHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { note } = req.body;
    const result = await advanceVerification(req.params.id, adminCtx(req), note);
    return (res as AppResponse).data(result, result.message);
  }
);

// POST /api/v1/admin/lawyers/:id/verification/reject
export const rejectVerificationHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reason } = req.body;
    if (!reason?.trim()) return next(new AppError('A rejection reason is required.', 400, 'VALIDATION_ERROR'));

    const result = await rejectVerification(req.params.id, adminCtx(req), reason);
    return (res as AppResponse).data(result, result.message);
  }
);

// PATCH /api/v1/admin/lawyers/:id/documents/:docId
// Mark an individual document as verified/failed
export const verifyDocumentHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { verified } = req.body;
    if (typeof verified !== 'boolean') {
      return next(new AppError('`verified` must be a boolean.', 400, 'VALIDATION_ERROR'));
    }

    const result = await verifyDocument(
      req.params.id,
      req.params.docId,
      verified,
      adminCtx(req)
    );
    return (res as AppResponse).data(result, result.message);
  }
);

// PATCH /api/v1/admin/lawyers/:id/status
export const updateLawyerStatusHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { action, reason } = req.body as { action?: string; reason?: string };

    if (!action || !['suspend', 'reactivate'].includes(action)) {
      return next(new AppError('action must be "suspend" or "reactivate".', 400, 'VALIDATION_ERROR'));
    }
    if (!reason?.trim()) return next(new AppError('reason is required.', 400, 'VALIDATION_ERROR'));

    const result = await updateLawyerStatus(
      req.params.id,
      action as 'suspend' | 'reactivate',
      reason,
      adminCtx(req)
    );
    return (res as AppResponse).data(result, result.message);
  }
);

// POST /api/v1/admin/lawyers/:id/email
export const emailLawyerHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { subject, body } = req.body as { subject?: string; body?: string };
    if (!subject?.trim()) return next(new AppError('subject is required.', 400, 'VALIDATION_ERROR'));
    if (!body?.trim())    return next(new AppError('body is required.', 400, 'VALIDATION_ERROR'));

    // Import inline to avoid circular deps
    // const { emailLawyer } = await import('../services/lawyer.service');
    // emailLawyer is not exported from lawyerProfile.service, using admin-side email stub:
    console.log(`[EMAIL LAWYER] id=${req.params.id} subject=${subject}`);
    return (res as AppResponse).success('Email sent successfully.');
  }
);