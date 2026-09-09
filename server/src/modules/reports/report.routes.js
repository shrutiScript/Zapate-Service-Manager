import { Router } from 'express';
import { ReportController } from './report.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = Router();
const controller = new ReportController();

router.use(authMiddleware);

router.get('/dashboard', controller.getDashboardStats);
router.get('/dashboard-stats', controller.getDashboardStats);
router.get('/analytics', controller.getAnalytics);
router.get('/', controller.getReports);

export { router as reportRoutes };
