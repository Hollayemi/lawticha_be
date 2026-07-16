import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';
import {
  listBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  toggleBookFeatured,
  toggleBookStatus,
  getLibraryStats,
  listOrders,
  getOrderById,
  updateOrderStatus,
  getUserOrders,
  incrementBookDownload,
  createOrder,
} from '../services/library.service';
import { BookStatus } from '../models/types/library.types';
import CloudinaryService from '../utils/cloudinary';
import PaymentGateway from '../services/payment/payment';
import { generateOrderSlug } from '../utils/functions';

function adminCtx(req: Request) {
  return { adminId: req.admin!.id, adminName: req.admin!.name };
}

// ==================== USER-FACING ROUTES ====================

// GET /api/v1/books - List books (public)
export const listBooksHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { category, format, featured, search, page, pageSize } = req.query as Record<string, string>;

    const result = await listBooks({
      category: category as any,
      format: format as any,
      featured: featured !== undefined ? featured === 'true' : undefined,
      status: BookStatus.ACTIVE,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    return (res as AppResponse).data(result, 'Books fetched successfully');
  }
);

// GET /api/v1/books/:id - Get book by ID (public)
export const getBookByIdHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const book = await getBookById(req.params.id);
    return (res as AppResponse).data({ book }, 'Book fetched successfully');
  }
);

// GET /api/v1/books/stats - Get library stats (public)
export const getLibraryStatsHandler = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await getLibraryStats();
    return (res as AppResponse).data(stats, 'Stats fetched successfully');
  }
);

// POST /api/v1/books/:id/download - Increment download count
export const downloadBookHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    await incrementBookDownload(req.params.id);
    return (res as AppResponse).success('Download count incremented');
  }
);

// POST /api/v1/orders - Create new order
export const createOrderHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { bookId, quantity, deliveryAddress, state, name, email, phone, notes } = req.body;

    if(!req.user) return next(new AppError('Invalid User', 400, 'VALIDATION_ERROR'));

    if (!bookId) return next(new AppError('Book ID is required', 400, 'VALIDATION_ERROR'));
    if (!quantity || quantity < 1) return next(new AppError('Valid quantity is required', 400, 'VALIDATION_ERROR'));
    if (!deliveryAddress) return next(new AppError('Delivery address is required', 400, 'VALIDATION_ERROR'));
    if (!state) return next(new AppError('State is required', 400, 'VALIDATION_ERROR'));
    if (!name) return next(new AppError('Name is required', 400, 'VALIDATION_ERROR'));
    if (!email) return next(new AppError('Email is required', 400, 'VALIDATION_ERROR'));
    if (!phone) return next(new AppError('Phone is required', 400, 'VALIDATION_ERROR'));

    const order = await createOrder(req.user!._id.toString(), {
      bookId,
      quantity,
      deliveryAddress,
      state,
      name,
      email,
      phone,
      notes,
    });

    const orderSlug = order.orderNumber
    const paymentGateway = new PaymentGateway();
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
    }

    const paymentResult = await paymentGateway.initializePayment("paystack", paymentData);

    return (res as AppResponse).data({ order, payment: paymentResult }, 'Order created successfully');
  }
);

// GET /api/v1/orders/me - Get user's orders
export const getUserOrdersHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { page, pageSize } = req.query as Record<string, string>;
    const result = await getUserOrders(
      req.user!._id.toString(),
      page ? Number(page) : undefined,
      pageSize ? Number(pageSize) : undefined
    );
    return (res as AppResponse).data(result, 'Orders fetched successfully');
  }
);

// GET /api/v1/orders/:id - Get order by ID (user can view their own)
export const getUserOrderByIdHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const order = await getOrderById(req.params.id);

    // Check if order belongs to user
    if (order.userId.toString() !== req.user!._id.toString()) {
      return next(new AppError('Unauthorized to view this order', 403, 'FORBIDDEN'));
    }

    return (res as AppResponse).data(order, 'Order fetched successfully');
  }
);

// ==================== ADMIN ROUTES ====================

// GET /api/v1/admin/library/books - List all books (admin)
export const adminListBooksHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { category, format, status, featured, search, page, pageSize } = req.query as Record<string, string>;

    const result = await listBooks({
      category: category as any,
      format: format as any,
      status: status as any,
      featured: featured !== undefined ? featured === 'true' : undefined,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    return (res as AppResponse).data(result, 'Books fetched successfully');
  }
);

