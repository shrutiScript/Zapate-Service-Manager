import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireModule } from '../../middleware/moduleAccessMiddleware.js';

const router = Router();
const controller = new InventoryController();

router.use(authMiddleware);
router.use(requireModule('inventory'));

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.post('/:id/adjust', controller.adjustStock);
router.delete('/:id', controller.delete);

export { router as inventoryRoutes };
