import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { requireInstructor } from '../middleware/instructorAuth';

import {
  requestInstructorHandler,
  getInstructorStatusHandler,
  getInstructorDashboardStatsHandler,
} from '../controllers/instructor.controller';

import {
  createMyModuleHandler,
  listMyModulesHandler,
  getMyModuleHandler,
  updateMyModuleHandler,
  deleteMyModuleHandler,
  submitMyModuleHandler,
  createMyTopicHandler,
  listTopicsHandler,
  updateMyTopicHandler,
  deleteMyTopicHandler,
  reorderMyTopicsHandler,
  createMySubTopicHandler,
  updateMySubTopicHandler,
  deleteMySubTopicHandler,
  reorderMySubTopicsHandler,
  getMyModuleAnalyticsHandler,
  getMyTopicsHandler,
} from '../controllers/module.controller';

const router = Router();

router.use(protect);

// ── Onboarding: any signed-in (verified) lawyer can apply ──────────────────
// POST /api/v1/instructor/request
router.post('/request', requestInstructorHandler);
// GET  /api/v1/instructor/status
router.get('/status', getInstructorStatusHandler);

// ── Everything below requires an APPROVED instructor ────────────────────────
router.use(requireInstructor);

// GET /api/v1/instructor/dashboard/stats
router.get('/dashboard/stats', getInstructorDashboardStatsHandler);

// GET  /api/v1/instructor/modules            - list own modules
// POST /api/v1/instructor/modules            - create a new draft module
router.route('/modules').get(listMyModulesHandler).post(createMyModuleHandler);

// GET    /api/v1/instructor/modules/:id      - fetch own module
// PATCH  /api/v1/instructor/modules/:id      - update own module (draft/rejected only)
// DELETE /api/v1/instructor/modules/:id      - delete own module (draft/rejected only)
router
  .route('/modules/:id')
  .get(getMyModuleHandler)
  .patch(updateMyModuleHandler)
  .delete(deleteMyModuleHandler);

// POST /api/v1/instructor/modules/:id/submit - submit for admin review
router.post('/modules/:id/submit', submitMyModuleHandler);

// GET /api/v1/instructor/modules/:moduleId/analytics - "how my content grows"
router.get('/modules/:moduleId/analytics', getMyModuleAnalyticsHandler);

// ── Topics, scoped to the instructor's own module ───────────────────────────
router.route('/modules/:moduleId/topics').post(createMyTopicHandler).get(getMyTopicsHandler);
router.patch('/modules/:moduleId/topics/reorder', reorderMyTopicsHandler);
router
  .route('/modules/:moduleId/topics/:topicId')
  .patch(updateMyTopicHandler)
  .delete(deleteMyTopicHandler);

// ── SubTopics, scoped to the instructor's own module ────────────────────────
router.route('/modules/:moduleId/topics/:topicId/subtopics').post(createMySubTopicHandler);
router.patch('/modules/:moduleId/topics/:topicId/subtopics/reorder', reorderMySubTopicsHandler);
router
  .route('/modules/:moduleId/topics/:topicId/subtopics/:subtopicId')
  .patch(updateMySubTopicHandler)
  .delete(deleteMySubTopicHandler);

export default router;
