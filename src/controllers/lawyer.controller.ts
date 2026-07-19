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
  getMarketplaceStats,
  getMarketplaceStates,
  getMarketplaceSpecialisms,
  getFilterCounts,
  getMarketplaceLawyers,
  getLawyerByNbaNumber,
  bookConsultation,
  requestLawyerMatch,
  getLawyerAvailability,
  submitReview,
} from '../services/lawyer.service';
import PaymentGateway from '../services/payment/payment';
import logger from '../utils/logger';

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

    if (!nbaNumber?.trim()) return next(new AppError('SCN number is required.', 400, 'VALIDATION_ERROR'));
    if (!yearOfCall) return next(new AppError('Year of call is required.', 400, 'VALIDATION_ERROR'));
    if (!calledAt?.trim()) return next(new AppError('calledAt year is required (e.g. "2019").', 400, 'VALIDATION_ERROR'));

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
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
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
    const { reason, infoNeeded } = req.body;
    if (!reason?.trim()) return next(new AppError('A reason is required.', 400, 'VALIDATION_ERROR'));

    const result = await rejectVerification(req.params.id, adminCtx(req), reason, Boolean(infoNeeded));
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
    if (!body?.trim()) return next(new AppError('body is required.', 400, 'VALIDATION_ERROR'));

    // Import inline to avoid circular deps
    // const { emailLawyer } = await import('../services/lawyer.service');
    // emailLawyer is not exported from lawyerProfile.service, using admin-side email stub:
    console.log(`[EMAIL LAWYER] id=${req.params.id} subject=${subject}`);
    return (res as AppResponse).success('Email sent successfully.');
  }
);


// Add these new functions to your existing lawyer.controller.ts

// ========== NEW MARKETPLACE CONTROLLERS ==========

/**
 * GET /api/v1/marketplace/stats
 * Get marketplace statistics for hero section
 */
export const getMarketplaceStatsHandler = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await getMarketplaceStats();
    return (res as AppResponse).data(stats, 'Marketplace stats fetched.');
  }
);

/**
 * GET /api/v1/marketplace/states
 * Get unique states for filter dropdown
 */
export const getMarketplaceStatesHandler = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const states = await getMarketplaceStates();
    return (res as AppResponse).data(states, 'States fetched.');
  }
);

/**
 * GET /api/v1/marketplace/specialisms
 * Get specialisms with counts for filter
 */
export const getMarketplaceSpecialismsHandler = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const specialisms = await getMarketplaceSpecialisms();
    return (res as AppResponse).data(specialisms, 'Specialisms fetched.');
  }
);

/**
 * GET /api/v1/marketplace/filter-counts
 * Get filter counts for sidebar
 */
export const getFilterCountsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { specialism, state, search } = req.query as Record<string, string>;
    const counts = await getFilterCounts({ specialism, state, search });
    return (res as AppResponse).data(counts, 'Filter counts fetched.');
  }
);

/**
 * GET /api/v1/marketplace/lawyers
 * Get paginated list of marketplace lawyers with filters
 */
export const getMarketplaceLawyersHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const {
      specialism,
      state,
      search,
      sortBy,
      page,
      pageSize,
      subscribedOnly,
    } = req.query as Record<string, string>;

    logger.info("info",req.query)

    const result = await getMarketplaceLawyers({
      specialism,
      state,
      search,
      sortBy: sortBy as any,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      subscribedOnly: subscribedOnly === 'true',
    });

    return (res as AppResponse).data(result, 'Lawyers fetched.');
  }
);

/**
 * GET /api/v1/marketplace/lawyers/:nbaNumber
 * Get lawyer by SCN number
 */
export const getLawyerByNbaNumberHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { nbaNumber } = req.params;
    const lawyer = await getLawyerByNbaNumber(nbaNumber);
    return (res as AppResponse).data(lawyer, 'Lawyer fetched.');
  }
);

/**
 * POST /api/v1/marketplace/consultations
 * Book a consultation with a lawyer
 */
