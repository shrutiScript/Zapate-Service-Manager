import { Router } from 'express';
import { RepairController } from './repair.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireModule } from '../../middleware/moduleAccessMiddleware.js';

const router = Router();
const controller = new RepairController();

router.use(authMiddleware);
router.use(requireModule('repairs'));

router.get('/', controller.getAll);
router.get('/:id/reveal-credential', controller.revealCredential);
router.delete('/:id/credential', controller.deleteCredential);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id/status', controller.updateStatus);
router.put('/:id/status', controller.updateStatus);
router.patch('/:id', controller.updateStatus);
router.put('/:id', controller.updateStatus);
router.post('/:id/parts', controller.allocatePart);
router.post('/:id/generate-invoice', controller.generateInvoice);
router.delete('/:id', controller.delete);

export { router as repairRoutes };
