"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const citizen_controller_1 = require("../controllers/citizen.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const lawyer_controller_1 = require("../controllers/lawyer.controller");
const cloudinary_1 = require("../utils/cloudinary");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
router.post('/lawyer-profile', cloudinary_1.upload.fields([
    { name: 'documents', maxCount: 10 },
    { name: 'profilePicture', maxCount: 1 }
]), lawyer_controller_1.submitVerificationHandler);
router.patch('/me/profile', citizen_controller_1.UpdateCitizenProfileHandler);
exports.default = router;
//# sourceMappingURL=citizen.routes.js.map