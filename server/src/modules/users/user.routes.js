import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireRoles } from '../../middleware/roleMiddleware.js';

const router = Router();
const controller = new UserController();

router.use(authMiddleware);

router.get('/profile', controller.getById);
router.put('/profile', controller.updateProfile);
router.post('/change-password', controller.changePassword);

router.get('/', requireRoles('SUPER_ADMIN'), controller.getAll);
router.get('/:id', controller.getById);
router.post('/', requireRoles('SUPER_ADMIN'), controller.create);
router.put('/:id', requireRoles('SUPER_ADMIN'), controller.update);
router.patch('/:id', requireRoles('SUPER_ADMIN'), controller.update);

// Super Admin User Governance Endpoints
router.patch('/:id/toggle', requireRoles('SUPER_ADMIN'), controller.toggleStatus);
router.post('/:id/reset-password', requireRoles('SUPER_ADMIN'), controller.resetPassword);
router.post('/:id/force-logout', requireRoles('SUPER_ADMIN'), controller.forceLogout);

router.delete('/:id', requireRoles('SUPER_ADMIN'), controller.delete);

export { router as userRoutes };
