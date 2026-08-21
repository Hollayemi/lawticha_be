"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../../middleware/adminAuth");
const subscription_controller_1 = require("../../controllers/subscription.controller");
const router = (0, express_1.Router)();
// All subscription admin routes require a valid admin token
router.use(adminAuth_1.protectAdmin);
// Stats
router.get('/stats', subscription_controller_1.adminGetSubscriptionStatsHandler);
// Plans
router.get('/plans', subscription_controller_1.adminListPlansHandler);
router.get('/plans/:id', subscription_controller_1.adminGetPlanHandler);
router.post('/plans', subscription_controller_1.adminCreatePlanHandler);
router.patch('/plans/:id', subscription_controller_1.adminUpdatePlanHandler);
router.delete('/plans/:id', subscription_controller_1.adminDeletePlanHandler);
// Subscribers
router.get('/subscribers', subscription_controller_1.adminListSubscribersHandler);
router.get('/subscribers/:id', subscription_controller_1.adminGetSubscriberHandler);
router.patch('/subscribers/:id', subscription_controller_1.adminUpdateSubscriberHandler);
router.delete('/subscribers/:id', subscription_controller_1.adminDeleteSubscriberHandler);
// Invoices
router.get('/invoices', subscription_controller_1.adminListInvoicesHandler);
router.get('/invoices/:id', subscription_controller_1.adminGetInvoiceHandler);
router.patch('/invoices/:id', subscription_controller_1.adminUpdateInvoiceHandler);
router.delete('/invoices/:id', subscription_controller_1.adminDeleteInvoiceHandler);
exports.default = router;
//# sourceMappingURL=subscription.admin.routes.js.map