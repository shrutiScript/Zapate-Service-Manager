import { Router } from 'express';
import { DeviceController } from './device.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireModule } from '../../middleware/moduleAccessMiddleware.js';

const router = Router();
const controller = new DeviceController();

router.use(authMiddleware);
router.use(requireModule('devices'));

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.delete);

export { router as deviceRoutes };
