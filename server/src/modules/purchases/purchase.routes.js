import { Router } from 'express';
import { PurchaseController } from './purchase.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireModule } from '../../middleware/moduleAccessMiddleware.js';

const router = Router();
const controller = new PurchaseController();

router.use(authMiddleware);
router.use(requireModule('purchases'));

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);

export { router as purchaseRoutes };
