import { Router } from 'express';
import { UsedMobileController } from './usedMobile.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireModule } from '../../middleware/moduleAccessMiddleware.js';

const router = Router();
const controller = new UsedMobileController();

router.use(authMiddleware);
router.use(requireModule('used-mobiles'));

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.post('/:id/sell', controller.sell);
router.delete('/:id', controller.delete);

export { router as usedMobileRoutes };
