import { Types } from 'mongoose';
import { BookModel } from '../models/Book.model';
import { BookOrderModel } from '../models/BookOrder.model';
import { AuditLogModel } from '../models/Admin.model';
import { AuditAction } from '../models/types';
import { AppError } from '../middleware/error';
import {
  IBook,
  IBookOrder,
  ILibraryStats,
  ListBooksParams,
  ListOrdersParams,
  UpdateBookPayload,
  UpdateOrderStatusPayload,
  CreateOrderInput,
  BookStatus,
  OrderStatus,
} from '../models/types/library.types';

interface AdminCtx {
  adminId: string;
  adminName: string;
}

// ==================== BOOK SERVICES ====================

export async function listBooks(params: ListBooksParams = {}) {
  const {
    category,
    format,
    status,
    featured,
    search,
    page = 1,
    pageSize = 20,
  } = params;

  const filter: Record<string, unknown> = {};

  if (category) filter.category = category;
  if (format) filter.format = format;
  if (status) filter.status = status;
  if (featured !== undefined) filter.featured = featured;

  if (search?.trim()) {
    filter.$text = { $search: search.trim() };
  }

  const skip = (page - 1) * pageSize;

  const [books, total] = await Promise.all([
    BookModel.find(filter)
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
    BookModel.countDocuments(filter),
  ]);

  return {
    data: books,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getBookById(bookId: string) {
  const book = await BookModel.findById(bookId);
  if (!book) throw new AppError('Book not found', 404, 'BOOK_NOT_FOUND');
  return book;
}

export async function createBook(
  input: Partial<IBook>,
  admin: AdminCtx
): Promise<IBook> {
  // Validate ISBN uniqueness
  if (input.isbn) {
    const existing = await BookModel.findOne({ isbn: input.isbn });
    if (existing) {
      throw new AppError('Book with this ISBN already exists', 400, 'DUPLICATE_ISBN');
    }
  }

  // Validate physical price for physical/both formats
  if ((input.format === 'physical' || input.format === 'both') && !input.pricePhysical) {
    throw new AppError('Price is required for physical books', 400, 'PRICE_REQUIRED');
  }

  // Validate PDF URL for pdf/both formats
  if ((input.format === 'pdf' || input.format === 'both') && !input.pdfUrl) {
    throw new AppError('PDF URL is required for digital books', 400, 'PDF_URL_REQUIRED');
  }

  const book = await BookModel.create({
    ...input,
    createdBy: new Types.ObjectId(admin.adminId),
  });

  await AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.BOOK_CREATED,
    targetType: 'book',
    targetId: book._id,
    meta: { title: book.title, isbn: book.isbn },
  }).catch(() => null);

  return book;
}

export async function updateBook(
  payload: UpdateBookPayload,
  admin: AdminCtx
): Promise<IBook> {
  const book = await BookModel.findById(payload.id);
  if (!book) throw new AppError('Book not found', 404, 'BOOK_NOT_FOUND');

  const oldData = {
    title: book.title,
    pricePhysical: book.pricePhysical,
    featured: book.featured,
    status: book.status,
  };

  Object.assign(book, payload.updates);
  await book.save();

  await AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.BOOK_UPDATED,
    targetType: 'book',
    targetId: book._id,
    meta: { old: oldData, new: payload.updates },
  }).catch(() => null);

  return book;
}

export async function deleteBook(bookId: string, admin: AdminCtx): Promise<void> {
  const book = await BookModel.findById(bookId);
  if (!book) throw new AppError('Book not found', 404, 'BOOK_NOT_FOUND');

  // Check if there are pending orders
  const pendingOrders = await BookOrderModel.countDocuments({
    bookId: new Types.ObjectId(bookId),
    status: { $in: [OrderStatus.PENDING, OrderStatus.PROCESSING] },
  });

  if (pendingOrders > 0) {
    throw new AppError(
      `Cannot delete book with ${pendingOrders} pending orders. Cancel or fulfill orders first.`,
      400,
      'BOOK_HAS_ORDERS'
    );
  }

  await book.deleteOne();

  await AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.BOOK_DELETED,
    targetType: 'book',
    targetId: book._id,
    meta: { title: book.title, isbn: book.isbn },
  }).catch(() => null);
}

export async function toggleBookFeatured(bookId: string, admin: AdminCtx): Promise<{ featured: boolean }> {
  const book = await BookModel.findById(bookId);
  if (!book) throw new AppError('Book not found', 404, 'BOOK_NOT_FOUND');

  book.featured = !book.featured;
  await book.save();

  await AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.BOOK_UPDATED,
    targetType: 'book',
    targetId: book._id,
    meta: { action: 'toggle_featured', featured: book.featured },
  }).catch(() => null);

  return { featured: book.featured };
}

