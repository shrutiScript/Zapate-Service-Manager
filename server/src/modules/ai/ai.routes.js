import { Router } from 'express';
import { AiController } from './ai.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = Router();
const controller = new AiController();

// Require authentication for all AI diagnostic endpoints to enforce shop isolation
router.use(authMiddleware);

router.post('/diagnose', (req, res, next) => controller.diagnose(req, res, next));
router.post('/feedback', (req, res, next) => controller.recordFeedback(req, res, next));
router.post('/apply-to-job/:id', (req, res, next) => controller.applyToJob(req, res, next));
router.get('/procedures', (req, res, next) => controller.getProcedures(req, res, next));

export { router as aiRoutes };
