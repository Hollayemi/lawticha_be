import { Types } from 'mongoose';

export enum BookFormat {
  PDF = 'pdf',
  PHYSICAL = 'physical',
  BOTH = 'both'
}

export enum BookStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft'
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum BookCategory {
  CRIMINAL = 'criminal',
  TENANCY = 'tenancy',
  EMPLOYMENT = 'employment',
  CONTRACTS = 'contracts',
  BUSINESS = 'business',
  FAMILY = 'family',
  CONSUMER = 'consumer',
  ROAD = 'road',
  CONSTITUTIONAL = 'constitutional'
}

export interface IBook {
  _id: Types.ObjectId;
  title: string;
  author: string;
  description: string;
  category: BookCategory;
  coverUrl: string | null;
  pdfUrl: string | null;
  format: BookFormat;
  pricePhysical: number | null;
  totalPages: number;
  isbn: string;
  publishedYear: number;
  tags: string[];
  downloadCount: number;
  orderCount: number;
  featured: boolean;
  stockCount: number | null;
  rating: number;
  reviewCount: number;
  status: BookStatus;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  bookId: Types.ObjectId;
  bookTitle: string;
  coverUrl: string | null;
  userId: Types.ObjectId;
  userName: string;
  userEmail: string;
  userPhone: string;
  deliveryAddress: string;
  state: string;
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  trackingNumber: string | null;
  paymentRef: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paidAt: string;
  transactionId: string;
  notes?: string;
  orderedAt: Date;
  updatedAt: Date;
}

export interface ILibraryStats {
  totalBooks: number;
  activeBooks: number;
  totalDownloads: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  featuredBooksCount: number;
}

export interface ListBooksParams {
  category?: BookCategory;
  format?: BookFormat;
  status?: BookStatus;
  featured?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListOrdersParams {
  status?: OrderStatus;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface UpdateBookPayload {
  id: string;
  updates: Partial<Pick<IBook, 'title' | 'author' | 'description' | 'category' | 'pricePhysical' | 'stockCount' | 'featured' | 'status'>>;
}

export interface UpdateOrderStatusPayload {
  orderId: string;
  status: OrderStatus;
  trackingNumber?: string;
}

export interface CreateOrderInput {
  bookId: string;
  quantity: number;
  deliveryAddress: string;
  state: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
}