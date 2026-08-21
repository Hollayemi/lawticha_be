"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const lawyer_controller_1 = require("../controllers/lawyer.controller");
const router = (0, express_1.Router)();
// Public marketplace routes (no authentication required)
router.get('/stats', lawyer_controller_1.getMarketplaceStatsHandler);
router.get('/states', lawyer_controller_1.getMarketplaceStatesHandler);
router.get('/specialisms', lawyer_controller_1.getMarketplaceSpecialismsHandler);
router.get('/filter-counts', lawyer_controller_1.getFilterCountsHandler);
router.get('/lawyers', lawyer_controller_1.getMarketplaceLawyersHandler);
router.get('/lawyers/:scnNumber', lawyer_controller_1.getLawyerByScnNumberHandler);
router.get('/lawyers/:scnNumber/availability', lawyer_controller_1.getLawyerAvailabilityHandler);
// Protected routes (require authentication)
router.use(auth_middleware_1.protect);
router.post('/consultations', lawyer_controller_1.bookConsultationHandler);
router.post('/match-requests', lawyer_controller_1.requestLawyerMatchHandler);
router.post('/lawyers/:scnNumber/reviews', lawyer_controller_1.submitReviewHandler);
exports.default = router;
//# sourceMappingURL=marketplace.routes.js.map