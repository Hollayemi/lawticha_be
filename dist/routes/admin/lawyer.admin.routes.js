"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../../middleware/adminAuth");
const lawyer_controller_1 = require("../../controllers/lawyer.controller");
const router = (0, express_1.Router)();
// GET  /api/v1/lawyers/me/profile
router.get('/me/profile', lawyer_controller_1.getMyProfileHandler);
// PATCH /api/v1/lawyers/me/profile
router.patch('/me/profile', lawyer_controller_1.updateMyProfileHandler);
// POST /api/v1/lawyers/me/verification
router.post('/me/verification', lawyer_controller_1.submitVerificationHandler);
// PATCH /api/v1/lawyers/me/availability
router.patch('/me/availability', lawyer_controller_1.setAvailabilityHandler);
// All admin routes require a valid admin token
router.use(adminAuth_1.protectAdmin);
// GET  /admin/lawyers          - list with filters + pagination
router.get('/', lawyer_controller_1.listLawyersHandler);
// GET  /admin/lawyers/stats    - get lawyer statistics
router.get('/stats', lawyer_controller_1.getLawyerStatsHandler);
// GET  /admin/lawyers/:id      - full lawyer profile
router.get('/:id', lawyer_controller_1.getLawyerHandler);
// POST /admin/lawyers/:id/verification/advance - move verification to next stage
router.post('/:id/verification/advance', lawyer_controller_1.advanceVerificationHandler);
// POST /admin/lawyers/:id/verification/reject - reject verification application
router.post('/:id/verification/reject', lawyer_controller_1.rejectVerificationHandler);
// PATCH /admin/lawyers/:id/documents/:docId - verify/reject specific document
router.patch('/:id/documents/:docId', lawyer_controller_1.verifyDocumentHandler);
// PATCH /admin/lawyers/:id/status - suspend/reactivate lawyer
router.patch('/:id/status', lawyer_controller_1.updateLawyerStatusHandler);
// POST /admin/lawyers/:id/email - send direct email to lawyer
router.post('/:id/email', lawyer_controller_1.emailLawyerHandler);
exports.default = router;
//# sourceMappingURL=lawyer.admin.routes.js.map