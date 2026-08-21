"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/library.admin.routes.ts (Admin routes)
const express_1 = require("express");
const adminAuth_1 = require("../../middleware/adminAuth");
const library_controller_1 = require("../../controllers/library.controller");
const router = (0, express_1.Router)();
// All admin routes require admin authentication
router.use(adminAuth_1.protectAdmin);
// Books endpoints
router.get('/books', library_controller_1.adminListBooksHandler);
router.get('/stats', library_controller_1.adminGetLibraryStatsHandler);
router.get('/books/:id', library_controller_1.adminGetBookByIdHandler);
router.post('/books', library_controller_1.adminCreateBookHandler);
router.patch('/books/:id', library_controller_1.adminUpdateBookHandler);
router.delete('/books/:id', library_controller_1.adminDeleteBookHandler);
router.patch('/books/:id/featured', library_controller_1.adminToggleBookFeaturedHandler);
router.patch('/books/:id/status', library_controller_1.adminToggleBookStatusHandler);
// Orders endpoints
router.get('/orders', library_controller_1.adminListOrdersHandler);
router.get('/orders/:id', library_controller_1.adminGetOrderByIdHandler);
router.patch('/orders/:id/status', library_controller_1.adminUpdateOrderStatusHandler);
exports.default = router;
//# sourceMappingURL=library.admin.routes.js.map