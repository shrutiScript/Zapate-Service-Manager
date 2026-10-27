import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireModule } from '../../middleware/moduleAccessMiddleware.js';

const router = Router();
const controller = new NotificationController();

router.use(authMiddleware);

// In-App notifications retrieval and status management (for bell dropdown and notification center)
router.get('/', controller.getAll);
router.patch('/read-all', controller.markAllAsRead);
router.patch('/:id/read', controller.markAsRead);
router.delete('/:id', controller.delete);

// Outbound customer dispatch (SMS / WhatsApp campaign messages)
router.post('/send', requireModule('notifications'), controller.send);
router.get('/templates', requireModule('notifications'), controller.getTemplates);

export { router as notificationRoutes };
