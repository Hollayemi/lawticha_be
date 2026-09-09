import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';
import {
  requestInstructor,
  getInstructorStatus,
  listInstructorRequests,
  approveInstructorRequest,
  rejectInstructorRequest,
  getInstructorDashboardStats,
  type InstructorRequestFilters,
} from '../services/instructor.service';

function adminCtx(req: Request) {
  return { adminId: req.admin!.id, adminName: req.admin!.name };
}

// 
//  LAWYER-FACING ROUTES
// 

// POST /api/v1/instructor/request
export const requestInstructorHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { motivation } = req.body;
    const result = await requestInstructor(req.user!._id.toString(), motivation);
    return (res as AppResponse).data(result, 'Instructor request submitted.', 201);
  }
);

// GET /api/v1/instructor/status
export const getInstructorStatusHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await getInstructorStatus(req.user!._id.toString());
    return (res as AppResponse).data(result, 'Instructor status fetched.');
  }
);

// GET /api/v1/instructor/dashboard/stats
// Guarded by `requireInstructor` — only approved instructors reach here.
export const getInstructorDashboardStatsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const stats = await getInstructorDashboardStats(req.user!._id.toString());
    return (res as AppResponse).data(stats, 'Instructor dashboard stats fetched.');
  }
);

// 
//  ADMIN-FACING ROUTES
// 

// GET /admin/instructors/requests
export const listInstructorRequestsHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { status, page, pageSize } = req.query as Record<string, string>;

    const filters: InstructorRequestFilters = {
      status: status as InstructorRequestFilters['status'],
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    };

    const result = await listInstructorRequests(filters);
    return (res as AppResponse).data(result, 'Instructor requests fetched.');
  }
);

// PATCH /admin/instructors/requests/:lawyerProfileId/approve
export const approveInstructorRequestHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await approveInstructorRequest(req.params.lawyerProfileId, adminCtx(req));
    return (res as AppResponse).data(result, 'Instructor request approved.');
  }
);

// PATCH /admin/instructors/requests/:lawyerProfileId/reject
export const rejectInstructorRequestHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reason } = req.body;
    if (!reason?.trim()) {
      return next(new AppError('A rejection reason is required.', 400, 'VALIDATION_ERROR'));
    }
    const result = await rejectInstructorRequest(req.params.lawyerProfileId, adminCtx(req), reason);
    return (res as AppResponse).data(result, 'Instructor request rejected.');
  }
);
