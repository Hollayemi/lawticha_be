import { Router } from 'express';
import { protect, optionalAuth } from '../middleware/auth.middleware';
import {
  listBooksHandler,
  getBookByIdHandler,
  getLibraryStatsHandler,
  downloadBookHandler,
  createOrderHandler,
  getUserOrdersHandler,
  getUserOrderByIdHandler,
} from '../controllers/library.controller';

const router = Router();

// Public routes
router.get('/books', optionalAuth, listBooksHandler);
router.get('/books/stats', getLibraryStatsHandler);
router.get('/books/:id', optionalAuth, getBookByIdHandler);

// Protected routes
router.use(protect);

// Book downloads
router.post('/books/:id/download', downloadBookHandler);

// Orders
router.post('/orders', createOrderHandler);
router.get('/orders/me', getUserOrdersHandler);
router.get('/orders/:id', getUserOrderByIdHandler);

export default router;