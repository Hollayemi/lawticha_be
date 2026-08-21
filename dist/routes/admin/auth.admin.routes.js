"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_controller_1 = require("../../controllers/adminAuth.controller");
const adminAuth_1 = require("../../middleware/adminAuth");
const router = (0, express_1.Router)();
//  Public 
router.post('/login', adminAuth_controller_1.adminLoginHandler);
//  Protected 
router.use(adminAuth_1.protectAdmin);
router.post('/logout', adminAuth_controller_1.adminLogoutHandler);
router.get('/me', adminAuth_controller_1.adminMeHandler);
exports.default = router;
//# sourceMappingURL=auth.admin.routes.js.map