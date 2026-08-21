import { IBook, IBookOrder, ILibraryStats, ListBooksParams, ListOrdersParams, UpdateBookPayload, UpdateOrderStatusPayload, CreateOrderInput, BookStatus } from '../models/types/library.types';
interface AdminCtx {
    adminId: string;
    adminName: string;
}
export declare function listBooks(params?: ListBooksParams): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare function getBookById(bookId: string): Promise<any>;
export declare function createBook(input: Partial<IBook>, admin: AdminCtx): Promise<IBook>;
export declare function updateBook(payload: UpdateBookPayload, admin: AdminCtx): Promise<IBook>;
export declare function deleteBook(bookId: string, admin: AdminCtx): Promise<void>;
export declare function toggleBookFeatured(bookId: string, admin: AdminCtx): Promise<{
    featured: boolean;
}>;
export declare function toggleBookStatus(bookId: string, admin: AdminCtx): Promise<{
    status: BookStatus;
}>;
export declare function getLibraryStats(): Promise<ILibraryStats>;
export declare function listOrders(params?: ListOrdersParams): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare function getOrderById(orderId: string): Promise<any>;
export declare function createOrder(userId: string, input: CreateOrderInput): Promise<IBookOrder>;
export declare function updateOrderStatus(payload: UpdateOrderStatusPayload, admin: AdminCtx): Promise<IBookOrder>;
export declare function updatePaymentStatus(orderId: string, paymentStatus: 'pending' | 'paid' | 'failed', paymentRef?: string): Promise<IBookOrder>;
export declare function getUserOrders(userId: string, page?: number, pageSize?: number): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
export declare function incrementBookDownload(bookId: string): Promise<void>;
export {};
//# sourceMappingURL=library.service.d.ts.map