import { Router } from 'express';
import { protect, optionalAuth } from '../middleware/auth.middleware';
import * as learnController from '../controllers/learn.controller';
import * as moduleController from '../controllers/module.controller';

const router = Router();

// Public routes (optional auth)
router.get('/material/:slug', learnController.getFullMaterial);

router.get('/modules', optionalAuth, learnController.listLearnModules);
router.get('/modules/:slug', optionalAuth, learnController.getLearnModuleBySlug);
router.get('/modules/:moduleSlug/topics/:topicSlug', optionalAuth, learnController.getLearnTopicBySlug);
router.get('/featured-topics', learnController.getFeaturedTopics);
router.get('/modules/:moduleId/topics', moduleController.listTopicsHandler);
router.get('/modules/:moduleId/subtopics', moduleController.listSubTopicsHandler);

// Protected routes (require authentication)
router.use(protect);

// Learning progress routes
router.get('/continue-reading', learnController.getContinueReading);
router.post('/modules/:moduleId/save', learnController.toggleSaveModule);
router.post('/modules/:moduleId/enrol', learnController.enrolInModule);
router.post('/modules/:moduleId/topics/:topicId/complete', learnController.markTopicComplete);
router.patch('/modules/:moduleId/topics/:topicId/progress', learnController.saveVideoProgress);

// ============================================
// SUBTOPIC INTERACTION ROUTES
// ============================================

router.post('/subtopics/:subtopicId/like', learnController.toggleLikeSubtopic);
// Subtopic complete
router.post('/subtopics/:subtopicId/complete', learnController.toggleCompleteSubtopic);
// Subtopic state
router.get('/subtopics/:subtopicId/state', learnController.getSubtopicState);
// ============================================
// ============================================
// BOOKMARK ROUTES
// ============================================
// ============================================
// Get all bookmarks for the authenticated user (with pagination)
router.get('/bookmarks', learnController.listMyBookmarks);

// Get a single bookmark by ID
router.get('/bookmarks/:bookmarkId', learnController.getBookmarkById);

// Update a bookmark
router.put('/bookmarks/:bookmarkId', learnController.updateBookmark);

// Delete a bookmark
router.delete('/bookmarks/:bookmarkId', learnController.deleteBookmark);

// Get all bookmarks for a specific subtopic
router.get('/subtopics/:subtopicId/bookmarks', learnController.listBookmarksForSubtopic);

// Create a bookmark for a subtopic
router.post('/subtopics/:subtopicId/bookmarks', learnController.createBookmark);

export default router;