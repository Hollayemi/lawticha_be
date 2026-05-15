import { Router } from 'express';
import { protect, optionalAuth } from '../middleware/auth.middleware';
import * as learnController from '../controllers/learn.controller';
import * as moduleController from '../controllers/module.controller';

const router = Router();

router.get('/modules', optionalAuth, learnController.listLearnModules);
router.get('/modules/:slug', optionalAuth, learnController.getLearnModuleBySlug);
router.get('/modules/:moduleSlug/topics/:topicSlug', optionalAuth, learnController.getLearnTopicBySlug);
router.get('/featured-topics', learnController.getFeaturedTopics);
router.get('/modules/:moduleId/topics', moduleController.listTopicsHandler);
router.get('/modules/:moduleId/subtopics', moduleController.listSubTopicsHandler);

router.use(protect)
router.get('/continue-reading', learnController.getContinueReading);
router.post('/modules/:moduleId/save', learnController.toggleSaveModule);
router.post('/modules/:moduleId/enrol', learnController.enrolInModule);
router.post('/modules/:moduleId/topics/:topicId/complete', learnController.markTopicComplete);
router.patch('/modules/:moduleId/topics/:topicId/progress', learnController.saveVideoProgress);

export default router;
