"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const learnController = __importStar(require("../controllers/learn.controller"));
const moduleController = __importStar(require("../controllers/module.controller"));
const router = (0, express_1.Router)();
// Public routes (optional auth)
router.get('/material/:slug', learnController.getFullMaterial);
router.get('/modules', auth_middleware_1.optionalAuth, learnController.listLearnModules);
router.get('/modules/:slug', auth_middleware_1.optionalAuth, learnController.getLearnModuleBySlug);
router.get('/modules/:moduleSlug/topics/:topicSlug', auth_middleware_1.optionalAuth, learnController.getLearnTopicBySlug);
router.get('/featured-topics', learnController.getFeaturedTopics);
router.get('/modules/:moduleId/topics', moduleController.listTopicsHandler);
router.get('/modules/:moduleId/subtopics', moduleController.listSubTopicsHandler);
// Protected routes (require authentication)
router.use(auth_middleware_1.protect);
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
exports.default = router;
//# sourceMappingURL=learn.routes.js.map