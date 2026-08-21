"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const library_controller_1 = require("../controllers/library.controller");
const payment_controller_1 = __importDefault(require("../controllers/payment.controller"));
const router = (0, express_1.Router)();
// Public routes
router.get('/books', auth_middleware_1.optionalAuth, library_controller_1.listBooksHandler);
router.get('/books/stats', library_controller_1.getLibraryStatsHandler);
router.get('/books/:id', auth_middleware_1.optionalAuth, library_controller_1.getBookByIdHandler);
// Protected routes
router.use(auth_middleware_1.protect);
// Book downloads
router.post('/books/:id/download', library_controller_1.downloadBookHandler);
// Orders
router.post('/orders', library_controller_1.createOrderHandler);
router.get('/orders/me', library_controller_1.getUserOrdersHandler);
router.get('/orders/:id', library_controller_1.getUserOrderByIdHandler);
router.get('/callback', payment_controller_1.default.paystackCallBackVerify);
router.post('/webhook/:provider', payment_controller_1.default.handleWebhook);
exports.default = router;
//# sourceMappingURL=library.routes.js.map