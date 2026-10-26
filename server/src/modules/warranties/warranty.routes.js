import { Router } from 'express';
import { WarrantyController } from './warranty.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireModule } from '../../middleware/moduleAccessMiddleware.js';

const router = Router();
const controller = new WarrantyController();

router.use(authMiddleware);
router.use(requireModule('warranties'));

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/from-repair/:repairId', controller.createFromRepair);
router.patch('/:id', controller.update);
router.post('/:id/void', controller.voidWarranty);

export { router as warrantyRoutes };
