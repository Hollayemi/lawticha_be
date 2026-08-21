"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookCategory = exports.OrderStatus = exports.BookStatus = exports.BookFormat = void 0;
var BookFormat;
(function (BookFormat) {
    BookFormat["PDF"] = "pdf";
    BookFormat["PHYSICAL"] = "physical";
    BookFormat["BOTH"] = "both";
})(BookFormat || (exports.BookFormat = BookFormat = {}));
var BookStatus;
(function (BookStatus) {
    BookStatus["ACTIVE"] = "active";
    BookStatus["INACTIVE"] = "inactive";
    BookStatus["DRAFT"] = "draft";
})(BookStatus || (exports.BookStatus = BookStatus = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["PROCESSING"] = "processing";
    OrderStatus["SHIPPED"] = "shipped";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var BookCategory;
(function (BookCategory) {
    BookCategory["CRIMINAL"] = "criminal";
    BookCategory["TENANCY"] = "tenancy";
    BookCategory["EMPLOYMENT"] = "employment";
    BookCategory["CONTRACTS"] = "contracts";
    BookCategory["BUSINESS"] = "business";
    BookCategory["FAMILY"] = "family";
    BookCategory["CONSUMER"] = "consumer";
    BookCategory["ROAD"] = "road";
    BookCategory["CONSTITUTIONAL"] = "constitutional";
})(BookCategory || (exports.BookCategory = BookCategory = {}));
//# sourceMappingURL=library.types.js.map