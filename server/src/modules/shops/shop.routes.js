import { Router } from 'express';
import { ShopController } from './shop.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireRoles } from '../../middleware/roleMiddleware.js';

const router = Router();
const controller = new ShopController();

// ── Public / Semi-Public Subscription & Renewal Endpoints ──
// Allowed before global strict auth so expired workshop owners can inspect & renew their plan
router.get('/:id/subscription', controller.getSubscription);
router.post('/:id/renew', controller.renewSubscription);

router.use(authMiddleware);

router.get('/', requireRoles('SUPER_ADMIN'), controller.getAll);
router.post('/', requireRoles('SUPER_ADMIN'), controller.create);
router.post('/setup', requireRoles('SHOP_OWNER'), controller.completeSetup);

// Workshop-specific Module Management Endpoints (Super Admin Only)
router.get('/:id/modules', requireRoles('SUPER_ADMIN'), controller.getModules);
router.patch('/:id/modules', requireRoles('SUPER_ADMIN'), controller.updateModules);
router.put('/:id/modules', requireRoles('SUPER_ADMIN'), controller.updateModules);

// Super Admin Subscription Extension / Override
router.post('/:id/extend-subscription', requireRoles('SUPER_ADMIN'), controller.extendSubscription);

router.get('/:id', controller.getById);
router.patch('/:id', requireRoles('SUPER_ADMIN', 'SHOP_OWNER'), controller.update);

// Workshop Block & Unblock Endpoints
router.post('/:id/block', requireRoles('SUPER_ADMIN'), controller.blockWorkshop);
router.patch('/:id/block', requireRoles('SUPER_ADMIN'), controller.blockWorkshop);
router.post('/:id/unblock', requireRoles('SUPER_ADMIN'), controller.unblockWorkshop);
router.patch('/:id/unblock', requireRoles('SUPER_ADMIN'), controller.unblockWorkshop);

router.delete('/:id', requireRoles('SUPER_ADMIN'), controller.delete);

export { router as shopRoutes };
