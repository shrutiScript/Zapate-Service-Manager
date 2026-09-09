import { Router } from 'express';
import { SupplierController } from './supplier.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireModule } from '../../middleware/moduleAccessMiddleware.js';

const router = Router();
const controller = new SupplierController();

router.use(authMiddleware);
router.use(requireModule('suppliers'));

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.delete);

export { router as supplierRoutes };
