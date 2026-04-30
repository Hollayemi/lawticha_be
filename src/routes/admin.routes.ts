import { Router } from 'express';
import { protect, superAdminOnly, superAdminOrGov, managementTier, seniorStaff } from '../middleware/auth';
import {
  // Stats
  getStatsHandler,
  // Governments
  createGovernmentHandler,
  getGovernmentsHandler,
  getGovernmentHandler,
  // LGAs
  createLGAHandler,
  getLGAsHandler,
  getLGAHandler,
  // Unions
  createUnionHandler,
  getUnionsHandler,
  getUnionHandler,
  // Sellers
  createSellerHandler,
  getSellersHandler,
  // Riders
  createRiderHandler,
  getRidersHandler,
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require a valid token
router.use(protect);

// ─── Stats (role-scoped — each role sees only their tier and below) ────────────
router.get('/stats', seniorStaff, getStatsHandler);

// ─── Governments ──────────────────────────────────────────────────────────────
// Only super admin can create / read government entities
router.post('/governments',    superAdminOnly,   createGovernmentHandler);
router.get('/governments',     superAdminOnly,   getGovernmentsHandler);
router.get('/governments/:id', superAdminOnly,   getGovernmentHandler);

// ─── LGAs ─────────────────────────────────────────────────────────────────────
// Super admin or government can create LGAs; management tier can read
router.post('/lgas',    superAdminOrGov,  createLGAHandler);
router.get('/lgas',     managementTier,   getLGAsHandler);
router.get('/lgas/:id', managementTier,   getLGAHandler);

// ─── Unions ───────────────────────────────────────────────────────────────────
// Government, LGA, or super admin can create unions; senior staff can read
router.post('/unions',    managementTier, createUnionHandler);
router.get('/unions',     seniorStaff,    getUnionsHandler);
router.get('/unions/:id', seniorStaff,    getUnionHandler);

// ─── Sellers ──────────────────────────────────────────────────────────────────
// Union (and above) can register sellers
router.post('/sellers', seniorStaff, createSellerHandler);
router.get('/sellers',  seniorStaff, getSellersHandler);

// ─── Riders ───────────────────────────────────────────────────────────────────
// Union (and above) can register riders
router.post('/riders', seniorStaff, createRiderHandler);
router.get('/riders',  seniorStaff, getRidersHandler);

export default router;
