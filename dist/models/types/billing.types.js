"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceStatus = exports.SubscriptionStatus = exports.BillingInterval = void 0;
var BillingInterval;
(function (BillingInterval) {
    BillingInterval["MONTHLY"] = "monthly";
    BillingInterval["YEARLY"] = "yearly";
})(BillingInterval || (exports.BillingInterval = BillingInterval = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["INACTIVE"] = "inactive";
    SubscriptionStatus["CANCELLED"] = "cancelled";
    SubscriptionStatus["EXPIRED"] = "expired";
    SubscriptionStatus["PENDING"] = "pending";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["PAID"] = "paid";
    InvoiceStatus["PENDING"] = "pending";
    InvoiceStatus["FAILED"] = "failed";
    InvoiceStatus["REFUNDED"] = "refunded";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
//# sourceMappingURL=billing.types.js.map