"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBooks = listBooks;
exports.getBookById = getBookById;
exports.createBook = createBook;
exports.updateBook = updateBook;
exports.deleteBook = deleteBook;
exports.toggleBookFeatured = toggleBookFeatured;
exports.toggleBookStatus = toggleBookStatus;
exports.getLibraryStats = getLibraryStats;
exports.listOrders = listOrders;
exports.getOrderById = getOrderById;
exports.createOrder = createOrder;
exports.updateOrderStatus = updateOrderStatus;
exports.updatePaymentStatus = updatePaymentStatus;
exports.getUserOrders = getUserOrders;
exports.incrementBookDownload = incrementBookDownload;
const mongoose_1 = require("mongoose");
const Book_model_1 = require("../models/Book.model");
const BookOrder_model_1 = require("../models/BookOrder.model");
const Admin_model_1 = require("../models/Admin.model");
const types_1 = require("../models/types");
const error_1 = require("../middleware/error");
const library_types_1 = require("../models/types/library.types");
const notification_1 = __importDefault(require("../controllers/others/notification"));
// ==================== BOOK SERVICES ====================
async function listBooks(params = {}) {
    const { category, format, status, featured, search, page = 1, pageSize = 20, } = params;
    const filter = {};
    if (category)
        filter.category = category;
    if (format)
        filter.format = format;
    if (status)
        filter.status = status;
    if (featured !== undefined)
        filter.featured = featured;
    if (search?.trim()) {
        filter.$text = { $search: search.trim() };
    }
    const skip = (page - 1) * pageSize;
    const [books, total] = await Promise.all([
        Book_model_1.BookModel.find(filter)
            .sort({ featured: -1, createdAt: -1 })
            .skip(skip)
            .limit(pageSize),
        Book_model_1.BookModel.countDocuments(filter),
    ]);
    return {
        data: books,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
async function getBookById(bookId) {
    const book = await Book_model_1.BookModel.findById(bookId);
    if (!book)
        throw new error_1.AppError('Book not found', 404, 'BOOK_NOT_FOUND');
    return book;
}
async function createBook(input, admin) {
    // Validate ISBN uniqueness
    if (input.isbn) {
        const existing = await Book_model_1.BookModel.findOne({ isbn: input.isbn });
        if (existing) {
            throw new error_1.AppError('Book with this ISBN already exists', 400, 'DUPLICATE_ISBN');
        }
    }
    // Validate physical price for physical/both formats
    if ((input.format === 'physical' || input.format === 'both') && !input.pricePhysical) {
        throw new error_1.AppError('Price is required for physical books', 400, 'PRICE_REQUIRED');
    }
    // Validate PDF URL for pdf/both formats
    if ((input.format === 'pdf' || input.format === 'both') && !input.pdfUrl) {
        throw new error_1.AppError('PDF URL is required for digital books', 400, 'PDF_URL_REQUIRED');
    }
    const book = await Book_model_1.BookModel.create({
        ...input,
        createdBy: new mongoose_1.Types.ObjectId(admin.adminId),
    });
    await Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: types_1.AuditAction.BOOK_CREATED,
        targetType: 'book',
        targetId: book._id,
        meta: { title: book.title, isbn: book.isbn },
    }).catch(() => null);
    return book;
}
async function updateBook(payload, admin) {
    const book = await Book_model_1.BookModel.findById(payload.id);
    if (!book)
        throw new error_1.AppError('Book not found', 404, 'BOOK_NOT_FOUND');
    const oldData = {
        title: book.title,
        pricePhysical: book.pricePhysical,
        featured: book.featured,
        status: book.status,
    };
    Object.assign(book, payload.updates);
    await book.save();
    await Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: types_1.AuditAction.BOOK_UPDATED,
        targetType: 'book',
        targetId: book._id,
        meta: { old: oldData, new: payload.updates },
    }).catch(() => null);
    return book;
}
async function deleteBook(bookId, admin) {
    const book = await Book_model_1.BookModel.findById(bookId);
    if (!book)
        throw new error_1.AppError('Book not found', 404, 'BOOK_NOT_FOUND');
    // Check if there are pending orders
    const pendingOrders = await BookOrder_model_1.BookOrderModel.countDocuments({
        bookId: new mongoose_1.Types.ObjectId(bookId),
        status: { $in: [library_types_1.OrderStatus.PENDING, library_types_1.OrderStatus.PROCESSING] },
    });
    if (pendingOrders > 0) {
        throw new error_1.AppError(`Cannot delete book with ${pendingOrders} pending orders. Cancel or fulfill orders first.`, 400, 'BOOK_HAS_ORDERS');
    }
    await book.deleteOne();
    await Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: types_1.AuditAction.BOOK_DELETED,
        targetType: 'book',
        targetId: book._id,
        meta: { title: book.title, isbn: book.isbn },
    }).catch(() => null);
}
async function toggleBookFeatured(bookId, admin) {
    const book = await Book_model_1.BookModel.findById(bookId);
    if (!book)
        throw new error_1.AppError('Book not found', 404, 'BOOK_NOT_FOUND');
    book.featured = !book.featured;
    await book.save();
    await Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: types_1.AuditAction.BOOK_UPDATED,
        targetType: 'book',
        targetId: book._id,
        meta: { action: 'toggle_featured', featured: book.featured },
    }).catch(() => null);
    return { featured: book.featured };
}
async function toggleBookStatus(bookId, admin) {
    const book = await Book_model_1.BookModel.findById(bookId);
    if (!book)
        throw new error_1.AppError('Book not found', 404, 'BOOK_NOT_FOUND');
    book.status = book.status === library_types_1.BookStatus.ACTIVE ? library_types_1.BookStatus.INACTIVE : library_types_1.BookStatus.ACTIVE;
    await book.save();
    await Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: types_1.AuditAction.BOOK_UPDATED,
        targetType: 'book',
        targetId: book._id,
        meta: { action: 'toggle_status', status: book.status },
    }).catch(() => null);
    return { status: book.status };
}
async function getLibraryStats() {
    const [totalBooks, activeBooks, totalDownloads, totalOrders, pendingOrders, totalRevenue, featuredBooksCount,] = await Promise.all([
        Book_model_1.BookModel.countDocuments(),
        Book_model_1.BookModel.countDocuments({ status: library_types_1.BookStatus.ACTIVE }),
        Book_model_1.BookModel.aggregate([{ $group: { _id: null, total: { $sum: '$downloadCount' } } }]),
        BookOrder_model_1.BookOrderModel.countDocuments(),
        BookOrder_model_1.BookOrderModel.countDocuments({ status: { $in: [library_types_1.OrderStatus.PENDING, library_types_1.OrderStatus.PROCESSING] } }),
        BookOrder_model_1.BookOrderModel.aggregate([
            { $match: { status: { $ne: library_types_1.OrderStatus.CANCELLED } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
        Book_model_1.BookModel.countDocuments({ featured: true, status: library_types_1.BookStatus.ACTIVE }),
    ]);
    return {
        totalBooks,
        activeBooks,
        totalDownloads: totalDownloads[0]?.total || 0,
        totalOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        featuredBooksCount,
    };
}
// ==================== ORDER SERVICES ====================
async function listOrders(params = {}) {
    const { status, search, startDate, endDate, page = 1, pageSize = 20, } = params;
    const filter = {};
    if (status)
        filter.status = status;
    if (startDate || endDate) {
        filter.orderedAt = {};
        if (startDate)
            filter.orderedAt.$gte = startDate;
        if (endDate)
            filter.orderedAt.$lte = endDate;
    }
    if (search?.trim()) {
        filter.$or = [
            { orderNumber: { $regex: search.trim(), $options: 'i' } },
            { userName: { $regex: search.trim(), $options: 'i' } },
            { userEmail: { $regex: search.trim(), $options: 'i' } },
            { bookTitle: { $regex: search.trim(), $options: 'i' } },
            { paymentRef: { $regex: search.trim(), $options: 'i' } },
        ];
    }
    const skip = (page - 1) * pageSize;
    const [orders, total] = await Promise.all([
        BookOrder_model_1.BookOrderModel.find(filter)
            .sort({ orderedAt: -1 })
            .skip(skip)
            .limit(pageSize),
        BookOrder_model_1.BookOrderModel.countDocuments(filter),
    ]);
    return {
        data: orders,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
async function getOrderById(orderId) {
    const order = await BookOrder_model_1.BookOrderModel.findById(orderId);
    if (!order)
        throw new error_1.AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    return order;
}
async function createOrder(userId, input) {
    const book = await Book_model_1.BookModel.findById(input.bookId);
    if (!book)
        throw new error_1.AppError('Book not found', 404, 'BOOK_NOT_FOUND');
    // Validate stock
    if (book.format !== 'pdf' && book.stockCount !== null && book.stockCount < input.quantity) {
        throw new error_1.AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK');
    }
    const totalAmount = (book.pricePhysical || 0) * input.quantity;
    const year = new Date().getFullYear();
    const count = await BookOrder_model_1.BookOrderModel.countDocuments();
    const orderNumber = `ORD-${year}-${String(count + 1).padStart(6, '0')}`;
    const order = await BookOrder_model_1.BookOrderModel.create({
        orderNumber,
        bookId: new mongoose_1.Types.ObjectId(input.bookId),
        bookTitle: book.title,
        coverUrl: book.coverUrl,
        userId: new mongoose_1.Types.ObjectId(userId),
        userName: input.name,
        userEmail: input.email,
        userPhone: input.phone,
        deliveryAddress: input.deliveryAddress,
        state: input.state,
        quantity: input.quantity,
        totalAmount,
        paymentRef: `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        notes: input.notes,
    });
    // Update book order count and stock
    await book.incrementOrderCount(input.quantity);
    // Notify user of order creation
    await notification_1.default.saveAndSendNotification({
        userId: userId,
        title: '📚 Order Placed Successfully',
        body: `Your order for "${book.title}" (Order #${orderNumber}) has been placed. Total: ₦${totalAmount}`,
        type: 'order_placed',
        clickUrl: `/library/orders/${order._id}`,
        priority: 'high'
    }, 'user', { push_notification: true, email_notification: true });
    // Notify admin of new order
    await notification_1.default.saveAndSendNotification({
        userId: userId, // This would need to be replaced with admin user ID
        title: '📦 New Book Order',
        body: `Order #${orderNumber} placed for "${book.title}" by ${input.name}`,
        type: 'new_order',
        clickUrl: `/admin/library/orders/${order._id}`,
        priority: 'high'
    }, 'admin', { push_notification: true, email_notification: true });
    return order;
}
async function updateOrderStatus(payload, admin) {
    const order = await BookOrder_model_1.BookOrderModel.findById(payload.orderId);
    if (!order)
        throw new error_1.AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    const oldStatus = order.status;
    await order.updateStatus(payload.status, payload.trackingNumber);
    // Notify user of order status update
    const statusMessages = {
        [library_types_1.OrderStatus.PROCESSING]: 'Your order is being processed.',
        [library_types_1.OrderStatus.SHIPPED]: `Your order has been shipped! Tracking: ${payload.trackingNumber || 'N/A'}`,
        [library_types_1.OrderStatus.DELIVERED]: 'Your order has been delivered. Enjoy your book!',
        [library_types_1.OrderStatus.CANCELLED]: 'Your order has been cancelled.',
    };
    await notification_1.default.saveAndSendNotification({
        userId: order.userId.toString(),
        title: `📦 Order Status Updated: ${payload.status}`,
        body: statusMessages[payload.status] || `Your order status has been updated to ${payload.status}`,
        type: 'order_status_updated',
        clickUrl: `/library/orders/${order._id}`,
        priority: 'medium'
    }, 'user', { push_notification: true, email_notification: true });
    await Admin_model_1.AuditLogModel.create({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: types_1.AuditAction.ORDER_UPDATED,
        targetType: 'order',
        targetId: order._id,
        meta: {
            orderNumber: order.orderNumber,
            oldStatus,
            newStatus: payload.status,
            trackingNumber: payload.trackingNumber,
        },
    }).catch(() => null);
    return order;
}
async function updatePaymentStatus(orderId, paymentStatus, paymentRef) {
    const order = await BookOrder_model_1.BookOrderModel.findById(orderId);
    if (!order)
        throw new error_1.AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    order.paymentStatus = paymentStatus;
    if (paymentRef)
        order.paymentRef = paymentRef;
    // If payment is paid and order was pending, automatically start processing
    if (paymentStatus === 'paid' && order.status === library_types_1.OrderStatus.PENDING) {
        order.status = library_types_1.OrderStatus.PROCESSING;
    }
    await order.save();
    // Notify user of payment status
    if (paymentStatus === 'paid') {
        await notification_1.default.saveAndSendNotification({
            userId: order.userId.toString(),
            title: '💰 Payment Successful',
            body: `Your payment for "${order.bookTitle}" (Order #${order.orderNumber}) has been confirmed.`,
            type: 'payment_confirmed',
            clickUrl: `/library/orders/${order._id}`,
            priority: 'high'
        }, 'user', { push_notification: true, email_notification: true });
    }
    else if (paymentStatus === 'failed') {
        await notification_1.default.saveAndSendNotification({
            userId: order.userId.toString(),
            title: '❌ Payment Failed',
            body: `Your payment for "${order.bookTitle}" (Order #${order.orderNumber}) has failed. Please try again.`,
            type: 'payment_failed',
            clickUrl: `/library/orders/${order._id}`,
            priority: 'high'
        }, 'user', { push_notification: true, email_notification: true });
    }
    return order;
}
// ==================== USER-FACING SERVICES ====================
async function getUserOrders(userId, page = 1, pageSize = 20) {
    const filter = { userId: new mongoose_1.Types.ObjectId(userId) };
    const skip = (page - 1) * pageSize;
    const [orders, total] = await Promise.all([
        BookOrder_model_1.BookOrderModel.find(filter)
            .sort({ orderedAt: -1 })
            .skip(skip)
            .limit(pageSize),
        BookOrder_model_1.BookOrderModel.countDocuments(filter),
    ]);
    return {
        data: orders,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
async function incrementBookDownload(bookId) {
    const book = await Book_model_1.BookModel.findById(bookId);
    if (!book)
        throw new error_1.AppError('Book not found', 404, 'BOOK_NOT_FOUND');
    await book.incrementDownloadCount();
}
//# sourceMappingURL=library.service.js.map