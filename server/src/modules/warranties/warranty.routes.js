import { Router } from 'express';
import { WarrantyController } from './warranty.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = Router();
const controller = new WarrantyController();

router.use(authMiddleware);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/from-repair/:repairId', controller.createFromRepair);
router.patch('/:id', controller.update);
router.post('/:id/void', controller.voidWarranty);

export { router as warrantyRoutes };
