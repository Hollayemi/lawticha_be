"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = __importDefault(require("../controllers/payment.controller"));
const router = (0, express_1.Router)();
router.get('/callback', payment_controller_1.default.paystackCallBackVerify);
router.post('/webhook/:provider', payment_controller_1.default.handleWebhook);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map