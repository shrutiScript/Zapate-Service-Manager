import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireModule } from '../../middleware/moduleAccessMiddleware.js';

const router = Router();
const controller = new NotificationController();

router.use(authMiddleware);
router.use(requireModule('notifications'));

router.get('/', controller.getAll);
router.post('/send', controller.send);
router.get('/templates', controller.getTemplates);
router.delete('/:id', controller.delete);

export { router as notificationRoutes };