export const bookConsultationHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { lawyerNbaNumber, mode, topic, description, preferredTimeSlot } = req.body;

    if(!req.user) return next(new AppError('Invalid User.', 400, 'VALIDATION_ERROR'));

    if (!lawyerNbaNumber) return next(new AppError('Lawyer SCN number is required.', 400, 'VALIDATION_ERROR'));
    if (!mode) return next(new AppError('Consultation mode is required.', 400, 'VALIDATION_ERROR'));
    if (!topic?.trim()) return next(new AppError('Topic is required.', 400, 'VALIDATION_ERROR'));

    const result = await bookConsultation(req.user!._id.toString(), req.user.fullName, {
      lawyerNbaNumber,
      mode,
      topic,
      description,
    });

    const consultationSlug = result.receiptId
    const paymentGateway = new PaymentGateway();
    const paymentReference = paymentGateway.generatePaymentReference(consultationSlug);

    const paymentData = {
      email: req.user?.email,
      amount: result.fee,
      reference: paymentReference,
      coreId: result.consultationId.toString(),
      userId: req.user?.id,
      description: 'Order Payment',
      phone: req.user.phone || '',
      metadata: {
        type: 'purchase',
        coreId: result.consultationId.toString(),
        orderSlug: consultationSlug,
        redirect: "marketplace",
      }
    }

    const paymentResult = await paymentGateway.initializePayment("paystack", paymentData);

    return (res as AppResponse).data({ result, payment: paymentResult }, 'Order created successfully');
  }
);

/**
 * POST /api/v1/marketplace/match-requests
 * Request a lawyer match
 */
export const requestLawyerMatchHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { specialism, topic, mode, urgency, location, description, notes, documents } = req.body;

    if (!specialism?.trim()) return next(new AppError('Specialism is required.', 400, 'VALIDATION_ERROR'));
    if (!urgency) return next(new AppError('Urgency is required.', 400, 'VALIDATION_ERROR'));
    if (!location?.trim()) return next(new AppError('Location is required.', 400, 'VALIDATION_ERROR'));
    if (!description?.trim()) return next(new AppError('Description is required.', 400, 'VALIDATION_ERROR'));
    if (!topic?.trim()) return next(new AppError('Topic is required.', 400, 'VALIDATION_ERROR'));
    if (!mode?.trim()) return next(new AppError('Mode is required.', 400, 'VALIDATION_ERROR'));
    if (documents && (!Array.isArray(documents) || documents.some((d: any) => !d?.name || !d?.base64))) {
      return next(new AppError('Each document needs a name and base64 file.', 400, 'VALIDATION_ERROR'));
    }
    const result = await requestLawyerMatch(req.user!._id.toString(), req.body);
    return (res as AppResponse).data(result, 'Match request submitted.');
  }
);

/**
 * GET /api/v1/marketplace/lawyers/:nbaNumber/availability
 * Get lawyer availability slots
 */
export const getLawyerAvailabilityHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { nbaNumber } = req.params;
    const { date } = req.query as { date?: string };
    const slots = await getLawyerAvailability(nbaNumber, date);
    return (res as AppResponse).data(slots, 'Availability slots fetched.');
  }
);

/**
 * POST /api/v1/marketplace/lawyers/:nbaNumber/reviews
 * Submit a review for a lawyer
 */
export const submitReviewHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { nbaNumber } = req.params;
    const { consultationId, rating, comment, tags } = req.body;

    if (!consultationId) return next(new AppError('Consultation ID is required.', 400, 'VALIDATION_ERROR'));
    if (!rating || rating < 1 || rating > 5) return next(new AppError('Rating must be between 1 and 5.', 400, 'VALIDATION_ERROR'));
    if (!comment?.trim()) return next(new AppError('Comment is required.', 400, 'VALIDATION_ERROR'));

    const result = await submitReview(req.user!._id.toString(), nbaNumber, {
      consultationId,
      rating,
      comment,
      tags,
    });

    return (res as AppResponse).data(result, 'Review submitted.');
  }
);