// GET /api/v1/admin/library/stats - Get library stats (admin)
export const adminGetLibraryStatsHandler = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await getLibraryStats();
    return (res as AppResponse).data(stats, 'Stats fetched successfully');
  }
);

// GET /api/v1/admin/library/books/:id - Get book by ID (admin)
export const adminGetBookByIdHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const book = await getBookById(req.params.id);
    return (res as AppResponse).data({ book }, 'Book fetched successfully');
  }
);

// POST /api/v1/admin/library/books - Create book (admin)
export const adminCreateBookHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      title, author, description, category, coverUrl, pdfUrl,
      format, pricePhysical, totalPages, isbn, publishedYear,
      tags, stockCount, featured, status, pdfFile, coverFile
    } = req.body;

    console.log(pdfFile)

    if (!title) return next(new AppError('Title is required', 400, 'VALIDATION_ERROR'));
    if (!author) return next(new AppError('Author is required', 400, 'VALIDATION_ERROR'));
    if (!description) return next(new AppError('Description is required', 400, 'VALIDATION_ERROR'));
    if (!category) return next(new AppError('Category is required', 400, 'VALIDATION_ERROR'));
    if (!format) return next(new AppError('Format is required', 400, 'VALIDATION_ERROR'));
    if (!totalPages) return next(new AppError('Total pages is required', 400, 'VALIDATION_ERROR'));
    if (!isbn) return next(new AppError('ISBN is required', 400, 'VALIDATION_ERROR'));
    if (!publishedYear) return next(new AppError('Published year is required', 400, 'VALIDATION_ERROR'));
    if (!coverUrl && !coverFile) return next(new AppError('Upload at least one cover File', 400, 'VALIDATION_ERROR'));
    if (!pdfUrl && !pdfFile) return next(new AppError('Upload at least one PDF File', 400, 'VALIDATION_ERROR'));

    const getCoverUrlFromFile = coverUrl || (await CloudinaryService.uploadFile(coverFile, "books/covers", 'image')).url
    const getPDFUrlFromFile = pdfUrl || (await CloudinaryService.uploadFile(pdfFile, "books/pdfs", 'raw')).url

    const book = await createBook({
      title, author, description, category, coverUrl: getCoverUrlFromFile, pdfUrl: getPDFUrlFromFile,
      format, pricePhysical, totalPages, isbn, publishedYear,
      tags, stockCount, featured, status,
    }, adminCtx(req));

    return (res as AppResponse).data({ book }, 'Book created successfully');
  }
);

// PATCH /api/v1/admin/library/books/:id - Update book (admin)
export const adminUpdateBookHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { updates } = req.body;
    const result = await updateBook({ id: req.params.id, updates }, adminCtx(req));
    return (res as AppResponse).data({ book: result }, 'Book updated successfully');
  }
);

// DELETE /api/v1/admin/library/books/:id - Delete book (admin)
export const adminDeleteBookHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    await deleteBook(req.params.id, adminCtx(req));
    return (res as AppResponse).success('Book deleted successfully');
  }
);

// PATCH /api/v1/admin/library/books/:id/featured - Toggle featured (admin)
export const adminToggleBookFeaturedHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await toggleBookFeatured(req.params.id, adminCtx(req));
    return (res as AppResponse).data(result, 'Featured status toggled');
  }
);

// PATCH /api/v1/admin/library/books/:id/status - Toggle status (admin)
export const adminToggleBookStatusHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await toggleBookStatus(req.params.id, adminCtx(req));
    return (res as AppResponse).data(result, 'Book status toggled');
  }
);

// GET /api/v1/admin/library/orders - List orders (admin)
export const adminListOrdersHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { status, search, startDate, endDate, page, pageSize } = req.query as Record<string, string>;

    const result = await listOrders({
      status: status as any,
      search,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    return (res as AppResponse).data(result, 'Orders fetched successfully');
  }
);

// GET /api/v1/admin/library/orders/:id - Get order by ID (admin)
export const adminGetOrderByIdHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const order = await getOrderById(req.params.id);
    return (res as AppResponse).data({ order }, 'Order fetched successfully');
  }
);

// PATCH /api/v1/admin/library/orders/:id/status - Update order status (admin)
export const adminUpdateOrderStatusHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { status, trackingNumber } = req.body;

    if (!status) return next(new AppError('Status is required', 400, 'VALIDATION_ERROR'));

    const order = await updateOrderStatus({
      orderId: req.params.id,
      status,
      trackingNumber,
    }, adminCtx(req));

    return (res as AppResponse).data({ order }, 'Order status updated');
  }
);