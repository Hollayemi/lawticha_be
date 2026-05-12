import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';
import {
  listCitizens,
  getCitizenById,
  updateCitizenStatus,
  emailCitizen,
} from '../services/citizen.service';
import { CitizenStatus } from '../models/types/lawticha.types';
import { UserStatusVariant } from '../models';


function adminCtx(req: Request) {
  const admin = req.admin!;
  return { adminId: admin.id, adminName: admin.name };
}

//  GET /admin/citizens 

export const listCitizensHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const {
      status,
      search,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = req.query as Record<string, string>;

    const result = await listCitizens({
      status,
      search,
      page:      page     ? Number(page)     : undefined,
      pageSize:  pageSize ? Number(pageSize)  : undefined,
      // sortBy,
      // sortOrder: sortOrder as 'asc' | 'desc',
    });

    return (res as AppResponse).data(result, 'Citizens fetched');
  }
);

//  GET /admin/citizens/:id 

export const getCitizenHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await getCitizenById(req.params.id);
    return (res as AppResponse).data(result, 'Citizen fetched');
  }
);

//  PATCH /admin/citizens/:id/status 

export const updateCitizenStatusHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { status, reason } = req.body as { status?: string; reason?: string };

    if (!status) return next(new AppError('status is required', 400, 'VALIDATION_ERROR'));
    if (!reason?.trim()) return next(new AppError('reason is required', 400, 'VALIDATION_ERROR'));

    const result = await updateCitizenStatus(
      req.params.id,
      status as UserStatusVariant,
      reason,
      adminCtx(req)
    );
    return (res as AppResponse).data(result, 'Citizen status updated');
  }
);

//  POST /admin/citizens/:id/email 

export const emailCitizenHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { subject, body } = req.body as { subject?: string; body?: string };

    if (!subject?.trim()) return next(new AppError('subject is required', 400, 'VALIDATION_ERROR'));
    if (!body?.trim())    return next(new AppError('body is required', 400, 'VALIDATION_ERROR'));

    const result = await emailCitizen(req.params.id, subject, body, adminCtx(req));
    return (res as AppResponse).data(result, 'Email sent successfully');
  }
);