export async function toggleBookStatus(bookId: string, admin: AdminCtx): Promise<{ status: BookStatus }> {
  const book = await BookModel.findById(bookId);
  if (!book) throw new AppError('Book not found', 404, 'BOOK_NOT_FOUND');

  book.status = book.status === BookStatus.ACTIVE ? BookStatus.INACTIVE : BookStatus.ACTIVE;
  await book.save();

  await AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.BOOK_UPDATED,
    targetType: 'book',
    targetId: book._id,
    meta: { action: 'toggle_status', status: book.status },
  }).catch(() => null);

  return { status: book.status };
}

export async function getLibraryStats(): Promise<ILibraryStats> {
  const [
    totalBooks,
    activeBooks,
    totalDownloads,
    totalOrders,
    pendingOrders,
    totalRevenue,
    featuredBooksCount,
  ] = await Promise.all([
    BookModel.countDocuments(),
    BookModel.countDocuments({ status: BookStatus.ACTIVE }),
    BookModel.aggregate([{ $group: { _id: null, total: { $sum: '$downloadCount' } } }]),
    BookOrderModel.countDocuments(),
    BookOrderModel.countDocuments({ status: { $in: [OrderStatus.PENDING, OrderStatus.PROCESSING] } }),
    BookOrderModel.aggregate([
      { $match: { status: { $ne: OrderStatus.CANCELLED } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    BookModel.countDocuments({ featured: true, status: BookStatus.ACTIVE }),
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

export async function listOrders(params: ListOrdersParams = {}) {
  const {
    status,
    search,
    startDate,
    endDate,
    page = 1,
    pageSize = 20,
  } = params;

  const filter: Record<string, any> = {};

  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.orderedAt = {};
    if (startDate) filter.orderedAt.$gte = startDate;
    if (endDate) filter.orderedAt.$lte = endDate;
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
    BookOrderModel.find(filter)
      .sort({ orderedAt: -1 })
      .skip(skip)
      .limit(pageSize),
    BookOrderModel.countDocuments(filter),
  ]);

  return {
    data: orders,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getOrderById(orderId: string) {
  const order = await BookOrderModel.findById(orderId);
  if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
  return order;
}

export async function createOrder(
  userId: string,
  input: CreateOrderInput
): Promise<IBookOrder> {
  const book = await BookModel.findById(input.bookId);
  if (!book) throw new AppError('Book not found', 404, 'BOOK_NOT_FOUND');

  // Validate stock
  if (book.format !== 'pdf' && book.stockCount !== null && book.stockCount < input.quantity) {
    throw new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK');
  }

  const totalAmount = (book.pricePhysical || 0) * input.quantity;
  const year = new Date().getFullYear();
  const count = await BookOrderModel.countDocuments();
  const orderNumber = `ORD-${year}-${String(count + 1).padStart(6, '0')}`;

  const order = await BookOrderModel.create({
    orderNumber,
    bookId: new Types.ObjectId(input.bookId),
    bookTitle: book.title,
    coverUrl: book.coverUrl,
    userId: new Types.ObjectId(userId),
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

  return order;
}

export async function updateOrderStatus(
  payload: UpdateOrderStatusPayload,
  admin: AdminCtx
): Promise<IBookOrder> {
  const order = await BookOrderModel.findById(payload.orderId);
  if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

  const oldStatus = order.status;
  await order.updateStatus(payload.status, payload.trackingNumber);

  await AuditLogModel.create({
    adminId: admin.adminId,
    adminName: admin.adminName,
    action: AuditAction.ORDER_UPDATED,
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

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: 'pending' | 'paid' | 'failed',
  paymentRef?: string
): Promise<IBookOrder> {
  const order = await BookOrderModel.findById(orderId);
  if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

  order.paymentStatus = paymentStatus;
  if (paymentRef) order.paymentRef = paymentRef;

  // If payment is paid and order was pending, automatically start processing
  if (paymentStatus === 'paid' && order.status === OrderStatus.PENDING) {
    order.status = OrderStatus.PROCESSING;
  }

  await order.save();
  return order;
}

// ==================== USER-FACING SERVICES ====================

export async function getUserOrders(
  userId: string,
  page: number = 1,
  pageSize: number = 20
) {
  const filter = { userId: new Types.ObjectId(userId) };
  const skip = (page - 1) * pageSize;

  const [orders, total] = await Promise.all([
    BookOrderModel.find(filter)
      .sort({ orderedAt: -1 })
      .skip(skip)
      .limit(pageSize),
    BookOrderModel.countDocuments(filter),
  ]);

  return {
    data: orders,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function incrementBookDownload(bookId: string): Promise<void> {
  const book = await BookModel.findById(bookId);
  if (!book) throw new AppError('Book not found', 404, 'BOOK_NOT_FOUND');
  await book.incrementDownloadCount();
}