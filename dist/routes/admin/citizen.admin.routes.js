"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../../middleware/adminAuth");
const citizen_controller_1 = require("../../controllers/citizen.controller");
const router = (0, express_1.Router)();
// All citizen admin routes require a valid admin token
router.use(adminAuth_1.protectAdmin);
// GET  /admin/citizens         ,  list with filters + pagination
router.get('/', citizen_controller_1.listCitizensHandler);
// GET  /admin/citizens/:id     ,  full citizen profile
router.get('/:id', citizen_controller_1.getCitizenHandler);
// PATCH /admin/citizens/:id/status,  suspend / reactivate / flag
router.patch('/:id/status', citizen_controller_1.updateCitizenStatusHandler);
// POST  /admin/citizens/:id/email ,  send direct email
router.post('/:id/email', citizen_controller_1.emailCitizenHandler);
exports.default = router;
//# sourceMappingURL=citizen.admin.routes.js.map