"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const lawyer_controller_1 = require("../controllers/lawyer.controller");
const cloudinary_1 = require("../utils/cloudinary");
const router = (0, express_1.Router)();
router.get('/lawyers', lawyer_controller_1.listLawyersHandler);
router.get('/stats', lawyer_controller_1.getLawyerStatsHandler);
router.get('/:id', lawyer_controller_1.getLawyerHandler);
// All admin routes require a valid admin token
router.use(auth_middleware_1.protect);
// GET  /api/v1/lawyers/me/profile
router.get('/me/profile', lawyer_controller_1.getMyProfileHandler);
// PATCH /api/v1/lawyers/me/profile
router.patch('/me/profile', lawyer_controller_1.updateMyProfileHandler);
// POST /api/v1/lawyers/me/verification
router.post('/me/verification', cloudinary_1.upload.single("file"), lawyer_controller_1.submitVerificationHandler);
// PATCH /api/v1/lawyers/me/availability
router.patch('/me/availability', lawyer_controller_1.setAvailabilityHandler);
exports.default = router;
//# sourceMappingURL=lawyer.routes.js.map