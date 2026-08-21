"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCitizenProfileHandler = exports.emailCitizenHandler = exports.updateCitizenStatusHandler = exports.getCitizenHandler = exports.listCitizensHandler = void 0;
const error_1 = require("../middleware/error");
const citizen_service_1 = require("../services/citizen.service");
function adminCtx(req) {
    const admin = req.admin;
    return { adminId: admin.id, adminName: admin.name };
}
//  GET /admin/citizens 
exports.listCitizensHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { status, search, page, pageSize, sortBy, sortOrder, } = req.query;
    const result = await (0, citizen_service_1.listCitizens)({
        status,
        search,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        // sortBy,
        // sortOrder: sortOrder as 'asc' | 'desc',
    });
    return res.data(result, 'Citizens fetched');
});
//  GET /admin/citizens/:id 
exports.getCitizenHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await (0, citizen_service_1.getCitizenById)(req.params.id);
    return res.data(result, 'Citizen fetched');
});
//  PATCH /admin/citizens/:id/status 
exports.updateCitizenStatusHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { status, reason } = req.body;
    if (!status)
        return next(new error_1.AppError('status is required', 400, 'VALIDATION_ERROR'));
    if (!reason?.trim())
        return next(new error_1.AppError('reason is required', 400, 'VALIDATION_ERROR'));
    const result = await (0, citizen_service_1.updateCitizenStatus)(req.params.id, status, reason, adminCtx(req));
    return res.data(result, 'Citizen status updated');
});
//  POST /admin/citizens/:id/email 
exports.emailCitizenHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { subject, body } = req.body;
    if (!subject?.trim())
        return next(new error_1.AppError('subject is required', 400, 'VALIDATION_ERROR'));
    if (!body?.trim())
        return next(new error_1.AppError('body is required', 400, 'VALIDATION_ERROR'));
    const result = await (0, citizen_service_1.emailCitizen)(req.params.id, subject, body, adminCtx(req));
    return res.data(result, 'Email sent successfully');
});
exports.UpdateCitizenProfileHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    console.log(req.user);
    const userId = req.user?._id;
    const result = await (0, citizen_service_1.updateCitizenProfile)(userId, req.body);
    return res.data(result, 'Citizen profile updated');
});
//# sourceMappingURL=citizen.controller.js.map