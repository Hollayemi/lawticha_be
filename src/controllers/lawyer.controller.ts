import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';
import {
  listLawyers,
  getLawyerById,
  updateLawyerStatus,
  emailLawyer,
} from '../services/lawyer.service';
import { LawyerStatus } from '../models/types/lawticha.types';

function adminCtx(req: Request) {
  const admin = req.admin!;
  return { adminId: admin.id, adminName: admin.name };
}

export const listLawyersHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { status, search, page, pageSize } = req.query as Record<string, string>;

    const result = await listLawyers({
      status,
      search,
      page:     page     ? Number(page)    : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    return (res as AppResponse).data(result, 'Lawyers fetched');
  }
);

//  GET /admin/lawyers/:id 

export const getLawyerHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await getLawyerById(req.params.id);
    return (res as AppResponse).data(result, 'Lawyer fetched');
  }
);

//  PATCH /admin/lawyers/:id/status 

export const updateLawyerStatusHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { status, reason } = req.body as { status?: string; reason?: string };

    if (!status) return next(new AppError('status is required', 400, 'VALIDATION_ERROR'));
    if (!reason?.trim()) return next(new AppError('reason is required', 400, 'VALIDATION_ERROR'));

    const result = await updateLawyerStatus(
      req.params.id,
      status as LawyerStatus,
      reason,
      adminCtx(req)
    );
    return (res as AppResponse).data(result, 'Lawyer status updated');
  }
);

//  POST /admin/lawyers/:id/email 

export const emailLawyerHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { subject, body } = req.body as { subject?: string; body?: string };

    if (!subject?.trim()) return next(new AppError('subject is required', 400, 'VALIDATION_ERROR'));
    if (!body?.trim())    return next(new AppError('body is required', 400, 'VALIDATION_ERROR'));

    const result = await emailLawyer(req.params.id, subject, body, adminCtx(req));
    return (res as AppResponse).data(result, 'Email sent successfully');
  }
);
