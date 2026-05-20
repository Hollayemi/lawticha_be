// routes/library.admin.routes.ts (Admin routes)
import { Router } from 'express';
import { protectAdmin } from '../../middleware/adminAuth';
import {
  adminListBooksHandler,
  adminGetLibraryStatsHandler,
  adminGetBookByIdHandler,
  adminCreateBookHandler,
  adminUpdateBookHandler,
  adminDeleteBookHandler,
  adminToggleBookFeaturedHandler,
  adminToggleBookStatusHandler,
  adminListOrdersHandler,
  adminGetOrderByIdHandler,
  adminUpdateOrderStatusHandler,
} from '../../controllers/library.controller';

const router = Router();

// All admin routes require admin authentication
router.use(protectAdmin);

// Books endpoints
router.get('/books', adminListBooksHandler);
router.get('/stats', adminGetLibraryStatsHandler);
router.get('/books/:id', adminGetBookByIdHandler);
router.post('/books', adminCreateBookHandler);
router.patch('/books/:id', adminUpdateBookHandler);
router.delete('/books/:id', adminDeleteBookHandler);
router.patch('/books/:id/featured', adminToggleBookFeaturedHandler);
router.patch('/books/:id/status', adminToggleBookStatusHandler);

// Orders endpoints
router.get('/orders', adminListOrdersHandler);
router.get('/orders/:id', adminGetOrderByIdHandler);
router.patch('/orders/:id/status', adminUpdateOrderStatusHandler);

export default router;