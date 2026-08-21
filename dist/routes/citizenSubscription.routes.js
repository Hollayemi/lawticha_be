"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const subscription_controller_1 = require("../controllers/subscription.controller");
const router = (0, express_1.Router)();
// All routes here require a logged-in citizen
router.use(auth_middleware_1.protect);
// GET   /api/v1/citizens/subscription/plans
router.get('/subscription/plans', subscription_controller_1.listPlansHandler);
// GET   /api/v1/citizens/subscription
router.get('/subscription', subscription_controller_1.getMySubscriptionHandler);
// POST  /api/v1/citizens/subscription/subscribe
router.post('/subscription/subscribe', subscription_controller_1.subscribeHandler);
// POST  /api/v1/citizens/subscription/change-plan
router.post('/subscription/change-plan', subscription_controller_1.changePlanHandler);
// POST  /api/v1/citizens/subscription/cancel
router.post('/subscription/cancel', subscription_controller_1.cancelSubscriptionHandler);
// POST  /api/v1/citizens/subscription/reactivate
router.post('/subscription/reactivate', subscription_controller_1.reactivateSubscriptionHandler);
// PUT   /api/v1/citizens/subscription/auto-renew
router.put('/subscription/auto-renew', subscription_controller_1.updateAutoRenewHandler);
// GET   /api/v1/citizens/subscription/invoice/:invoiceId
router.get('/subscription/invoice/:invoiceId', subscription_controller_1.getInvoiceHandler);
// GET   /api/v1/citizens/billing-history
router.get('/billing-history', subscription_controller_1.getBillingHistoryHandler);
exports.default = router;
//# sourceMappingURL=citizenSubscription.routes.js.map