"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUpdateOrderStatusHandler = exports.adminGetOrderByIdHandler = exports.adminListOrdersHandler = exports.adminToggleBookStatusHandler = exports.adminToggleBookFeaturedHandler = exports.adminDeleteBookHandler = exports.adminUpdateBookHandler = exports.adminCreateBookHandler = exports.adminGetBookByIdHandler = exports.adminGetLibraryStatsHandler = exports.adminListBooksHandler = exports.getUserOrderByIdHandler = exports.getUserOrdersHandler = exports.createOrderHandler = exports.downloadBookHandler = exports.getLibraryStatsHandler = exports.getBookByIdHandler = exports.listBooksHandler = void 0;
const error_1 = require("../middleware/error");
const library_service_1 = require("../services/library.service");
const library_types_1 = require("../models/types/library.types");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const payment_1 = __importDefault(require("../services/payment/payment"));
function adminCtx(req) {
    return { adminId: req.admin.id, adminName: req.admin.name };
}
// ==================== USER-FACING ROUTES ====================
// GET /api/v1/books - List books (public)
exports.listBooksHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { category, format, featured, search, page, pageSize } = req.query;
    const result = await (0, library_service_1.listBooks)({
        category: category,
        format: format,
        featured: featured !== undefined ? featured === 'true' : undefined,
        status: library_types_1.BookStatus.ACTIVE,
        search,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return res.data(result, 'Books fetched successfully');
});
// GET /api/v1/books/:id - Get book by ID (public)
exports.getBookByIdHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const book = await (0, library_service_1.getBookById)(req.params.id);
    return res.data({ book }, 'Book fetched successfully');
});
// GET /api/v1/books/stats - Get library stats (public)
exports.getLibraryStatsHandler = (0, error_1.asyncHandler)(async (_req, res, _next) => {
    const stats = await (0, library_service_1.getLibraryStats)();
    return res.data(stats, 'Stats fetched successfully');
});
// POST /api/v1/books/:id/download - Increment download count
exports.downloadBookHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    await (0, library_service_1.incrementBookDownload)(req.params.id);
    return res.success('Download count incremented');
});
// POST /api/v1/orders - Create new order
exports.createOrderHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { bookId, quantity, deliveryAddress, state, name, email, phone, notes } = req.body;
    if (!req.user)
        return next(new error_1.AppError('Invalid User', 400, 'VALIDATION_ERROR'));
    if (!bookId)
        return next(new error_1.AppError('Book ID is required', 400, 'VALIDATION_ERROR'));
    if (!quantity || quantity < 1)
        return next(new error_1.AppError('Valid quantity is required', 400, 'VALIDATION_ERROR'));
    if (!deliveryAddress)
        return next(new error_1.AppError('Delivery address is required', 400, 'VALIDATION_ERROR'));
    if (!state)
        return next(new error_1.AppError('State is required', 400, 'VALIDATION_ERROR'));
    if (!name)
        return next(new error_1.AppError('Name is required', 400, 'VALIDATION_ERROR'));
    if (!email)
        return next(new error_1.AppError('Email is required', 400, 'VALIDATION_ERROR'));
    if (!phone)
        return next(new error_1.AppError('Phone is required', 400, 'VALIDATION_ERROR'));
    const order = await (0, library_service_1.createOrder)(req.user._id.toString(), {
        bookId,
        quantity,
        deliveryAddress,
        state,
        name,
        email,
        phone,
        notes,
    });
    const orderSlug = order.orderNumber;
    const paymentGateway = new payment_1.default();
    const paymentReference = paymentGateway.generatePaymentReference(orderSlug);
    const paymentData = {
        email: email || req.user.email,
        amount: order.totalAmount,
        reference: paymentReference,
        coreId: order._id.toString(),
        userId: req.user.id,
        description: 'Order Payment',
        phone: phone || req.user.phone || '',
        metadata: {
            type: 'purchase',
            coreId: order._id.toString(),
            redirect: "library",
            orderSlug: orderSlug,
        }
    };
    const paymentResult = await paymentGateway.initializePayment("paystack", paymentData);
    return res.data({ order, payment: paymentResult }, 'Order created successfully');
});
// GET /api/v1/orders/me - Get user's orders
exports.getUserOrdersHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { page, pageSize } = req.query;
    const result = await (0, library_service_1.getUserOrders)(req.user._id.toString(), page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined);
    return res.data(result, 'Orders fetched successfully');
});
// GET /api/v1/orders/:id - Get order by ID (user can view their own)
exports.getUserOrderByIdHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const order = await (0, library_service_1.getOrderById)(req.params.id);
    // Check if order belongs to user
    if (order.userId.toString() !== req.user._id.toString()) {
        return next(new error_1.AppError('Unauthorized to view this order', 403, 'FORBIDDEN'));
    }
    return res.data(order, 'Order fetched successfully');
});
// ==================== ADMIN ROUTES ====================
// GET /api/v1/admin/library/books - List all books (admin)
exports.adminListBooksHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { category, format, status, featured, search, page, pageSize } = req.query;
    const result = await (0, library_service_1.listBooks)({
        category: category,
        format: format,
        status: status,
        featured: featured !== undefined ? featured === 'true' : undefined,
        search,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return res.data(result, 'Books fetched successfully');
});
// GET /api/v1/admin/library/stats - Get library stats (admin)
exports.adminGetLibraryStatsHandler = (0, error_1.asyncHandler)(async (_req, res, _next) => {
    const stats = await (0, library_service_1.getLibraryStats)();
    return res.data(stats, 'Stats fetched successfully');
});
// GET /api/v1/admin/library/books/:id - Get book by ID (admin)
exports.adminGetBookByIdHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const book = await (0, library_service_1.getBookById)(req.params.id);
    return res.data({ book }, 'Book fetched successfully');
});
// POST /api/v1/admin/library/books - Create book (admin)
exports.adminCreateBookHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { title, author, description, category, coverUrl, pdfUrl, format, pricePhysical, totalPages, isbn, publishedYear, tags, stockCount, featured, status, pdfFile, coverFile } = req.body;
    console.log(pdfFile);
    if (!title)
        return next(new error_1.AppError('Title is required', 400, 'VALIDATION_ERROR'));
    if (!author)
        return next(new error_1.AppError('Author is required', 400, 'VALIDATION_ERROR'));
    if (!description)
        return next(new error_1.AppError('Description is required', 400, 'VALIDATION_ERROR'));
    if (!category)
        return next(new error_1.AppError('Category is required', 400, 'VALIDATION_ERROR'));
    if (!format)
        return next(new error_1.AppError('Format is required', 400, 'VALIDATION_ERROR'));
    if (!totalPages)
        return next(new error_1.AppError('Total pages is required', 400, 'VALIDATION_ERROR'));
    if (!isbn)
        return next(new error_1.AppError('ISBN is required', 400, 'VALIDATION_ERROR'));
    if (!publishedYear)
        return next(new error_1.AppError('Published year is required', 400, 'VALIDATION_ERROR'));
    if (!coverUrl && !coverFile)
        return next(new error_1.AppError('Upload at least one cover File', 400, 'VALIDATION_ERROR'));
    if (!pdfUrl && !pdfFile)
        return next(new error_1.AppError('Upload at least one PDF File', 400, 'VALIDATION_ERROR'));
    const getCoverUrlFromFile = coverUrl || (await cloudinary_1.default.uploadFile(coverFile, "books/covers", 'image')).url;
    const getPDFUrlFromFile = pdfUrl || (await cloudinary_1.default.uploadFile(pdfFile, "books/pdfs", 'raw')).url;
    const book = await (0, library_service_1.createBook)({
        title, author, description, category, coverUrl: getCoverUrlFromFile, pdfUrl: getPDFUrlFromFile,
        format, pricePhysical, totalPages, isbn, publishedYear,
        tags, stockCount, featured, status,
    }, adminCtx(req));
    return res.data({ book }, 'Book created successfully');
});
// PATCH /api/v1/admin/library/books/:id - Update book (admin)
exports.adminUpdateBookHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { updates } = req.body;
    const result = await (0, library_service_1.updateBook)({ id: req.params.id, updates }, adminCtx(req));
    return res.data({ book: result }, 'Book updated successfully');
});
// DELETE /api/v1/admin/library/books/:id - Delete book (admin)
exports.adminDeleteBookHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    await (0, library_service_1.deleteBook)(req.params.id, adminCtx(req));
    return res.success('Book deleted successfully');
});
// PATCH /api/v1/admin/library/books/:id/featured - Toggle featured (admin)
exports.adminToggleBookFeaturedHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await (0, library_service_1.toggleBookFeatured)(req.params.id, adminCtx(req));
    return res.data(result, 'Featured status toggled');
});
// PATCH /api/v1/admin/library/books/:id/status - Toggle status (admin)
exports.adminToggleBookStatusHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const result = await (0, library_service_1.toggleBookStatus)(req.params.id, adminCtx(req));
    return res.data(result, 'Book status toggled');
});
// GET /api/v1/admin/library/orders - List orders (admin)
exports.adminListOrdersHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const { status, search, startDate, endDate, page, pageSize } = req.query;
    const result = await (0, library_service_1.listOrders)({
        status: status,
        search,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return res.data(result, 'Orders fetched successfully');
});
// GET /api/v1/admin/library/orders/:id - Get order by ID (admin)
exports.adminGetOrderByIdHandler = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const order = await (0, library_service_1.getOrderById)(req.params.id);
    return res.data({ order }, 'Order fetched successfully');
});
// PATCH /api/v1/admin/library/orders/:id/status - Update order status (admin)
exports.adminUpdateOrderStatusHandler = (0, error_1.asyncHandler)(async (req, res, next) => {
    const { status, trackingNumber } = req.body;
    if (!status)
        return next(new error_1.AppError('Status is required', 400, 'VALIDATION_ERROR'));
    const order = await (0, library_service_1.updateOrderStatus)({
        orderId: req.params.id,
        status,
        trackingNumber,
    }, adminCtx(req));
    return res.data({ order }, 'Order status updated');
});
//# sourceMappingURL=library.controller.js.map