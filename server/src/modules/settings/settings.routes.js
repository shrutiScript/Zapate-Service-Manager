import { Router } from 'express';
import { SettingsController } from './settings.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireModule } from '../../middleware/moduleAccessMiddleware.js';
import { requireRoles } from '../../middleware/roleMiddleware.js';

const router = Router();
const controller = new SettingsController();

router.use(authMiddleware);
router.use(requireModule('settings'));

router.get('/', controller.get);
router.post('/', requireRoles('SUPER_ADMIN', 'SHOP_OWNER', 'MANAGER'), controller.update);
router.put('/', requireRoles('SUPER_ADMIN', 'SHOP_OWNER', 'MANAGER'), controller.update);
router.patch('/', requireRoles('SUPER_ADMIN', 'SHOP_OWNER', 'MANAGER'), controller.update);
router.post('/logo', requireRoles('SUPER_ADMIN', 'SHOP_OWNER', 'MANAGER'), controller.uploadLogo);

export { router as settingsRoutes };
